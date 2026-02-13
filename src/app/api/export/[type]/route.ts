import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  generateQuizPDF,
  generateFlashcardsPDF,
  generateSummaryPDF,
} from "@/lib/export/pdf-generator";
import { generateAnkiExport } from "@/lib/export/anki-export";

type RouteParams = { params: Promise<{ type: string }> };

function pdfResponse(buffer: Uint8Array, filename: string): Response {
  const ab = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  return new Response(ab, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { type } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const courseId = searchParams.get("courseId");
  const contentId = searchParams.get("contentId"); // quizId or flashcardSetId or documentId

  if (!courseId) {
    return NextResponse.json(
      { error: "courseId ist erforderlich" },
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

  // Check tier for Anki export (Pro only)
  if (type === "anki") {
    const { data: profileRaw } = await supabase
      .from("profiles")
      .select("tier")
      .eq("id", user.id)
      .single();
    const profile = profileRaw as unknown as { tier: string } | null;

    if (!profile || profile.tier !== "premium") {
      return NextResponse.json(
        { error: "Anki-Export ist nur für Pro-Nutzer verfügbar" },
        { status: 403 }
      );
    }
  }

  try {
    switch (type) {
      case "quiz": {
        if (!contentId) {
          return NextResponse.json(
            { error: "contentId (quizId) ist erforderlich" },
            { status: 400 }
          );
        }

        const { data: quizRaw } = await supabase
          .from("quizzes")
          .select("id, title")
          .eq("id", contentId)
          .eq("course_id", courseId)
          .single();
        const quiz = quizRaw as unknown as {
          id: string;
          title: string;
        } | null;

        if (!quiz) {
          return NextResponse.json(
            { error: "Quiz nicht gefunden" },
            { status: 404 }
          );
        }

        const { data: questionsRaw } = await supabase
          .from("quiz_questions")
          .select("question, type, options, correct_answer, explanation")
          .eq("quiz_id", contentId)
          .order("created_at");
        const questions =
          (questionsRaw as unknown as Array<{
            question: string;
            type: string;
            options: string[] | null;
            correct_answer: string;
            explanation: string | null;
          }> | null) ?? [];

        const pdfBuffer = await generateQuizPDF(
          course.name,
          quiz.title,
          questions.map((q) => ({
            question: q.question,
            type: q.type as "multiple_choice" | "true_false" | "free_text",
            options: q.options ?? undefined,
            correct_answer: q.correct_answer,
            explanation: q.explanation ?? undefined,
          }))
        );

        return pdfResponse(pdfBuffer, `${quiz.title}.pdf`);
      }

      case "flashcards": {
        if (!contentId) {
          return NextResponse.json(
            { error: "contentId (flashcardSetId) ist erforderlich" },
            { status: 400 }
          );
        }

        const { data: setRaw } = await supabase
          .from("flashcard_sets")
          .select("id, title")
          .eq("id", contentId)
          .eq("course_id", courseId)
          .single();
        const fcSet = setRaw as unknown as {
          id: string;
          title: string;
        } | null;

        if (!fcSet) {
          return NextResponse.json(
            { error: "Flashcard-Set nicht gefunden" },
            { status: 404 }
          );
        }

        const { data: cardsRaw } = await supabase
          .from("flashcards")
          .select("front, back")
          .eq("set_id", contentId)
          .order("created_at");
        const cards =
          (cardsRaw as unknown as Array<{
            front: string;
            back: string;
          }> | null) ?? [];

        const pdfBuffer = await generateFlashcardsPDF(
          course.name,
          fcSet.title,
          cards
        );

        return pdfResponse(pdfBuffer, `${fcSet.title}.pdf`);
      }

      case "summary": {
        if (!contentId) {
          return NextResponse.json(
            { error: "contentId (documentId) ist erforderlich" },
            { status: 400 }
          );
        }

        const { data: docRaw } = await supabase
          .from("documents")
          .select("id, name, summary")
          .eq("id", contentId)
          .eq("course_id", courseId)
          .single();
        const doc = docRaw as unknown as {
          id: string;
          name: string;
          summary: string | null;
        } | null;

        if (!doc) {
          return NextResponse.json(
            { error: "Dokument nicht gefunden" },
            { status: 404 }
          );
        }

        if (!doc.summary) {
          return NextResponse.json(
            { error: "Keine Zusammenfassung vorhanden. Bitte zuerst generieren." },
            { status: 400 }
          );
        }

        const summaryData = JSON.parse(doc.summary);

        const pdfBuffer = await generateSummaryPDF(
          course.name,
          doc.name,
          summaryData
        );

        return pdfResponse(pdfBuffer, `Zusammenfassung_${doc.name}.pdf`);
      }

      case "anki": {
        if (!contentId) {
          return NextResponse.json(
            { error: "contentId (flashcardSetId) ist erforderlich" },
            { status: 400 }
          );
        }

        const { data: ankiSetRaw } = await supabase
          .from("flashcard_sets")
          .select("id, title")
          .eq("id", contentId)
          .eq("course_id", courseId)
          .single();
        const ankiSet = ankiSetRaw as unknown as {
          id: string;
          title: string;
        } | null;

        if (!ankiSet) {
          return NextResponse.json(
            { error: "Flashcard-Set nicht gefunden" },
            { status: 404 }
          );
        }

        const { data: ankiCardsRaw } = await supabase
          .from("flashcards")
          .select("front, back")
          .eq("set_id", contentId)
          .order("created_at");
        const ankiCards =
          (ankiCardsRaw as unknown as Array<{
            front: string;
            back: string;
          }> | null) ?? [];

        const deckName = `StudyApp::${course.name}::${ankiSet.title}`;
        const ankiText = generateAnkiExport(ankiCards, deckName);

        return new Response(ankiText, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Content-Disposition": `attachment; filename="${encodeURIComponent(ankiSet.title)}_anki.txt"`,
          },
        });
      }

      default:
        return NextResponse.json(
          { error: `Unbekannter Export-Typ: ${type}. Erlaubt: quiz, flashcards, summary, anki` },
          { status: 400 }
        );
    }
  } catch (err) {
    console.error("Export error:", err);
    return NextResponse.json(
      { error: "Export fehlgeschlagen" },
      { status: 500 }
    );
  }
}
