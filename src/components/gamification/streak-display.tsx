"use client";

import { Flame } from "lucide-react";

export function StreakDisplay({
  streak,
  compact = false,
}: {
  streak: number;
  compact?: boolean;
}) {
  const isActive = streak > 0;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-xs">
        <Flame
          className={`h-3.5 w-3.5 ${isActive ? "text-orange-500" : "text-muted-foreground"}`}
        />
        <span className={isActive ? "font-medium" : "text-muted-foreground"}>
          {streak}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full ${
          isActive
            ? "bg-orange-500/10 animate-pulse"
            : "bg-muted"
        }`}
      >
        <Flame
          className={`h-5 w-5 ${isActive ? "text-orange-500" : "text-muted-foreground"}`}
        />
      </div>
      <div>
        <p className="text-sm font-medium">
          {streak} {streak === 1 ? "Tag" : "Tage"} Serie
        </p>
        <p className="text-xs text-muted-foreground">
          {isActive
            ? "Weiter so!"
            : "Lerne heute, um eine Serie zu starten!"}
        </p>
      </div>
    </div>
  );
}
