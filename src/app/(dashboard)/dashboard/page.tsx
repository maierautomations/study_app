import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  FileText,
  BrainCircuit,
  MessageSquare,
  Plus,
  Clock,
  Trophy,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { XpProgress } from "@/components/gamification/xp-progress";
import { StreakDisplay } from "@/components/gamification/streak-display";
import { AchievementBadge } from "@/components/gamification/achievement-badge";
import { OnboardingCheck } from "@/components/onboarding/onboarding-check";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: profile },
    { count: courseCount },
    { count: documentCount },
    { count: quizCount },
    { data: recentSessions },
    { data: userAchievements },
    { count: dueReviewCount },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user!.id).single(),
    supabase.from("courses").select("*", { count: "exact", head: true }).eq("user_id", user!.id),
    supabase.from("documents").select("*", { count: "exact", head: true }).eq("user_id", user!.id),
    supabase.from("quizzes").select("*", { count: "exact", head: true }).eq("user_id", user!.id),
    supabase
      .from("study_sessions")
      .select("*, courses(name)")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("user_achievements")
      .select("*, achievements(*)")
      .eq("user_id", user!.id)
      .order("unlocked_at", { ascending: false })
      .limit(3),
    supabase
      .from("flashcard_reviews")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user!.id)
      .lte("next_review_at", new Date().toISOString()),
  ]);

  const displayName = profile?.display_name || "Studierende/r";

  const ACTIVITY_LABELS: Record<string, string> = {
    quiz_complete: "Quiz abgeschlossen",
    perfect_quiz: "Perfektes Quiz",
    flashcard_review: "Flashcards gelernt",
    document_upload: "Dokument hochgeladen",
    chat_message: "Chat-Nachricht",
    course_create: "Kurs erstellt",
  };

  return (
    <div className="p-6 space-y-6">
      {/* Onboarding wizard for new users */}
      <OnboardingCheck onboardingCompleted={profile?.onboarding_completed ?? false} />

      {/* Header row: Welcome + Streak/XP */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Hallo, {displayName}!
          </h1>
          <p className="text-muted-foreground">
            Bereit zum Lernen? Hier ist deine Übersicht.
          </p>
        </div>
        <div className="flex items-center gap-6">
          <StreakDisplay streak={profile?.current_streak ?? 0} />
          <Button asChild>
            <Link href="/dashboard/courses">
              <Plus className="mr-2 h-4 w-4" />
              Neuer Kurs
            </Link>
          </Button>
        </div>
      </div>

      {/* XP Progress */}
      <Card>
        <CardContent className="pt-6">
          <XpProgress xp={profile?.xp ?? 0} />
        </CardContent>
      </Card>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kurse</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courseCount ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dokumente</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documentCount ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quizzes</CardTitle>
            <BrainCircuit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quizCount ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">KI-Generierungen</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profile?.ai_generations_used ?? 0}
              <span className="text-sm font-normal text-muted-foreground">
                {" "}/ {profile?.tier === "premium" ? "\u221E" : "20"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row: Activity + Reviews + Achievements */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Letzte Aktivität
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentSessions && recentSessions.length > 0 ? (
              <div className="space-y-3">
                {recentSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">
                        {ACTIVITY_LABELS[session.activity_type] ?? session.activity_type}
                      </p>
                      {session.courses && (
                        <p className="text-xs text-muted-foreground">
                          {(session.courses as { name: string }).name}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-primary font-medium">
                      +{session.xp_earned} XP
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Noch keine Aktivität. Starte mit einem Quiz oder lade ein Dokument hoch!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Due Reviews */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Wiederholungen fällig
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(dueReviewCount ?? 0) > 0 ? (
              <div className="space-y-3">
                <p className="text-3xl font-bold">{dueReviewCount}</p>
                <p className="text-sm text-muted-foreground">
                  Flashcards warten auf Wiederholung
                </p>
                <Button asChild size="sm" className="w-full">
                  <Link href="/dashboard/courses">
                    Jetzt lernen
                  </Link>
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Keine Wiederholungen fällig. Erstelle Flashcards, um mit Spaced Repetition zu lernen!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Achievements Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Erfolge
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userAchievements && userAchievements.length > 0 ? (
              <div className="space-y-3">
                {userAchievements.map((ua) => {
                  const achievement = ua.achievements as {
                    title_de: string;
                    description_de: string;
                    icon: string;
                    xp_reward: number;
                  };
                  return (
                    <AchievementBadge
                      key={ua.id}
                      title={achievement.title_de}
                      description={achievement.description_de}
                      icon={achievement.icon}
                      unlocked={true}
                      unlockedAt={ua.unlocked_at}
                      xpReward={achievement.xp_reward}
                    />
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Noch keine Erfolge freigeschaltet. Lerne weiter, um Erfolge zu sammeln!
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Empty state for new users */}
      {(courseCount ?? 0) === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Erstelle deinen ersten Kurs
            </h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              Organisiere deine Lernmaterialien in Kursen. Lade Dokumente hoch
              und lasse die KI Quizfragen und Flashcards generieren.
            </p>
            <Button asChild>
              <Link href="/dashboard/courses">
                <Plus className="mr-2 h-4 w-4" />
                Kurs erstellen
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
