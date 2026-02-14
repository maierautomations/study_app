"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";
import { triggerConfetti } from "./level-up-celebration";
import { useEffect } from "react";

interface AchievementCelebrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  achievement: {
    title_de: string;
    xp_reward: number;
    icon: string;
  } | null;
}

export function AchievementCelebrationModal({
  open,
  onOpenChange,
  achievement,
}: AchievementCelebrationModalProps) {
  useEffect(() => {
    if (open) {
      triggerConfetti();
    }
  }, [open]);

  if (!achievement) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm text-center">
        <DialogHeader className="items-center">
          <div className="text-5xl mb-2">{achievement.icon}</div>
          <DialogTitle className="text-xl">Erfolg freigeschaltet!</DialogTitle>
          <DialogDescription className="text-base font-medium text-foreground">
            {achievement.title_de}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center gap-2 text-sm text-primary font-medium py-2">
          <Trophy className="h-4 w-4" />
          +{achievement.xp_reward} XP
        </div>
        <Button onClick={() => onOpenChange(false)} className="w-full">
          Weiter lernen
        </Button>
      </DialogContent>
    </Dialog>
  );
}
