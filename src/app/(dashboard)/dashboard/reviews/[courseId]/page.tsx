import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ReviewSession } from "@/components/flashcard/review-session";

export default async function ReviewCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Verify course ownership
  const { data: courseData } = await supabase
    .from("courses")
    .select("id, name, color")
    .eq("id", courseId)
    .eq("user_id", user!.id)
    .single();
  const course = courseData as { id: string; name: string; color: string | null } | null;

  if (!course) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Kurs nicht gefunden.</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/reviews">Zurück zu Wiederholungen</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Link
        href="/dashboard/reviews"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Zurück zu Wiederholungen
      </Link>

      <ReviewSession
        courseId={course.id}
        courseName={course.name}
        courseColor={course.color}
      />
    </div>
  );
}
