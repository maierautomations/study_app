import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const courseId = request.nextUrl.searchParams.get("courseId");

  // 1. Get all flashcards the user owns (through flashcard_sets)
  let setsQuery = supabase
    .from("flashcard_sets")
    .select("id, course_id, title, courses(name, color)")
    .eq("user_id", user.id);

  if (courseId) {
    setsQuery = setsQuery.eq("course_id", courseId);
  }

  const { data: setsRaw } = await setsQuery;
  const sets = setsRaw as unknown as Array<{ id: string; course_id: string; title: string; courses: { name: string; color: string | null } | null }> | null;

  if (!sets || sets.length === 0) {
    return NextResponse.json({
      dueCards: [],
      totalDue: 0,
      byCourse: {},
    });
  }

  const setIds = sets.map((s) => s.id);
  const setMap = new Map(sets.map((s) => [s.id, s]));

  // 2. Get all flashcards from those sets
  const { data: allFlashcardsRaw } = await supabase
    .from("flashcards")
    .select("id, set_id, front, back, order_index")
    .in("set_id", setIds);
  const allFlashcards = allFlashcardsRaw as unknown as Array<{ id: string; set_id: string; front: string; back: string; order_index: number }> | null;

  if (!allFlashcards || allFlashcards.length === 0) {
    return NextResponse.json({
      dueCards: [],
      totalDue: 0,
      byCourse: {},
    });
  }

  // 3. Get the latest review for each flashcard
  // We need the most recent review per flashcard to check next_review_at
  const flashcardIds = allFlashcards.map((f) => f.id);

  const { data: reviewsRaw } = await supabase
    .from("flashcard_reviews")
    .select("flashcard_id, next_review_at, ease_factor, interval, reviewed_at")
    .eq("user_id", user.id)
    .in("flashcard_id", flashcardIds)
    .order("reviewed_at", { ascending: false });
  const reviews = reviewsRaw as unknown as Array<{ flashcard_id: string; next_review_at: string; ease_factor: number; interval: number; reviewed_at: string }> | null;

  // Build map of flashcard_id → latest review
  const latestReviewMap = new Map<
    string,
    { next_review_at: string; ease_factor: number; interval: number }
  >();
  if (reviews) {
    for (const r of reviews) {
      if (!latestReviewMap.has(r.flashcard_id)) {
        latestReviewMap.set(r.flashcard_id, r);
      }
    }
  }

  // 4. Find due cards: next_review_at <= now OR never reviewed
  const now = new Date().toISOString();
  const dueCards: Array<{
    id: string;
    front: string;
    back: string;
    setId: string;
    setTitle: string;
    courseId: string;
    courseName: string;
    courseColor: string | null;
    lastInterval: number;
    lastEaseFactor: number;
    isNew: boolean;
  }> = [];

  for (const card of allFlashcards) {
    const review = latestReviewMap.get(card.id);
    const set = setMap.get(card.set_id);
    if (!set) continue;

    const course = set.courses as unknown as { name: string; color: string | null } | null;

    const isNew = !review;
    const isDue = isNew || review.next_review_at <= now;

    if (isDue) {
      dueCards.push({
        id: card.id,
        front: card.front,
        back: card.back,
        setId: card.set_id,
        setTitle: set.title,
        courseId: set.course_id,
        courseName: course?.name ?? "Unbekannter Kurs",
        courseColor: course?.color ?? null,
        lastInterval: review?.interval ?? 0,
        lastEaseFactor: review?.ease_factor ?? 2.5,
        isNew,
      });
    }
  }

  // 5. Group count by course
  const byCourse: Record<string, number> = {};
  for (const card of dueCards) {
    byCourse[card.courseId] = (byCourse[card.courseId] ?? 0) + 1;
  }

  // Sort: new cards first, then by due date (oldest first)
  dueCards.sort((a, b) => {
    if (a.isNew !== b.isNew) return a.isNew ? 1 : -1;
    return 0;
  });

  return NextResponse.json({
    dueCards,
    totalDue: dueCards.length,
    byCourse,
  });
}
