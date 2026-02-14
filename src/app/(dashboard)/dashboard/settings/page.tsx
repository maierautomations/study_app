import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileSection } from "@/components/settings/profile-section";
import { AppearanceSection } from "@/components/settings/appearance-section";
import { SecuritySection } from "@/components/settings/security-section";
import { SubscriptionSection } from "@/components/settings/subscription-section";
import { LearningGoalSection } from "@/components/settings/learning-goal-section";
import { DangerSection } from "@/components/settings/danger-section";
import type { Profile } from "@/types/database";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  const profile = profileRaw as unknown as Profile | null;

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Einstellungen</h1>
        <p className="text-muted-foreground">
          Verwalte dein Profil und deine Kontoeinstellungen.
        </p>
      </div>

      <ProfileSection
        displayName={profile?.display_name ?? ""}
        email={user.email ?? ""}
        tier={profile?.tier ?? "free"}
      />

      <LearningGoalSection currentGoal={profile?.daily_goal_minutes ?? 20} />

      <AppearanceSection />

      <SecuritySection />

      <SubscriptionSection
        tier={profile?.tier ?? "free"}
        aiGenerationsUsed={profile?.ai_generations_used ?? 0}
        aiGenerationsResetAt={profile?.ai_generations_reset_at ?? ""}
      />

      <DangerSection />
    </div>
  );
}
