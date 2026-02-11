"use client";

import { toast } from "sonner";

export function showAchievementToast(achievement: {
  title_de: string;
  xp_reward: number;
}) {
  toast.success(`Erfolg freigeschaltet: ${achievement.title_de}`, {
    description: `+${achievement.xp_reward} XP erhalten!`,
    duration: 5000,
  });
}
