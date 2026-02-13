/**
 * Maps a percentage score (0-100) to a German university grade (1,0-5,0).
 * Shared across analytics, exam grading, and other grade-related features.
 */
export function scoreToGermanGrade(score: number): string {
  if (score >= 95) return "1,0";
  if (score >= 90) return "1,3";
  if (score >= 85) return "1,7";
  if (score >= 80) return "2,0";
  if (score >= 75) return "2,3";
  if (score >= 70) return "2,7";
  if (score >= 65) return "3,0";
  if (score >= 60) return "3,3";
  if (score >= 55) return "3,7";
  if (score >= 50) return "4,0";
  return "5,0";
}
