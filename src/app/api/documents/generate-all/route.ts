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

const MultiOutputSchema = z.object({
  quiz: z.object({
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
  }),
  flashcards: z.array(
    z.object({
      front: z.string(),
      back: z.string(),
    })
  ),
  summary: z.object({
    title: z.string(),
    keyPoints: z.array(z.string()),
    keywords: z.array(z.string()),
    summary: z.string(),
  }),
});

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

  const { courseId, documentIds } = await request.json();

  if (!courseId || !documentIds?.length) {
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

  // Get document chunks
  const { data: chunksRaw } = await supabase
    .from("document_chunks")
    .select("content")
    .in("document_id", documentIds)
    .order("chunk_index", { ascending: true });
  const chunks = chunksRaw as unknown as Array<{ content: string }> | null;

  if (!chunks || chunks.length === 0) {
    return NextResponse.json(
      { error: "Keine verarbeiteten Dokumente gefunden" },
      { status: 400 }
    );
  }

  // Build context (~14000 chars for combined generation)
  let contextText = "";
  for (const chunk of chunks) {
    if (contextText.length + chunk.content.length > 14000) break;
    contextText += chunk.content + "\n\n";
  }

  // Get document names for summary titles
  const { data: docsRaw } = await supabase
    .from("documents")
    .select("id, name")
    .in("id", documentIds);
  const docs = docsRaw as unknown as Array<{ id: string; name: string }> | null;
  const docNames = docs?.map((d) => d.name).join(", ") ?? "";

  try {
    const { object } = await generateObject({
      model: getModel(),
      schema: MultiOutputSchema,
      prompt: `Du bist ein Experte für die Erstellung von Lernmaterialien für deutschsprachige Universitätskurse.

Basierend auf dem folgenden Lernmaterial, erstelle in EINEM Durchgang:

1. QUIZ (10 Fragen):
   - Mischung aus multiple_choice (6), true_false (2), free_text (2)
   - Bei multiple_choice: 4 Optionen (A, B, C, D), genau eine richtig
   - Bei true_false: 2 Optionen (Wahr, Falsch)
   - Bei free_text: options als leeres Array
   - Korrekte Antwort + kurze Erklärung auf Deutsch

2. FLASHCARDS (20 Karten):
   - Vorderseite: kurze Frage oder Begriff
   - Rückseite: klare, vollständige Antwort/Definition
   - Decke die wichtigsten Konzepte ab
   - Alles auf Deutsch

3. ZUSAMMENFASSUNG:
   - title: Kurzer Titel
   - keyPoints: 3-7 Kernaussagen
   - keywords: 5-10 Fachbegriffe
   - summary: 200-300 Wörter Zusammenfassung
   - Alles auf Deutsch (Fachbegriffe dürfen in Originalsprache)

Dokumente: ${docNames}

LERNMATERIAL:
${contextText}`,
    });

    // --- Store Quiz ---
    const { data: quizRaw, error: quizError } = await supabase
      .from("quizzes")
      .insert({
        course_id: courseId,
        user_id: user.id,
        title: `Quiz: ${course.name}`,
        document_ids: documentIds,
        difficulty: "medium",
        question_count: object.quiz.questions.length,
      } as never)
      .select("id")
      .single();
    const quiz = quizRaw as unknown as { id: string } | null;

    let quizId: string | null = null;
    if (!quizError && quiz) {
      quizId = quiz.id;
      const questionRows = object.quiz.questions.map((q, index) => ({
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
        await supabase.from("quizzes").delete().eq("id", quiz.id);
        quizId = null;
      }
    }

    // --- Store Flashcards ---
    const { data: setRaw, error: setError } = await supabase
      .from("flashcard_sets")
      .insert({
        course_id: courseId,
        user_id: user.id,
        title: `Flashcards: ${course.name}`,
        document_ids: documentIds,
      } as never)
      .select("id")
      .single();
    const flashcardSet = setRaw as unknown as { id: string } | null;

    let setId: string | null = null;
    if (!setError && flashcardSet) {
      setId = flashcardSet.id;
      const cardRows = object.flashcards.map((card, index) => ({
        set_id: flashcardSet.id,
        front: card.front,
        back: card.back,
        order_index: index,
      }));
      const { error: cardsError } = await supabase
        .from("flashcards")
        .insert(cardRows as never);
      if (cardsError) {
        await supabase.from("flashcard_sets").delete().eq("id", flashcardSet.id);
        setId = null;
      }
    }

    // --- Cache Summaries per document ---
    const summaryJson = JSON.stringify(object.summary);
    for (const docId of documentIds) {
      // Only cache if no existing summary
      const { data: existingDoc } = await supabase
        .from("documents")
        .select("summary")
        .eq("id", docId)
        .single();
      const existing = existingDoc as unknown as { summary: string | null } | null;
      if (!existing?.summary) {
        await supabase
          .from("documents")
          .update({ summary: summaryJson } as never)
          .eq("id", docId);
      }
    }

    // Increment usage (counts as 1 generation since it's one API call)
    await incrementUsage(user.id);

    return NextResponse.json({
      quizId,
      flashcardSetId: setId,
      summary: object.summary,
      generated: {
        questions: object.quiz.questions.length,
        flashcards: object.flashcards.length,
        hasSummary: true,
      },
    });
  } catch (err) {
    console.error("Multi-output generation error:", err);
    return NextResponse.json(
      { error: "Generierung fehlgeschlagen" },
      { status: 500 }
    );
  }
}
