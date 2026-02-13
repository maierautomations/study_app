import type { QuizAnswer } from "@/types/database";

export type DocumentWeakness = {
  documentId: string;
  documentName: string;
  totalQuestions: number;
  incorrectCount: number;
  errorRate: number; // 0.0 to 1.0
};

export type QuizTrend = {
  quizId: string;
  title: string;
  score: number;
  date: string;
};

/**
 * Analyzes quiz attempts to find weak areas per document.
 * Pure client-side computation, no API cost.
 */
export function analyzeWeaknesses(
  attempts: Array<{
    quiz_id: string;
    answers: QuizAnswer[];
    score: number;
  }>,
  quizzes: Array<{
    id: string;
    document_ids: string[];
    title: string;
  }>,
  documents: Array<{
    id: string;
    name: string;
  }>
): DocumentWeakness[] {
  // Map quiz_id → document_ids
  const quizDocMap = new Map<string, string[]>();
  for (const quiz of quizzes) {
    quizDocMap.set(quiz.id, quiz.document_ids);
  }

  // Aggregate incorrect answers per document
  const docStats = new Map<
    string,
    { total: number; incorrect: number }
  >();

  for (const attempt of attempts) {
    const documentIds = quizDocMap.get(attempt.quiz_id);
    if (!documentIds || documentIds.length === 0) continue;

    const answers = attempt.answers as QuizAnswer[];
    if (!Array.isArray(answers)) continue;

    const totalPerDoc = answers.length;
    const incorrectPerDoc = answers.filter((a) => !a.is_correct).length;

    // Distribute stats across all linked documents
    for (const docId of documentIds) {
      const existing = docStats.get(docId) ?? { total: 0, incorrect: 0 };
      existing.total += totalPerDoc;
      existing.incorrect += incorrectPerDoc;
      docStats.set(docId, existing);
    }
  }

  // Build result with document names
  const docNameMap = new Map(documents.map((d) => [d.id, d.name]));
  const weaknesses: DocumentWeakness[] = [];

  for (const [docId, stats] of docStats) {
    if (stats.total === 0) continue;
    weaknesses.push({
      documentId: docId,
      documentName: docNameMap.get(docId) ?? "Unbekannt",
      totalQuestions: stats.total,
      incorrectCount: stats.incorrect,
      errorRate: stats.incorrect / stats.total,
    });
  }

  // Sort by error rate descending (weakest first)
  weaknesses.sort((a, b) => b.errorRate - a.errorRate);

  return weaknesses;
}

export type GradePrediction = {
  predictedGrade: string; // e.g. "2,3"
  predictedScore: number; // 0-100
  confidence: "low" | "medium" | "high";
  trend: "improving" | "stable" | "declining";
  minGrade: string; // optimistic
  maxGrade: string; // pessimistic
  dataPoints: number;
};

/**
 * Maps a percentage score (0-100) to a German university grade (1,0-5,0).
 */
function scoreToGermanGrade(score: number): string {
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

/**
 * Predicts the expected grade based on recent quiz performance.
 * Uses exponentially weighted moving average (recent scores count more).
 * Pure client-side computation, no API cost.
 */
export function predictGrade(
  attempts: Array<{
    score: number;
    created_at: string;
  }>
): GradePrediction | null {
  if (attempts.length === 0) return null;

  // Sort by date ascending (oldest first)
  const sorted = [...attempts].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Take last 10 attempts max
  const recent = sorted.slice(-10);

  // Exponentially weighted average (decay factor 0.7 — newer scores weigh more)
  const decay = 0.7;
  let weightedSum = 0;
  let weightTotal = 0;

  for (let i = 0; i < recent.length; i++) {
    const weight = Math.pow(decay, recent.length - 1 - i);
    weightedSum += recent[i].score * weight;
    weightTotal += weight;
  }

  const predictedScore = Math.round(weightedSum / weightTotal);

  // Calculate standard deviation for confidence interval
  const scores = recent.map((a) => a.score);
  const mean = scores.reduce((s, v) => s + v, 0) / scores.length;
  const variance =
    scores.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);

  // Confidence based on data points and variance
  let confidence: "low" | "medium" | "high";
  if (recent.length < 3) {
    confidence = "low";
  } else if (recent.length < 5 || stdDev > 20) {
    confidence = "medium";
  } else {
    confidence = "high";
  }

  // Trend detection (compare first half vs second half)
  let trend: "improving" | "stable" | "declining";
  if (recent.length >= 4) {
    const mid = Math.floor(recent.length / 2);
    const firstHalf = recent.slice(0, mid);
    const secondHalf = recent.slice(mid);
    const avgFirst =
      firstHalf.reduce((s, a) => s + a.score, 0) / firstHalf.length;
    const avgSecond =
      secondHalf.reduce((s, a) => s + a.score, 0) / secondHalf.length;
    const diff = avgSecond - avgFirst;

    if (diff > 5) trend = "improving";
    else if (diff < -5) trend = "declining";
    else trend = "stable";
  } else {
    trend = "stable";
  }

  // Min/max grades (±1 stdDev, clamped 0-100)
  const optimisticScore = Math.min(100, Math.round(predictedScore + stdDev));
  const pessimisticScore = Math.max(0, Math.round(predictedScore - stdDev));

  return {
    predictedGrade: scoreToGermanGrade(predictedScore),
    predictedScore,
    confidence,
    trend,
    minGrade: scoreToGermanGrade(optimisticScore),
    maxGrade: scoreToGermanGrade(pessimisticScore),
    dataPoints: recent.length,
  };
}

/**
 * Computes quiz score trend over time for a course.
 */
export function computeQuizTrend(
  attempts: Array<{
    quiz_id: string;
    score: number;
    created_at: string;
  }>,
  quizzes: Array<{
    id: string;
    title: string;
  }>
): QuizTrend[] {
  const quizTitleMap = new Map(quizzes.map((q) => [q.id, q.title]));

  return attempts
    .map((a) => ({
      quizId: a.quiz_id,
      title: quizTitleMap.get(a.quiz_id) ?? "Quiz",
      score: a.score,
      date: a.created_at,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
