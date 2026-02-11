"use client";

import {
  Trophy,
  BookOpen,
  Library,
  Upload,
  Files,
  HelpCircle,
  Brain,
  Star,
  Layers,
  Flame,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";

const ICON_MAP: Record<string, React.ElementType> = {
  trophy: Trophy,
  "book-open": BookOpen,
  library: Library,
  upload: Upload,
  files: Files,
  "help-circle": HelpCircle,
  brain: Brain,
  star: Star,
  layers: Layers,
  flame: Flame,
  "trending-up": TrendingUp,
};

export function AchievementBadge({
  title,
  description,
  icon,
  unlocked,
  unlockedAt,
  xpReward,
}: {
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  xpReward: number;
}) {
  const IconComponent = ICON_MAP[icon] ?? Trophy;

  return (
    <Card
      className={`p-4 transition-all ${
        unlocked
          ? "border-primary/30 bg-primary/5"
          : "opacity-60 grayscale"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            unlocked
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <IconComponent className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-medium text-primary">
              +{xpReward} XP
            </span>
            {unlocked && unlockedAt && (
              <span className="text-xs text-muted-foreground">
                {new Date(unlockedAt).toLocaleDateString("de-DE")}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
