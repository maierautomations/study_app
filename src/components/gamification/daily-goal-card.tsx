"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Check } from "lucide-react";

interface DailyGoalCardProps {
  progress: number;
  target: number;
}

export function DailyGoalCard({ progress, target }: DailyGoalCardProps) {
  const percentage = Math.min(Math.round((progress / target) * 100), 100);
  const isCompleted = progress >= target;

  // SVG circular progress ring
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percentage / 100) * circumference;

  return (
    <Card className={isCompleted ? "border-green-500/30 bg-green-500/5" : ""}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4" />
          Tagesziel
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          {/* Circular progress ring */}
          <div className="relative flex-shrink-0">
            <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
              {/* Background circle */}
              <circle
                cx="48"
                cy="48"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                className="text-muted/20"
              />
              {/* Progress circle */}
              <circle
                cx="48"
                cy="48"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className={`transition-all duration-700 ease-out ${
                  isCompleted ? "text-green-500" : "text-primary"
                }`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              {isCompleted ? (
                <Check className="h-8 w-8 text-green-500" />
              ) : (
                <span className="text-lg font-bold">{percentage}%</span>
              )}
            </div>
          </div>
          {/* Text info */}
          <div className="min-w-0">
            <p className="text-sm font-medium">
              {isCompleted ? "Tagesziel erreicht!" : `${progress} / ${target} Min.`}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isCompleted
                ? "+25 XP Bonus erhalten"
                : `Noch ${Math.max(0, target - progress)} Minuten`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
