import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getModel } from "@/lib/ai/provider";
import { AI_CONTEXT_LIMITS } from "@/lib/ai/config";
import { generateObject } from "ai";
import { z } from "zod";
import { checkFreemiumLimit, incrementUsage, getFreemiumErrorMessage } from "@/lib/freemium";
import { parseBody, quizGenerateSchema } from "@/lib/validations";
import { rateLimit, AI_RATE_LIMIT } from "@/lib/rate-limit";

const QuizOutputSchema = z.object({
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
    })
  ),
});

function getDifficultyPrompt(difficulty: string): string {
  switch (difficulty) {
    case "easy":
      return "Stelle einfache Wissensfragen, die grundlegende Konzepte und Definitionen abfragen. Die Fragen sollten für Einsteiger geeignet sein.";
    case "hard":
      return "Stelle anspruchsvolle Fragen, die tiefes Verständnis, Analyse und Transfer erfordern. Die Fragen sollten auch fortgeschrittene Studierende herausfordern.";
    default:
      return "Stelle Fragen mit mittlerem Schwierigkeitsgrad, die sowohl Verständnis als auch Anwendung testen.";
  }
}

const QUESTION_TYPE_LABELS: Record<string, string> = {
  multiple_choice: "Multiple Choice (4 Antwortoptionen A, B, C, D, genau eine richtig)",
  true_false: "Wahr/Falsch (2 Optionen: Wahr, Falsch, genau eine richtig)",
  free_text: "Freitext (keine Optionen, korrekte Antwort als Kurztext)",
};

function getQuestionTypesPrompt(types?: string[]): string {
  const validTypes = (types ?? ["multiple_choice", "true_false", "free_text"]).filter(
    (t) => t in QUESTION_TYPE_LABELS
  );
  if (validTypes.length === 0 || validTypes.length === 3) {
    return `Erstelle eine Mischung aus verschiedenen Fragetypen:
- multiple_choice: 4 Antwortoptionen (A, B, C, D), genau eine richtig
- true_false: 2 Optionen (Wahr, Falsch), genau eine richtig
- free_text: Keine Optionen, die korrekte Antwort als Kurztext`;
  }
  const lines = validTypes.map((t) => `- ${t}: ${QUESTION_TYPE_LABELS[t]}`);
  return `Erstelle NUR folgende Fragetypen:\n${lines.join("\n")}`;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  // Rate limit
  const rl = rateLimit(`${user.id}:quiz-generate`, AI_RATE_LIMIT.maxRequests, AI_RATE_LIMIT.windowMs);
  if (!rl.success) {
    return NextResponse.json(
      { error: `Zu viele Anfragen. Bitte warte ${Math.ceil(rl.resetInMs / 1000)} Sekunden.` },
      { status: 429 }
    );
  }

  // Freemium limit check
  const freemium = await checkFreemiumLimit(user.id);
  if (!freemium.allowed) {
    return NextResponse.json(
      { error: getFreemiumErrorMessage(freemium.used, freemium.limit) },
      { status: 402 }
    );
  }

  const body = await request.json();
  const parsed = parseBody(quizGenerateSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { courseId, documentIds, difficulty, questionCount, questionTypes, title, focusArea } = parsed.data;

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

  // Get document chunks for selected documents
  const { data: chunksRaw } = await supabase
    .from("document_chunks")
    .select("content, document_id")
    .in("document_id", documentIds)
    .order("chunk_index", { ascending: true });
  const chunks = chunksRaw as unknown as Array<{ content: string; document_id: string }> | null;

  if (!chunks || chunks.length === 0) {
    return NextResponse.json(
      { error: "Keine verarbeiteten Dokumente gefunden" },
      { status: 400 }
    );
  }

  let contextText = "";
  for (const chunk of chunks) {
    if (contextText.length + chunk.content.length > AI_CONTEXT_LIMITS.default) break;
    contextText += chunk.content + "\n\n";
  }

  const difficultyPrompt = getDifficultyPrompt(difficulty);

  try {
    const { object } = await generateObject({
      model: getModel(),
      schema: QuizOutputSchema,
      prompt: `Du bist ein Experte für die Erstellung von Prüfungsfragen für deutschsprachige Universitätskurse.

Basierend auf dem folgenden Lernmaterial, erstelle genau ${questionCount} Quizfragen.
${focusArea ? `\nFOKUSBEREICH: Konzentriere dich besonders auf das Thema "${focusArea}". Erstelle die meisten Fragen zu diesem Bereich.\n` : ""}
${difficultyPrompt}

${getQuestionTypesPrompt(questionTypes)}

Für jede Frage:
- Formuliere die Frage klar und eindeutig auf Deutsch
- Bei multiple_choice: Erstelle 4 plausible Optionen mit Labels A, B, C, D
- Bei true_false: Erstelle 2 Optionen mit Labels "Wahr" und "Falsch"
- Bei free_text: Setze options auf ein leeres Array
- Gib die korrekte Antwort als Text an (bei MC den Buchstaben, bei W/F "Wahr" oder "Falsch")
- Schreibe eine kurze, hilfreiche Erklärung auf Deutsch

LERNMATERIAL:
${contextText}`,
    });

    // Create quiz record
    const { data: quizRaw, error: quizError } = await supabase
      .from("quizzes")
      .insert({
        course_id: courseId,
        user_id: user.id,
        title: title || `Quiz: ${course.name}`,
        document_ids: documentIds,
        difficulty,
        question_count: object.questions.length,
      } as never)
      .select("id")
      .single();
    const quiz = quizRaw as unknown as { id: string } | null;

    if (quizError || !quiz) {
      return NextResponse.json(
        { error: "Quiz konnte nicht erstellt werden" },
        { status: 500 }
      );
    }

    // Store questions
    const questionRows = object.questions.map((q, index) => ({
      quiz_id: quiz.id,
      question_text: q.question_text,
      question_type: q.question_type as
        | "multiple_choice"
        | "true_false"
        | "free_text",
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      order_index: index,
    }));

    const { error: questionsError } = await supabase
      .from("quiz_questions")
      .insert(questionRows as never);

    if (questionsError) {
      // Clean up the quiz if questions failed
      await supabase.from("quizzes").delete().eq("id", quiz.id);
      return NextResponse.json(
        { error: "Fragen konnten nicht gespeichert werden" },
        { status: 500 }
      );
    }

    // Increment AI usage counter
    await incrementUsage(user.id);

    return NextResponse.json({ quizId: quiz.id });
  } catch (err) {
    console.error("Quiz generation error:", err);
    return NextResponse.json(
      { error: "Quiz-Generierung fehlgeschlagen" },
      { status: 500 }
    );
  }
}
