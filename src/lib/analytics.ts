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
