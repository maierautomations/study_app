"use client";

import { useEffect, useCallback } from "react";
import confetti from "canvas-confetti";

interface LevelUpCelebrationProps {
  level: number;
  onComplete?: () => void;
}

export function triggerConfetti() {
  const duration = 2000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ["#3b82f6", "#8b5cf6", "#f59e0b"],
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ["#3b82f6", "#8b5cf6", "#f59e0b"],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
}

export function LevelUpCelebration({ level, onComplete }: LevelUpCelebrationProps) {
  const celebrate = useCallback(() => {
    triggerConfetti();
    if (onComplete) {
      setTimeout(onComplete, 2500);
    }
  }, [onComplete]);

  useEffect(() => {
    celebrate();
  }, [celebrate]);

  return null;
}
