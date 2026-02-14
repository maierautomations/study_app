"use client";

import { useState, useEffect } from "react";
import { onAchievementUnlocked } from "@/lib/gamification-client";
import { AchievementCelebrationModal } from "./achievement-celebration-modal";

export function AchievementListener() {
  const [achievement, setAchievement] = useState<{
    title_de: string;
    xp_reward: number;
    icon: string;
  } | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAchievementUnlocked((a) => {
      setAchievement(a);
      setOpen(true);
    });
    return unsubscribe;
  }, []);

  return (
    <AchievementCelebrationModal
      open={open}
      onOpenChange={setOpen}
      achievement={achievement}
    />
  );
}
