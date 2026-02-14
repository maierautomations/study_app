import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CourseDetail } from "@/components/course/course-detail";
import type { Course, Document, Quiz, FlashcardSet } from "@/types/database";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: courseRaw } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .eq("user_id", user.id)
    .single();
  const course = courseRaw as unknown as Course | null;

  if (!course) notFound();

  const [
    { data: documentsRaw },
    { data: quizzesRaw },
    { data: flashcardSetsRaw },
    { data: profileRaw },
  ] = await Promise.all([
    supabase
      .from("documents")
      .select("*")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false }),
    supabase
      .from("quizzes")
      .select("*")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false }),
    supabase
      .from("flashcard_sets")
      .select("*, flashcards(id)")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("ai_generations_used, tier")
      .eq("id", user.id)
      .single(),
  ]);
  const documents = documentsRaw as unknown as Document[] | null;
  const quizzes = quizzesRaw as unknown as Quiz[] | null;
  const flashcardSetsWithCards = flashcardSetsRaw as unknown as (FlashcardSet & { flashcards: { id: string }[] })[] | null;

  // Build card count map
  const flashcardCounts: Record<string, number> = {};
  const flashcardSets: FlashcardSet[] = [];
  if (flashcardSetsWithCards) {
    for (const set of flashcardSetsWithCards) {
      flashcardCounts[set.id] = set.flashcards?.length ?? 0;
      // Strip the nested flashcards array for the FlashcardSet type
      const { flashcards: _, ...setWithoutCards } = set;
      flashcardSets.push(setWithoutCards as FlashcardSet);
    }
  }

  const profile = profileRaw as unknown as { ai_generations_used: number; tier: "free" | "premium" } | null;
  const quotaUsed = profile?.ai_generations_used ?? 0;
  const quotaLimit = profile?.tier === "premium" ? -1 : 20;

  return (
    <CourseDetail
      course={course}
      documents={documents ?? []}
      quizzes={quizzes ?? []}
      flashcardSets={flashcardSets}
      flashcardCounts={flashcardCounts}
      quotaUsed={quotaUsed}
      quotaLimit={quotaLimit}
    />
  );
}
