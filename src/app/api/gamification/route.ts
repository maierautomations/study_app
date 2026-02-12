import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getXpForActivity,
  calculateLevel,
  updateStreak,
  checkNewAchievements,
  type ActivityType,
  type UserStats,
} from "@/lib/gamification";
import type { Profile, Achievement } from "@/types/database";

export async function POST(req: Request) {
  const { action, courseId, metadata } = (await req.json()) as {
    action: ActivityType;
    courseId?: string;
    metadata?: Record<string, unknown>;
  };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  // Get current profile
  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  const profile = profileRaw as unknown as Profile | null;

  if (!profile) {
    return NextResponse.json({ error: "Profil nicht gefunden" }, { status: 404 });
  }

  // Calculate XP reward
  const xpEarned = getXpForActivity(action);
  const newXp = profile.xp + xpEarned;
  const newLevel = calculateLevel(newXp);
  const leveledUp = newLevel > profile.level;

  // Update streak
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];
  const streakResult = updateStreak(profile.last_study_date);

  let newStreak = profile.current_streak;
  if (streakResult.newStreak === 1) {
    // Streak broken or first day
    newStreak = 1;
  } else if (streakResult.streakContinued && profile.last_study_date !== todayStr) {
    // Studied yesterday, continuing streak
    newStreak = profile.current_streak + 1;
  }
  // If already studied today, streak stays the same

  const newLongestStreak = Math.max(profile.longest_streak, newStreak);

  // Update profile
  await supabase
    .from("profiles")
    .update({
      xp: newXp,
      level: newLevel,
      current_streak: newStreak,
      longest_streak: newLongestStreak,
      last_study_date: todayStr,
    } as never)
    .eq("id", user.id);

  // Record study session
  await supabase.from("study_sessions").insert({
    user_id: user.id,
    activity_type: action,
    course_id: courseId ?? null,
    metadata: metadata ?? {},
    xp_earned: xpEarned,
  } as never);

  // Check for new achievements
  const [
    { count: courseCount },
    { count: documentCount },
    { count: quizCount },
    { count: flashcardSessionCount },
  ] = await Promise.all([
    supabase.from("courses").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("documents").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("quiz_attempts").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("flashcard_reviews").select("*", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  // Count perfect quizzes
  const { count: perfectQuizCount } = await supabase
    .from("quiz_attempts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("score", 100);

  const stats: UserStats = {
    courseCount: courseCount ?? 0,
    documentCount: documentCount ?? 0,
    quizCount: quizCount ?? 0,
    flashcardSessionCount: flashcardSessionCount ?? 0,
    perfectQuizCount: perfectQuizCount ?? 0,
    currentStreak: newStreak,
    level: newLevel,
  };

  // Get existing achievements
  const { data: existingUserAchievementsRaw } = await supabase
    .from("user_achievements")
    .select("achievement_id, achievements(key)")
    .eq("user_id", user.id);
  const existingUserAchievements = existingUserAchievementsRaw as unknown as Array<{ achievement_id: string; achievements: { key: string } | null }> | null;

  const existingKeys = (existingUserAchievements ?? []).map(
    (ua) => ua.achievements?.key ?? ""
  );

  const newAchievementKeys = checkNewAchievements(stats, existingKeys);

  // Unlock new achievements
  const newAchievements: { key: string; title_de: string; xp_reward: number; icon: string }[] = [];
  if (newAchievementKeys.length > 0) {
    const { data: achievementRowsRaw } = await supabase
      .from("achievements")
      .select("*")
      .in("key", newAchievementKeys);
    const achievementRows = achievementRowsRaw as unknown as Achievement[] | null;

    if (achievementRows) {
      let bonusXp = 0;
      for (const achievement of achievementRows) {
        await supabase.from("user_achievements").insert({
          user_id: user.id,
          achievement_id: achievement.id,
        } as never);
        bonusXp += achievement.xp_reward;
        newAchievements.push({
          key: achievement.key,
          title_de: achievement.title_de,
          xp_reward: achievement.xp_reward,
          icon: achievement.icon,
        });
      }

      // Add achievement bonus XP
      if (bonusXp > 0) {
        const totalXp = newXp + bonusXp;
        await supabase
          .from("profiles")
          .update({ xp: totalXp, level: calculateLevel(totalXp) } as never)
          .eq("id", user.id);
      }
    }
  }

  return NextResponse.json({
    xp_earned: xpEarned,
    total_xp: newXp,
    level: newLevel,
    leveled_up: leveledUp,
    streak: newStreak,
    new_achievements: newAchievements,
  });
}
