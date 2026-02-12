import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getModel } from "@/lib/ai/provider";
import { generateObject } from "ai";
import { z } from "zod";
import { checkFreemiumLimit, incrementUsage, getFreemiumErrorMessage } from "@/lib/freemium";

const FlashcardOutputSchema = z.object({
  flashcards: z.array(
    z.object({
      front: z.string(),
      back: z.string(),
    })
  ),
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

  const { courseId, documentIds, title, count } = await request.json();

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

  let contextText = "";
  for (const chunk of chunks) {
    if (contextText.length + chunk.content.length > 12000) break;
    contextText += chunk.content + "\n\n";
  }

  const cardCount = count || 20;

  try {
    const { object } = await generateObject({
      model: getModel(),
      schema: FlashcardOutputSchema,
      prompt: `Du bist ein Experte für die Erstellung von Lernkarten (Flashcards) für deutschsprachige Universitätskurse.

Basierend auf dem folgenden Lernmaterial, erstelle genau ${cardCount} Flashcards.

REGELN:
- Jede Karte hat eine Vorderseite (Frage/Begriff) und eine Rückseite (Antwort/Definition)
- Die Vorderseite sollte kurz und prägnant sein
- Die Rückseite sollte eine klare, vollständige Antwort enthalten
- Decke die wichtigsten Konzepte, Definitionen und Zusammenhänge ab
- Formuliere alles auf Deutsch
- Variiere die Fragetypen: Definitionen, Erklärungen, Vergleiche, Anwendungen
- Sortiere die Karten thematisch

LERNMATERIAL:
${contextText}`,
    });

    // Create flashcard set
    const { data: setRaw, error: setError } = await supabase
      .from("flashcard_sets")
      .insert({
        course_id: courseId,
        user_id: user.id,
        title: title || `Flashcards: ${course.name}`,
        document_ids: documentIds,
      } as never)
      .select("id")
      .single();
    const set = setRaw as unknown as { id: string } | null;

    if (setError || !set) {
      return NextResponse.json(
        { error: "Flashcard-Set konnte nicht erstellt werden" },
        { status: 500 }
      );
    }

    // Store flashcards
    const cardRows = object.flashcards.map((card, index) => ({
      set_id: set.id,
      front: card.front,
      back: card.back,
      order_index: index,
    }));

    const { error: cardsError } = await supabase
      .from("flashcards")
      .insert(cardRows as never);

    if (cardsError) {
      await supabase.from("flashcard_sets").delete().eq("id", set.id);
      return NextResponse.json(
        { error: "Flashcards konnten nicht gespeichert werden" },
        { status: 500 }
      );
    }

    // Increment AI usage counter
    await incrementUsage(user.id);

    return NextResponse.json({ setId: set.id });
  } catch (err) {
    console.error("Flashcard generation error:", err);
    return NextResponse.json(
      { error: "Flashcard-Generierung fehlgeschlagen" },
      { status: 500 }
    );
  }
}
