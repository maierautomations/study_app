/**
 * Central configuration for AI-related limits and settings.
 * Avoids hardcoded magic numbers scattered across API routes.
 */

// Maximum characters of document context to pass to the LLM
export const AI_CONTEXT_LIMITS = {
  default: 12000,   // quiz, flashcards, summary, glossary
  exam: 15000,      // exam generation gets more context
} as const;
