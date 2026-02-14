import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, Plus } from "lucide-react";
import { CourseFormDialog } from "@/components/course/course-form-dialog";
import { CourseFilters } from "@/components/course/course-filters";

export default async function CoursesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: courses } = await supabase
    .from("courses")
    .select("*, documents(count), quizzes(count), flashcard_sets(count)")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false }) as { data: (import("@/types/database").Course & { documents: { count: number }[]; quizzes: { count: number }[]; flashcard_sets: { count: number }[] })[] | null };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meine Kurse</h1>
          <p className="text-muted-foreground">
            Organisiere deine Lernmaterialien in Kursen.
          </p>
        </div>
        <CourseFormDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Neuer Kurs
          </Button>
        </CourseFormDialog>
      </div>

      {(!courses || courses.length === 0) ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Noch keine Kurse vorhanden
            </h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              Erstelle deinen ersten Kurs, um Dokumente hochzuladen und mit dem
              Lernen zu beginnen.
            </p>
            <CourseFormDialog>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Kurs erstellen
              </Button>
            </CourseFormDialog>
          </CardContent>
        </Card>
      ) : (
        <CourseFilters courses={courses} />
      )}
    </div>
  );
}
