// Simple sliding window rate limiter (in-memory)
// Resets on server restart — appropriate for single-instance deployments

type RateLimitEntry = {
  timestamps: number[];
};

const store = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetInMs: number;
};

/**
 * Check and consume a rate limit token.
 * @param key - Unique identifier (e.g., `userId:routeName`)
 * @param maxRequests - Max requests per window
 * @param windowMs - Window size in milliseconds
 */
export function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  cleanup(windowMs);

  const now = Date.now();
  let entry = store.get(key);

  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove expired timestamps
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= maxRequests) {
    const oldestInWindow = entry.timestamps[0];
    const resetInMs = oldestInWindow + windowMs - now;
    return {
      success: false,
      remaining: 0,
      resetInMs,
    };
  }

  entry.timestamps.push(now);
  return {
    success: true,
    remaining: maxRequests - entry.timestamps.length,
    resetInMs: windowMs,
  };
}

/**
 * Rate limit config for AI routes:
 * 10 requests per minute per user
 */
export const AI_RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
} as const;
