import { showAchievementToast } from "@/components/gamification/achievement-toast";

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

    // Show achievement toasts
    for (const achievement of data.new_achievements) {
      showAchievementToast(achievement);
    }

    return data;
  } catch {
    return null;
  }
}
