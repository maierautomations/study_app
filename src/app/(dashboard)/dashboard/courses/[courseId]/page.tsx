import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CourseDetail } from "@/components/course/course-detail";

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

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .eq("user_id", user.id)
    .single();

  if (!course) notFound();

  const [
    { data: documents },
    { data: quizzes },
    { data: flashcardSets },
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

  return (
    <CourseDetail
      course={course}
      documents={documents ?? []}
      quizzes={quizzes ?? []}
      flashcardSets={flashcardSets ?? []}
    />
  );
}
