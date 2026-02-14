import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getXpForActivity,
  getMinutesForActivity,
  calculateLevel,
  updateStreak,
  checkNewAchievements,
  checkStreakFreezeRefill,
  type UserStats,
} from "@/lib/gamification";
import { parseBody, gamificationSchema } from "@/lib/validations";
import type { Profile, Achievement } from "@/types/database";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = parseBody(gamificationSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { action, courseId, metadata } = parsed.data;

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

  // Check/refill streak freezes for Pro users
  const freezeRefill = checkStreakFreezeRefill(profile);

  // Update streak (with streak freeze support)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];
  const streakResult = updateStreak(profile.last_study_date, {
    tier: profile.tier,
    streak_freezes_remaining: freezeRefill.shouldRefill ? 2 : profile.streak_freezes_remaining,
    current_streak: profile.current_streak,
  });

  let newStreak = profile.current_streak;
  if (streakResult.newStreak === 1) {
    // Streak broken or first day
    newStreak = 1;
  } else if (streakResult.streakContinued && profile.last_study_date !== todayStr) {
    // Studied yesterday (or freeze saved), continuing streak
    newStreak = profile.current_streak + 1;
  }
  // If already studied today, streak stays the same

  const newLongestStreak = Math.max(profile.longest_streak, newStreak);

  // Calculate streak freezes remaining
  let freezesRemaining = freezeRefill.shouldRefill ? 2 : profile.streak_freezes_remaining;
  if (streakResult.freezeUsed) {
    freezesRemaining = Math.max(0, freezesRemaining - 1);
  }

  // Daily goal tracking
  const activityMinutes = getMinutesForActivity(action);
  let dailyProgress = profile.daily_goal_progress;
  let dailyGoalDate = profile.daily_goal_date;
  let dailyGoalJustCompleted = false;

  // Reset progress if it's a new day
  if (dailyGoalDate !== todayStr) {
    dailyProgress = 0;
    dailyGoalDate = todayStr;
  }

  const wasAlreadyCompleted = dailyProgress >= profile.daily_goal_minutes;
  dailyProgress += activityMinutes;
  const isNowCompleted = dailyProgress >= profile.daily_goal_minutes;

  if (isNowCompleted && !wasAlreadyCompleted) {
    dailyGoalJustCompleted = true;
  }

  // Build profile update
  const profileUpdate: Record<string, unknown> = {
    xp: dailyGoalJustCompleted ? newXp + 25 : newXp, // +25 XP bonus for daily goal
    level: dailyGoalJustCompleted ? calculateLevel(newXp + 25) : newLevel,
    current_streak: newStreak,
    longest_streak: newLongestStreak,
    last_study_date: todayStr,
    daily_goal_progress: dailyProgress,
    daily_goal_date: dailyGoalDate,
    streak_freezes_remaining: freezesRemaining,
  };

  if (freezeRefill.shouldRefill) {
    profileUpdate.streak_freezes_reset_at = freezeRefill.newResetAt;
  }

  await supabase
    .from("profiles")
    .update(profileUpdate as never)
    .eq("id", user.id);

  // Record study session
  await supabase.from("study_sessions").insert({
    user_id: user.id,
    activity_type: action,
    course_id: courseId ?? null,
    metadata: metadata ?? {},
    xp_earned: xpEarned,
  } as never);

  // Check for new achievements (single RPC call — N+1 fix)
  const { data: rpcStats } = await (supabase.rpc as Function)("get_user_stats", {
    p_user_id: user.id,
  });

  const stats: UserStats = {
    courseCount: rpcStats?.course_count ?? 0,
    documentCount: rpcStats?.document_count ?? 0,
    quizCount: rpcStats?.quiz_count ?? 0,
    flashcardSessionCount: rpcStats?.flashcard_session_count ?? 0,
    perfectQuizCount: rpcStats?.perfect_quiz_count ?? 0,
    currentStreak: newStreak,
    level: dailyGoalJustCompleted ? calculateLevel(newXp + 25) : newLevel,
    // Extended stats
    chatMessageCount: rpcStats?.chat_message_count ?? 0,
    totalFlashcardReviews: rpcStats?.total_flashcard_reviews ?? 0,
    quizzesToday: rpcStats?.quizzes_today ?? 0,
    flashcardReviewsThisWeek: rpcStats?.flashcard_reviews_this_week ?? 0,
    consecutiveHighScores: rpcStats?.consecutive_high_scores ?? 0,
    distinctCoursesUsed: rpcStats?.distinct_courses_used ?? 0,
    currentHour: new Date().getHours(),
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
        const currentXp = dailyGoalJustCompleted ? newXp + 25 : newXp;
        const totalXp = currentXp + bonusXp;
        await supabase
          .from("profiles")
          .update({ xp: totalXp, level: calculateLevel(totalXp) } as never)
          .eq("id", user.id);
      }
    }
  }

  const finalXp = dailyGoalJustCompleted ? newXp + 25 : newXp;

  return NextResponse.json({
    xp_earned: xpEarned + (dailyGoalJustCompleted ? 25 : 0),
    total_xp: finalXp,
    level: calculateLevel(finalXp),
    leveled_up: leveledUp,
    streak: newStreak,
    streak_freeze_used: streakResult.freezeUsed,
    daily_goal_completed: dailyGoalJustCompleted,
    daily_goal_progress: dailyProgress,
    daily_goal_target: profile.daily_goal_minutes,
    new_achievements: newAchievements,
  });
}
