// XP rewards per activity
export const XP_REWARDS = {
  quiz_complete: 50,
  perfect_quiz: 100,
  flashcard_review: 10,
  document_upload: 20,
  chat_message: 5,
  course_create: 30,
  daily_goal_complete: 25,
  pomodoro_complete: 15,
} as const;

export type ActivityType = keyof typeof XP_REWARDS;

// Estimated minutes per activity (for daily learning goal tracking)
export const ACTIVITY_MINUTES: Record<string, number> = {
  quiz_complete: 10,
  perfect_quiz: 10,
  flashcard_review: 2,
  document_upload: 3,
  chat_message: 2,
  course_create: 1,
  pomodoro_complete: 25,
};

// Level thresholds — progressive XP requirements
export const LEVEL_THRESHOLDS = [
  0,     // Level 1
  100,   // Level 2
  250,   // Level 3
  500,   // Level 4
  1000,  // Level 5
  1750,  // Level 6
  2750,  // Level 7
  4000,  // Level 8
  5500,  // Level 9
  7500,  // Level 10
  10000, // Level 11
  13000, // Level 12
  16500, // Level 13
  20500, // Level 14
  25000, // Level 15
];

export function calculateLevel(xp: number): number {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  return level;
}

export function xpForNextLevel(currentXp: number): {
  currentLevel: number;
  nextLevelXp: number;
  currentLevelXp: number;
  progress: number;
} {
  const currentLevel = calculateLevel(currentXp);
  const currentLevelXp = LEVEL_THRESHOLDS[currentLevel - 1] ?? 0;
  const nextLevelXp =
    LEVEL_THRESHOLDS[currentLevel] ??
    LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 5000;

  const xpInLevel = currentXp - currentLevelXp;
  const xpNeeded = nextLevelXp - currentLevelXp;
  const progress = Math.min(Math.round((xpInLevel / xpNeeded) * 100), 100);

  return { currentLevel, nextLevelXp, currentLevelXp, progress };
}

export function updateStreak(
  lastStudyDate: string | null,
  profile?: { tier: string; streak_freezes_remaining: number; current_streak: number }
): {
  newStreak: number;
  streakContinued: boolean;
  freezeUsed: boolean;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  if (!lastStudyDate) {
    return { newStreak: 1, streakContinued: false, freezeUsed: false };
  }

  if (lastStudyDate === todayStr) {
    // Already studied today — streak unchanged
    return { newStreak: -1, streakContinued: true, freezeUsed: false };
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (lastStudyDate === yesterdayStr) {
    // Studied yesterday — streak continues
    return { newStreak: -1, streakContinued: true, freezeUsed: false };
    // Note: -1 means "increment by 1" — handled by caller
  }

  // Check if streak freeze can save the streak (missed exactly 1 day)
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const twoDaysAgoStr = twoDaysAgo.toISOString().split("T")[0];

  if (
    lastStudyDate === twoDaysAgoStr &&
    profile &&
    profile.tier === "premium" &&
    profile.streak_freezes_remaining > 0 &&
    profile.current_streak > 0
  ) {
    // Streak freeze saves the streak — missed exactly 1 day
    return { newStreak: -1, streakContinued: true, freezeUsed: true };
  }

  // Streak broken — start fresh
  return { newStreak: 1, streakContinued: false, freezeUsed: false };
}

// Check and refill streak freezes for Pro users (2/month)
export function checkStreakFreezeRefill(profile: {
  tier: string;
  streak_freezes_remaining: number;
  streak_freezes_reset_at: string;
}): { shouldRefill: boolean; newResetAt: string } {
  if (profile.tier !== "premium") {
    return { shouldRefill: false, newResetAt: profile.streak_freezes_reset_at };
  }
  const resetAt = new Date(profile.streak_freezes_reset_at);
  const now = new Date();
  if (now >= resetAt) {
    const newReset = new Date(now);
    newReset.setDate(newReset.getDate() + 30);
    return { shouldRefill: true, newResetAt: newReset.toISOString() };
  }
  return { shouldRefill: false, newResetAt: profile.streak_freezes_reset_at };
}

// Achievement check functions
type AchievementCheck = {
  key: string;
  check: (stats: UserStats) => boolean;
};

export type UserStats = {
  courseCount: number;
  documentCount: number;
  quizCount: number;
  flashcardSessionCount: number;
  perfectQuizCount: number;
  currentStreak: number;
  level: number;
  // Extended stats for new achievements
  chatMessageCount?: number;
  totalFlashcardReviews?: number;
  quizzesToday?: number;
  flashcardReviewsThisWeek?: number;
  consecutiveHighScores?: number;
  distinctCoursesUsed?: number;
  currentHour?: number;
};

const ACHIEVEMENT_CHECKS: AchievementCheck[] = [
  // Original 12
  { key: "first_course", check: (s) => s.courseCount >= 1 },
  { key: "five_courses", check: (s) => s.courseCount >= 5 },
  { key: "first_upload", check: (s) => s.documentCount >= 1 },
  { key: "ten_uploads", check: (s) => s.documentCount >= 10 },
  { key: "first_quiz", check: (s) => s.quizCount >= 1 },
  { key: "quiz_master", check: (s) => s.quizCount >= 10 },
  { key: "perfect_quiz", check: (s) => s.perfectQuizCount >= 1 },
  { key: "first_flashcard", check: (s) => s.flashcardSessionCount >= 1 },
  { key: "streak_3", check: (s) => s.currentStreak >= 3 },
  { key: "streak_7", check: (s) => s.currentStreak >= 7 },
  { key: "streak_30", check: (s) => s.currentStreak >= 30 },
  { key: "level_5", check: (s) => s.level >= 5 },
  // New achievements (Phase 4.3)
  { key: "quiz_marathon", check: (s) => (s.quizzesToday ?? 0) >= 5 },
  { key: "flawless", check: (s) => (s.consecutiveHighScores ?? 0) >= 3 },
  { key: "card_king", check: (s) => (s.flashcardReviewsThisWeek ?? 0) >= 100 },
  { key: "diligent_learner", check: (s) => (s.totalFlashcardReviews ?? 0) >= 500 },
  { key: "half_year_streak", check: (s) => s.currentStreak >= 100 },
  { key: "curious", check: (s) => (s.chatMessageCount ?? 0) >= 20 },
  { key: "explorer", check: (s) => (s.distinctCoursesUsed ?? 0) >= 3 },
  { key: "expert", check: (s) => s.level >= 10 },
  { key: "night_owl", check: (s) => {
    const h = s.currentHour ?? 12;
    return h >= 22 || h < 6;
  }},
  { key: "early_bird", check: (s) => (s.currentHour ?? 12) < 8 },
];

export function checkNewAchievements(
  stats: UserStats,
  existingAchievementKeys: string[]
): string[] {
  return ACHIEVEMENT_CHECKS.filter(
    (a) => !existingAchievementKeys.includes(a.key) && a.check(stats)
  ).map((a) => a.key);
}

export function getXpForActivity(activity: ActivityType): number {
  return XP_REWARDS[activity];
}

export function getMinutesForActivity(activity: string): number {
  return ACTIVITY_MINUTES[activity] ?? 0;
}
