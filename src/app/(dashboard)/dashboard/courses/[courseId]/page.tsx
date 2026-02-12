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
      .select("*")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false }),
  ]);
  const documents = documentsRaw as unknown as Document[] | null;
  const quizzes = quizzesRaw as unknown as Quiz[] | null;
  const flashcardSets = flashcardSetsRaw as unknown as FlashcardSet[] | null;

  return (
    <CourseDetail
      course={course}
      documents={documents ?? []}
      quizzes={quizzes ?? []}
      flashcardSets={flashcardSets ?? []}
    />
  );
}
