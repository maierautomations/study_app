import { createClient } from "@/lib/supabase/server";
import { Trophy } from "lucide-react";
import { AchievementsGrid } from "@/components/gamification/achievements-grid";
import type { Achievement, UserAchievement } from "@/types/database";

export default async function AchievementsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: achievementsRaw }, { data: userAchievementsRaw }, { data: profileRaw }] =
    await Promise.all([
      supabase.from("achievements").select("*").order("category").order("xp_reward"),
      supabase
        .from("user_achievements")
        .select("achievement_id, unlocked_at")
        .eq("user_id", user!.id),
      supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single(),
    ]);
  const achievements = achievementsRaw as unknown as Achievement[] | null;
  const userAchievements = userAchievementsRaw as unknown as UserAchievement[] | null;
  const profile = profileRaw as unknown as { xp: number } | null;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Trophy className="h-8 w-8" />
          Erfolge
        </h1>
        <p className="text-muted-foreground mt-1">
          Schalte Erfolge frei, indem du lernst und Fortschritte machst.
        </p>
      </div>

      <AchievementsGrid
        achievements={achievements ?? []}
        userAchievements={userAchievements ?? []}
        totalXp={profile?.xp ?? 0}
      />
    </div>
  );
}
