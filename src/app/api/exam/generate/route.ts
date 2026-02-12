import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getModel } from "@/lib/ai/provider";
import { generateObject } from "ai";
import { z } from "zod";
import {
  checkFreemiumLimit,
  incrementUsage,
  getFreemiumErrorMessage,
} from "@/lib/freemium";

const ExamOutputSchema = z.object({
  questions: z.array(
    z.object({
      question_text: z.string(),
      question_type: z.enum(["multiple_choice", "true_false", "free_text"]),
      options: z.array(
        z.object({
          label: z.string(),
          text: z.string(),
          is_correct: z.boolean(),
        })
      ),
      correct_answer: z.string(),
      explanation: z.string(),
      points: z.number(),
    })
  ),
});

function getWeaknessPrompt(
  weakDocNames: string[]
): string {
  if (weakDocNames.length === 0) return "";
  return `\n\nDer Studierende hat Schwächen in folgenden Themenbereichen (bitte stärker gewichten, mehr Fragen dazu stellen):
${weakDocNames.map((n) => `- ${n}`).join("\n")}`;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  // Freemium limit check
  const freemium = await checkFreemiumLimit(user.id);
  if (!freemium.allowed) {
    return NextResponse.json(
      { error: getFreemiumErrorMessage(freemium.used, freemium.limit) },
      { status: 402 }
    );
  }

  const { courseId, timeLimitMinutes, questionCount } = await request.json();

  if (!courseId || !timeLimitMinutes || !questionCount) {
    return NextResponse.json(
      { error: "Fehlende Parameter" },
      { status: 400 }
    );
  }

  // Verify course ownership
  const { data: courseRaw } = await supabase
    .from("courses")
    .select("id, name")
    .eq("id", courseId)
    .eq("user_id", user.id)
    .single();
  const course = courseRaw as unknown as { id: string; name: string } | null;

  if (!course) {
    return NextResponse.json(
      { error: "Kurs nicht gefunden" },
      { status: 404 }
    );
  }

  // Get all ready documents for this course
  const { data: docsRaw } = await supabase
    .from("documents")
    .select("id, name")
    .eq("course_id", courseId)
    .eq("status", "ready");
  const docs = docsRaw as unknown as Array<{
    id: string;
    name: string;
  }> | null;

  if (!docs || docs.length === 0) {
    return NextResponse.json(
      { error: "Keine verarbeiteten Dokumente gefunden" },
      { status: 400 }
    );
  }

  const documentIds = docs.map((d) => d.id);

  // Get document chunks
  const { data: chunksRaw } = await supabase
    .from("document_chunks")
    .select("content, document_id")
    .in("document_id", documentIds)
    .order("chunk_index", { ascending: true });
  const chunks = chunksRaw as unknown as Array<{
    content: string;
    document_id: string;
  }> | null;

  if (!chunks || chunks.length === 0) {
    return NextResponse.json(
      { error: "Keine Dokument-Chunks gefunden" },
      { status: 400 }
    );
  }

  // Get past quiz attempts to identify weaknesses
  const { data: attemptsRaw } = await supabase
    .from("quiz_attempts")
    .select("answers, score, quiz_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);
  const attempts = attemptsRaw as unknown as Array<{
    answers: Array<{ question_id: string; is_correct: boolean }>;
    score: number;
    quiz_id: string;
  }> | null;

  // Get quizzes to map to document_ids
  const { data: quizzesRaw } = await supabase
    .from("quizzes")
    .select("id, document_ids")
    .eq("course_id", courseId);
  const quizzes = quizzesRaw as unknown as Array<{
    id: string;
    document_ids: string[];
  }> | null;

  // Compute weak document names
  const weakDocNames: string[] = [];
  if (attempts && attempts.length > 0 && quizzes) {
    const quizDocMap = new Map<string, string[]>();
    for (const q of quizzes) {
      quizDocMap.set(q.id, q.document_ids);
    }
    const docErrorCount = new Map<string, { total: number; wrong: number }>();
    for (const attempt of attempts) {
      const docIds = quizDocMap.get(attempt.quiz_id);
      if (!docIds || !Array.isArray(attempt.answers)) continue;
      const wrong = attempt.answers.filter((a) => !a.is_correct).length;
      const total = attempt.answers.length;
      for (const docId of docIds) {
        const existing = docErrorCount.get(docId) ?? { total: 0, wrong: 0 };
        existing.total += total;
        existing.wrong += wrong;
        docErrorCount.set(docId, existing);
      }
    }
    const docNameMap = new Map(docs.map((d) => [d.id, d.name]));
    for (const [docId, stats] of docErrorCount) {
      if (stats.total > 0 && stats.wrong / stats.total > 0.3) {
        const name = docNameMap.get(docId);
        if (name) weakDocNames.push(name);
      }
    }
  }

  // Build context text (~15000 chars for exam)
  let contextText = "";
  for (const chunk of chunks) {
    if (contextText.length + chunk.content.length > 15000) break;
    contextText += chunk.content + "\n\n";
  }

  // Determine question distribution
  const mcCount = Math.ceil(questionCount * 0.5);
  const tfCount = Math.ceil(questionCount * 0.25);
  const ftCount = questionCount - mcCount - tfCount;

  try {
    const { object } = await generateObject({
      model: getModel(),
      schema: ExamOutputSchema,
      prompt: `Du bist ein Universitätsprofessor, der eine realistische Probeklausur für deutschsprachige Studierende erstellt.

Erstelle genau ${questionCount} Klausurfragen basierend auf dem Lernmaterial. Die Klausur soll einem realistischen Schwierigkeitsgrad einer Universitätsklausur entsprechen.

FRAGETYPEN-VERTEILUNG:
- ${mcCount} Multiple-Choice-Fragen (4 Optionen A, B, C, D, genau eine richtig)
- ${tfCount} Wahr/Falsch-Fragen (2 Optionen: Wahr, Falsch)
- ${ftCount} Freitext-Fragen (keine Optionen, korrekte Antwort als Kurztext)

PUNKTEVERTEILUNG:
- Multiple Choice: 2 Punkte pro Frage
- Wahr/Falsch: 1 Punkt pro Frage
- Freitext: 3 Punkte pro Frage

Für jede Frage:
- Formuliere klar und eindeutig auf Deutsch
- Bei multiple_choice: 4 plausible Optionen mit Labels A, B, C, D
- Bei true_false: 2 Optionen mit Labels "Wahr" und "Falsch"
- Bei free_text: options als leeres Array
- Gib die korrekte Antwort an (bei MC den Buchstaben, bei W/F "Wahr" oder "Falsch")
- Schreibe eine kurze Erklärung auf Deutsch
- Setze die Punkte gemäß dem Fragetyp

Mische die Fragetypen NICHT in Blöcken, sondern verteile sie gleichmäßig über die gesamte Klausur.
${getWeaknessPrompt(weakDocNames)}

LERNMATERIAL:
${contextText}`,
    });

    // Calculate total points
    const totalPoints = object.questions.reduce((sum, q) => sum + q.points, 0);

    // Create exam attempt record
    const questionsWithIds = object.questions.map((q, i) => ({
      ...q,
      id: `q_${i}_${Date.now()}`,
    }));

    const { data: examRaw, error: examError } = await supabase
      .from("exam_attempts")
      .insert({
        course_id: courseId,
        user_id: user.id,
        title: `Probeklausur: ${course.name}`,
        document_ids: documentIds,
        time_limit_minutes: timeLimitMinutes,
        questions: questionsWithIds,
        answers: [],
        score: 0,
        grade: "5,0",
        total_points: totalPoints,
        earned_points: 0,
        started_at: new Date().toISOString(),
      } as never)
      .select("id")
      .single();
    const exam = examRaw as unknown as { id: string } | null;

    if (examError || !exam) {
      console.error("Exam insert error:", examError);
      return NextResponse.json(
        { error: "Klausur konnte nicht erstellt werden" },
        { status: 500 }
      );
    }

    // Increment AI usage counter
    await incrementUsage(user.id);

    return NextResponse.json({ examId: exam.id });
  } catch (err) {
    console.error("Exam generation error:", err);
    return NextResponse.json(
      { error: "Klausur-Generierung fehlgeschlagen" },
      { status: 500 }
    );
  }
}
