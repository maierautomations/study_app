import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scoreToGermanGrade } from "@/lib/grading";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { examId, answers } = await request.json();

  if (!examId || !Array.isArray(answers)) {
    return NextResponse.json(
      { error: "Fehlende Parameter" },
      { status: 400 }
    );
  }

  // Fetch the exam attempt
  const { data: examRaw } = await supabase
    .from("exam_attempts")
    .select("*")
    .eq("id", examId)
    .eq("user_id", user.id)
    .single();
  const exam = examRaw as unknown as {
    id: string;
    total_points: number;
    questions: Array<{
      id: string;
      correct_answer: string;
      points: number;
      question_type: string;
    }>;
  } | null;

  if (!exam) {
    return NextResponse.json(
      { error: "Klausur nicht gefunden" },
      { status: 404 }
    );
  }

  // Grade each answer
  const questionMap = new Map(exam.questions.map((q) => [q.id, q]));
  let earnedPoints = 0;
  const gradedAnswers = answers.map(
    (a: { question_id: string; selected_answer: string }) => {
      const question = questionMap.get(a.question_id);
      if (!question) {
        return { ...a, is_correct: false, points_earned: 0 };
      }

      let isCorrect = false;
      if (question.question_type === "free_text") {
        // Case-insensitive comparison, trim whitespace
        isCorrect =
          a.selected_answer.trim().toLowerCase() ===
          question.correct_answer.trim().toLowerCase();
      } else {
        isCorrect = a.selected_answer === question.correct_answer;
      }

      const pointsEarned = isCorrect ? question.points : 0;
      earnedPoints += pointsEarned;

      return {
        question_id: a.question_id,
        selected_answer: a.selected_answer,
        is_correct: isCorrect,
        points_earned: pointsEarned,
      };
    }
  );

  const score =
    exam.total_points > 0
      ? Math.round((earnedPoints / exam.total_points) * 100)
      : 0;
  const grade = scoreToGermanGrade(score);

  // Update exam attempt
  const { error: updateError } = await supabase
    .from("exam_attempts")
    .update({
      answers: gradedAnswers,
      score,
      grade,
      earned_points: earnedPoints,
      completed_at: new Date().toISOString(),
    } as never)
    .eq("id", examId)
    .eq("user_id", user.id);

  if (updateError) {
    console.error("Exam update error:", updateError);
    return NextResponse.json(
      { error: "Klausur konnte nicht gespeichert werden" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    score,
    grade,
    earnedPoints,
    totalPoints: exam.total_points,
    answers: gradedAnswers,
  });
}
