import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Layers, Flame, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

type DueCard = {
  id: string;
  courseId: string;
  courseName: string;
  courseColor: string | null;
  isNew: boolean;
};

type CourseGroup = {
  courseId: string;
  courseName: string;
  courseColor: string | null;
  totalDue: number;
  newCards: number;
  reviewCards: number;
};

export default async function ReviewsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch due cards via internal API logic (server-side)
  // We replicate the due query here to avoid HTTP round-trip
  type SetRow = { id: string; course_id: string; title: string; courses: { name: string; color: string | null } | null };
  type CardRow = { id: string; set_id: string };
  type ReviewRow = { flashcard_id: string; next_review_at: string };

  const { data: setsRaw } = await supabase
    .from("flashcard_sets")
    .select("id, course_id, title, courses(name, color)")
    .eq("user_id", user!.id);
  const sets = setsRaw as unknown as SetRow[] | null;

  let dueCards: DueCard[] = [];
  const courseGroups: Map<string, CourseGroup> = new Map();

  if (sets && sets.length > 0) {
    const setIds = sets.map((s) => s.id);
    const setMap = new Map(sets.map((s) => [s.id, s]));

    const { data: flashcardsRaw } = await supabase
      .from("flashcards")
      .select("id, set_id")
      .in("set_id", setIds);
    const allFlashcards = flashcardsRaw as unknown as CardRow[] | null;

    if (allFlashcards && allFlashcards.length > 0) {
      const flashcardIds = allFlashcards.map((f) => f.id);

      const { data: reviewsRaw } = await supabase
        .from("flashcard_reviews")
        .select("flashcard_id, next_review_at")
        .eq("user_id", user!.id)
        .in("flashcard_id", flashcardIds)
        .order("reviewed_at", { ascending: false });
      const reviews = reviewsRaw as unknown as ReviewRow[] | null;

      const latestReviewMap = new Map<string, string>();
      if (reviews) {
        for (const r of reviews) {
          if (!latestReviewMap.has(r.flashcard_id)) {
            latestReviewMap.set(r.flashcard_id, r.next_review_at);
          }
        }
      }

      const now = new Date().toISOString();

      for (const card of allFlashcards) {
        const nextReview = latestReviewMap.get(card.id);
        const set = setMap.get(card.set_id);
        if (!set) continue;

        const course = set.courses as unknown as { name: string; color: string | null } | null;
        const isNew = !nextReview;
        const isDue = isNew || nextReview <= now;

        if (isDue) {
          const courseId = set.course_id;
          dueCards.push({
            id: card.id,
            courseId,
            courseName: course?.name ?? "Unbekannter Kurs",
            courseColor: course?.color ?? null,
            isNew,
          });

          if (!courseGroups.has(courseId)) {
            courseGroups.set(courseId, {
              courseId,
              courseName: course?.name ?? "Unbekannter Kurs",
              courseColor: course?.color ?? null,
              totalDue: 0,
              newCards: 0,
              reviewCards: 0,
            });
          }
          const group = courseGroups.get(courseId)!;
          group.totalDue++;
          if (isNew) group.newCards++;
          else group.reviewCards++;
        }
      }
    }
  }

  // Fetch streak info
  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("current_streak, last_study_date")
    .eq("id", user!.id)
    .single();
  const profile = profileRaw as unknown as { current_streak: number; last_study_date: string | null } | null;

  const streak = profile?.current_streak ?? 0;
  const totalDue = dueCards.length;
  const groups = Array.from(courseGroups.values()).sort(
    (a, b) => b.totalDue - a.totalDue
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Layers className="h-8 w-8" />
            Wiederholungen
          </h1>
          <p className="text-muted-foreground mt-1">
            Lerne fällige Flashcards mit Spaced Repetition (SM-2)
          </p>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 rounded-lg">
            <Flame className="h-5 w-5 text-orange-500" />
            <span className="font-semibold text-orange-500">{streak} Tage Streak!</span>
          </div>
        )}
      </div>

      {/* Summary card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-bold">{totalDue}</p>
              <p className="text-muted-foreground">
                {totalDue === 1
                  ? "Karte wartet auf Wiederholung"
                  : "Karten warten auf Wiederholung"}
              </p>
            </div>
            {totalDue > 0 && (
              <div className="flex items-center gap-3">
                <Badge variant="outline">
                  <Sparkles className="mr-1 h-3 w-3" />
                  +{totalDue * 10} XP möglich
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Course groups */}
      {groups.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card key={group.courseId} className="relative overflow-hidden">
              {group.courseColor && (
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: group.courseColor }}
                />
              )}
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{group.courseName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-bold">{group.totalDue}</div>
                  <div className="text-sm text-muted-foreground">
                    {group.reviewCards > 0 && (
                      <p>{group.reviewCards} zur Wiederholung</p>
                    )}
                    {group.newCards > 0 && (
                      <p>{group.newCards} neue Karten</p>
                    )}
                  </div>
                </div>
                <Button asChild className="w-full">
                  <Link href={`/dashboard/reviews/${group.courseId}`}>
                    Jetzt lernen
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Layers className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Keine Karten fällig
            </h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              Alle Flashcards sind auf dem neuesten Stand! Erstelle neue Flashcards oder komm später wieder.
            </p>
            <Button asChild variant="outline">
              <Link href="/dashboard/courses">Zu meinen Kursen</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
