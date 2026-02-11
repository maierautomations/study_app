"use client";

import { Progress } from "@/components/ui/progress";
import { xpForNextLevel } from "@/lib/gamification";

export function XpProgress({
  xp,
  compact = false,
}: {
  xp: number;
  compact?: boolean;
}) {
  const { currentLevel, nextLevelXp, currentLevelXp, progress } =
    xpForNextLevel(xp);

  if (compact) {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium">Stufe {currentLevel}</span>
          <span className="text-muted-foreground">{xp} XP</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
            {currentLevel}
          </div>
          <div>
            <p className="text-sm font-medium">Stufe {currentLevel}</p>
            <p className="text-xs text-muted-foreground">
              {xp - currentLevelXp} / {nextLevelXp - currentLevelXp} XP
            </p>
          </div>
        </div>
        <span className="text-sm font-semibold text-primary">{xp} XP</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}
