"use client";

import { Flame, Snowflake } from "lucide-react";

export function StreakDisplay({
  streak,
  compact = false,
  freezesRemaining,
  isPro = false,
}: {
  streak: number;
  compact?: boolean;
  freezesRemaining?: number;
  isPro?: boolean;
}) {
  const isActive = streak > 0;
  const showFreezes = isPro && freezesRemaining !== undefined;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-xs">
        <Flame
          className={`h-3.5 w-3.5 ${isActive ? "text-orange-500" : "text-muted-foreground"}`}
        />
        <span className={isActive ? "font-medium" : "text-muted-foreground"}>
          {streak}
        </span>
        {showFreezes && freezesRemaining > 0 && (
          <Snowflake className="h-3 w-3 text-blue-400" />
        )}
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
        {showFreezes && (
          <p className="text-xs text-blue-400 flex items-center gap-1 mt-0.5">
            <Snowflake className="h-3 w-3" />
            {freezesRemaining} Streak-Freeze{freezesRemaining !== 1 ? "s" : ""} übrig
          </p>
        )}
      </div>
    </div>
  );
}
