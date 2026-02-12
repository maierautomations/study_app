// SuperMemo SM-2 Spaced Repetition Algorithm
// https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemory-method

export type ReviewQuality = 1 | 3 | 4 | 5;

// User button labels mapped to SM-2 quality values
export const QUALITY_MAP = {
  again: 1 as ReviewQuality,   // "Nochmal" — Blackout
  hard: 3 as ReviewQuality,    // "Schwer" — Correct with difficulty
  good: 4 as ReviewQuality,    // "Gut" — Correct after thinking
  easy: 5 as ReviewQuality,    // "Einfach" — Instantly known
} as const;

export const QUALITY_LABELS: Record<ReviewQuality, string> = {
  1: "Nochmal",
  3: "Schwer",
  4: "Gut",
  5: "Einfach",
};

export type SM2Result = {
  interval: number;       // Days until next review
  easeFactor: number;     // Updated ease factor (minimum 1.3)
  nextReviewDate: string; // ISO timestamp for next review
};

const DEFAULT_EASE_FACTOR = 2.5;
const MIN_EASE_FACTOR = 1.3;

export function calculateSM2(
  quality: number,
  previousInterval: number,
  previousEaseFactor: number
): SM2Result {
  const ef = previousEaseFactor || DEFAULT_EASE_FACTOR;

  let interval: number;
  let easeFactor: number;

  if (quality < 3) {
    // Failed — reset interval, keep ease factor
    interval = 0;
    easeFactor = ef;
  } else {
    // Passed — calculate new ease factor
    easeFactor = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    easeFactor = Math.max(easeFactor, MIN_EASE_FACTOR);

    if (previousInterval === 0) {
      // First successful review
      interval = 1;
    } else if (previousInterval === 1) {
      // Second successful review
      interval = 6;
    } else {
      // Subsequent reviews
      interval = Math.round(previousInterval * easeFactor);
    }
  }

  // Calculate next review date
  const now = new Date();
  const nextReview = new Date(now);
  if (interval === 0) {
    // Show again in 10 minutes (same session)
    nextReview.setMinutes(nextReview.getMinutes() + 10);
  } else {
    nextReview.setDate(nextReview.getDate() + interval);
  }

  return {
    interval,
    easeFactor: Math.round(easeFactor * 100) / 100,
    nextReviewDate: nextReview.toISOString(),
  };
}

// Get previous review data for a flashcard, or defaults for new cards
export function getDefaultReviewState() {
  return {
    interval: 0,
    easeFactor: DEFAULT_EASE_FACTOR,
  };
}
