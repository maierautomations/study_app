import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { AchievementListener } from "@/components/gamification/achievement-listener";
import { Separator } from "@/components/ui/separator";
import { ChatFAB } from "@/components/global-chat/chat-fab";
import { ChatPanel } from "@/components/global-chat/chat-panel";
import { PomodoroTimer } from "@/components/gamification/pomodoro-timer";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profileData }, { count: dueCount }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, xp, level, current_streak, ai_generations_used, tier")
      .eq("id", user.id)
      .single(),
    supabase
      .from("flashcard_reviews")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .lte("next_review_at", new Date().toISOString()),
  ]);
  const profile = profileData as unknown as {
    display_name: string | null;
    xp: number;
    level: number;
    current_streak: number;
    ai_generations_used: number;
    tier: "free" | "premium";
  } | null;

  return (
    <SidebarProvider>
      <a href="#main-content" className="skip-link">
        Zum Hauptinhalt springen
      </a>
      <AppSidebar
        user={{
          email: user.email,
          displayName: profile?.display_name ?? undefined,
        }}
        gamification={profile ? {
          xp: profile.xp ?? 0,
          level: profile.level ?? 1,
          currentStreak: profile.current_streak ?? 0,
          aiGenerationsUsed: profile.ai_generations_used ?? 0,
          tier: profile.tier ?? "free",
        } : undefined}
        dueReviewCount={dueCount ?? 0}
      />
      <SidebarInset>
        <header className="flex h-12 items-center gap-2 border-b px-4">
          <div className="md:hidden flex items-center gap-2">
            <SidebarTrigger className="-ml-1" aria-label="Navigation öffnen" />
            <Separator orientation="vertical" className="h-4" />
            <span className="text-sm font-semibold">StudyApp</span>
          </div>
          <div className="ml-auto">
            <PomodoroTimer />
          </div>
        </header>
        <main id="main-content" className="flex-1 overflow-auto">{children}</main>
        <AchievementListener />
      </SidebarInset>
      <ChatFAB />
      <ChatPanel />
    </SidebarProvider>
  );
}
