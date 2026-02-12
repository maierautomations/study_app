import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";

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

  const { data: profileData } = await supabase
    .from("profiles")
    .select("display_name, xp, level, current_streak, ai_generations_used, tier")
    .eq("id", user.id)
    .single();
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
      />
      <SidebarInset>
        <main className="flex-1 overflow-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
