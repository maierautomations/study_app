import { toast } from "sonner";
import { triggerConfetti } from "@/components/gamification/level-up-celebration";

type GamificationResponse = {
  xp_earned: number;
  total_xp: number;
  level: number;
  leveled_up: boolean;
  streak: number;
  new_achievements: {
    key: string;
    title_de: string;
    xp_reward: number;
    icon: string;
  }[];
};

// Global event emitter for achievement celebrations
type AchievementListener = (achievement: {
  title_de: string;
  xp_reward: number;
  icon: string;
}) => void;

const achievementListeners: AchievementListener[] = [];

export function onAchievementUnlocked(listener: AchievementListener) {
  achievementListeners.push(listener);
  return () => {
    const idx = achievementListeners.indexOf(listener);
    if (idx >= 0) achievementListeners.splice(idx, 1);
  };
}

export async function trackActivity(
  action: string,
  courseId?: string,
  metadata?: Record<string, unknown>
): Promise<GamificationResponse | null> {
  try {
    const res = await fetch("/api/gamification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, courseId, metadata }),
    });

    if (!res.ok) return null;

    const data: GamificationResponse = await res.json();

    // Level-up celebration with confetti
    if (data.leveled_up) {
      triggerConfetti();
      toast.success(`Level ${data.level} erreicht!`, {
        description: `Du hast jetzt ${data.total_xp} XP.`,
        duration: 5000,
      });
    }

    // Show achievement celebrations
    for (const achievement of data.new_achievements) {
      // Notify listeners (for modal display)
      for (const listener of achievementListeners) {
        listener(achievement);
      }
      // Fallback toast if no listeners
      if (achievementListeners.length === 0) {
        toast.success(`Erfolg freigeschaltet: ${achievement.title_de}`, {
          description: `+${achievement.xp_reward} XP erhalten!`,
          duration: 5000,
        });
      }
    }

    return data;
  } catch {
    return null;
  }
}
