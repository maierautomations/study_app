import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProgressOverview } from "@/components/progress/progress-overview";
import type { Profile, StudySession, Course } from "@/types/database";

export default async function ProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [
    profileResult,
    sessionsResult,
    coursesResult,
    { count: totalQuizzes },
    { count: totalFlashcardSets },
    { count: totalDocuments },
    { count: totalAchievements },
    { count: unlockedAchievements },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("study_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("courses")
      .select("id, name, color")
      .eq("user_id", user.id)
      .order("name"),
    supabase
      .from("quizzes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("flashcard_sets")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("achievements")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("user_achievements")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  const profile = profileResult.data as unknown as Profile | null;
  const sessions = sessionsResult.data as unknown as StudySession[] | null;
  const courses = coursesResult.data as unknown as Pick<Course, "id" | "name" | "color">[] | null;

  return (
    <ProgressOverview
      profile={profile}
      sessions={sessions ?? []}
      courses={courses ?? []}
      stats={{
        totalQuizzes: totalQuizzes ?? 0,
        totalFlashcardSets: totalFlashcardSets ?? 0,
        totalDocuments: totalDocuments ?? 0,
        totalAchievements: totalAchievements ?? 0,
        unlockedAchievements: unlockedAchievements ?? 0,
      }}
    />
  );
}
