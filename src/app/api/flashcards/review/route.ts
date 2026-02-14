import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateSM2, getDefaultReviewState } from "@/lib/spaced-repetition";
import { parseBody, flashcardReviewSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = parseBody(flashcardReviewSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { flashcardId, quality } = parsed.data;

  // Verify flashcard exists and user owns it (through flashcard_set → course)
  const { data: flashcardRaw } = await supabase
    .from("flashcards")
    .select("id, set_id, flashcard_sets(course_id, user_id)")
    .eq("id", flashcardId)
    .single();
  const flashcard = flashcardRaw as unknown as { id: string; set_id: string; flashcard_sets: { course_id: string; user_id: string } | null } | null;

  if (!flashcard) {
    return NextResponse.json(
      { error: "Flashcard nicht gefunden" },
      { status: 404 }
    );
  }

  const flashcardSet = flashcard.flashcard_sets as unknown as {
    course_id: string;
    user_id: string;
  };

  if (flashcardSet.user_id !== user.id) {
    return NextResponse.json(
      { error: "Nicht autorisiert" },
      { status: 403 }
    );
  }

  // Get the most recent review for this flashcard (if any)
  const { data: lastReviewRaw } = await supabase
    .from("flashcard_reviews")
    .select("interval, ease_factor")
    .eq("flashcard_id", flashcardId)
    .eq("user_id", user.id)
    .order("reviewed_at", { ascending: false })
    .limit(1)
    .single();
  const lastReview = lastReviewRaw as unknown as { interval: number; ease_factor: number } | null;

  const defaultState = getDefaultReviewState();
  const previousInterval = lastReview?.interval ?? defaultState.interval;
  const previousEaseFactor = lastReview?.ease_factor ?? defaultState.easeFactor;

  // Calculate SM-2
  const result = calculateSM2(quality, previousInterval, previousEaseFactor);

  // Insert new review record
  const { error: insertError } = await supabase
    .from("flashcard_reviews")
    .insert({
      flashcard_id: flashcardId,
      user_id: user.id,
      quality,
      interval: result.interval,
      ease_factor: result.easeFactor,
      next_review_at: result.nextReviewDate,
    } as never);

  if (insertError) {
    console.error("Review insert error:", insertError);
    return NextResponse.json(
      { error: "Review konnte nicht gespeichert werden" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    nextReviewAt: result.nextReviewDate,
    interval: result.interval,
    easeFactor: result.easeFactor,
    courseId: flashcardSet.course_id,
  });
}
