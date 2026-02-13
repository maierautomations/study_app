import type { Profile } from "@/types/database";

// XP rewards per activity
export const XP_REWARDS = {
  quiz_complete: 50,
  perfect_quiz: 100,
  flashcard_review: 10,
  document_upload: 20,
  chat_message: 5,
  course_create: 30,
} as const;

export type ActivityType = keyof typeof XP_REWARDS;

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

export function updateStreak(lastStudyDate: string | null): {
  newStreak: number;
  streakContinued: boolean;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  if (!lastStudyDate) {
    return { newStreak: 1, streakContinued: false };
  }

  if (lastStudyDate === todayStr) {
    // Already studied today — streak unchanged
    return { newStreak: -1, streakContinued: true };
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (lastStudyDate === yesterdayStr) {
    // Studied yesterday — streak continues
    return { newStreak: -1, streakContinued: true };
    // Note: -1 means "increment by 1" — handled by caller
  }

  // Streak broken — start fresh
  return { newStreak: 1, streakContinued: false };
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
};

const ACHIEVEMENT_CHECKS: AchievementCheck[] = [
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
