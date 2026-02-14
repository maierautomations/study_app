import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { courseId, cards } = await req.json() as {
      courseId: string;
      cards: { front: string; back: string }[];
    };

    if (!courseId || !cards || cards.length === 0) {
      return Response.json({ error: "courseId und mindestens eine Karte erforderlich" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Nicht autorisiert", { status: 401 });

    // Get course name
    const { data: course } = await supabase
      .from("courses")
      .select("name")
      .eq("id", courseId)
      .single();
    const courseName = (course as unknown as { name: string } | null)?.name ?? "Kurs";

    // Create flashcard set
    const { data: setData, error: setError } = await supabase
      .from("flashcard_sets")
      .insert({
        course_id: courseId,
        user_id: user.id,
        title: `Flashcards: ${courseName} (Manuell)`,
        document_ids: [],
      } as never)
      .select("id")
      .single();

    if (setError || !setData) {
      return Response.json({ error: "Fehler beim Erstellen des Sets" }, { status: 500 });
    }

    const setId = (setData as unknown as { id: string }).id;

    // Insert cards
    const cardRows = cards.map((card, i) => ({
      set_id: setId,
      front: card.front.trim(),
      back: card.back.trim(),
      order_index: i,
    }));

    await supabase.from("flashcards").insert(cardRows as never);

    return Response.json({ setId });
  } catch (error) {
    console.error("[Manual Flashcard Error]", error);
    return new Response("Interner Serverfehler", { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { flashcardId, front, back } = await req.json() as {
      flashcardId: string;
      front: string;
      back: string;
    };

    if (!flashcardId || !front?.trim() || !back?.trim()) {
      return Response.json({ error: "Alle Felder erforderlich" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Nicht autorisiert", { status: 401 });

    const { error } = await supabase
      .from("flashcards")
      .update({ front: front.trim(), back: back.trim() } as never)
      .eq("id", flashcardId);

    if (error) {
      return Response.json({ error: "Fehler beim Aktualisieren" }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("[Flashcard Update Error]", error);
    return new Response("Interner Serverfehler", { status: 500 });
  }
}
