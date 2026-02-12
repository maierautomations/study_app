"use client";

import { AchievementBadge } from "./achievement-badge";

type Achievement = {
  id: string;
  key: string;
  title_de: string;
  description_de: string;
  icon: string;
  xp_reward: number;
  category: string;
};

type UserAchievement = {
  achievement_id: string;
  unlocked_at: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  courses: "Kurse",
  documents: "Dokumente",
  quizzes: "Quizzes",
  flashcards: "Flashcards",
  streaks: "Streaks",
  levels: "Level",
};

const CATEGORY_ORDER = ["courses", "documents", "quizzes", "flashcards", "streaks", "levels"];

export function AchievementsGrid({
  achievements,
  userAchievements,
  totalXp,
}: {
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  totalXp: number;
}) {
  // Build a map of unlocked achievements
  const unlockedMap = new Map<string, string>();
  for (const ua of userAchievements) {
    unlockedMap.set(ua.achievement_id, ua.unlocked_at);
  }

  // Group by category
  const grouped = new Map<string, Achievement[]>();
  for (const a of achievements) {
    const cat = a.category || "other";
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(a);
  }

  const unlockedCount = userAchievements.length;
  const totalCount = achievements.length;

  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="flex items-center gap-6">
        <div>
          <p className="text-4xl font-bold">
            {unlockedCount}
            <span className="text-lg font-normal text-muted-foreground">
              {" "}/ {totalCount}
            </span>
          </p>
          <p className="text-sm text-muted-foreground">Erfolge freigeschaltet</p>
        </div>
        <div className="h-12 w-px bg-border" />
        <div>
          <p className="text-4xl font-bold">{totalXp.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">Gesamt-XP</p>
        </div>
      </div>

      {/* Categories */}
      {CATEGORY_ORDER.map((cat) => {
        const items = grouped.get(cat);
        if (!items || items.length === 0) return null;

        const catUnlocked = items.filter((a) => unlockedMap.has(a.id)).length;

        return (
          <div key={cat}>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-lg font-semibold">
                {CATEGORY_LABELS[cat] ?? cat}
              </h2>
              <span className="text-sm text-muted-foreground">
                {catUnlocked} / {items.length}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((a) => {
                const unlockedAt = unlockedMap.get(a.id);
                return (
                  <AchievementBadge
                    key={a.id}
                    title={a.title_de}
                    description={a.description_de}
                    icon={a.icon}
                    unlocked={!!unlockedAt}
                    unlockedAt={unlockedAt}
                    xpReward={a.xp_reward}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
