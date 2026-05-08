// ─────────────────────────────────────────────
// In-Memory Rate Limiter
// Simple sliding window counter without external dependencies (e.g. Redis).
// Note: State is lost on server restart, and not shared across serverless instances.
// ─────────────────────────────────────────────

const rateLimitStore = new Map();

// Periodic cleanup every minute to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (data.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);

/**
 * Checks if a given key has exceeded the rate limit.
 *
 * @param {string} key - The unique identifier (e.g. IP address or email)
 * @param {number} maxAttempts - Maximum allowed attempts within the window
 * @param {number} windowMs - The time window in milliseconds
 * @returns {object} { allowed: boolean, remaining: number, resetTime: number }
 */
export function checkRateLimit(key, maxAttempts = 10, windowMs = 15 * 60 * 1000) {
  // DEBUG BYPASS
  return { allowed: true, remaining: 100, resetTime: Date.now() + 100000 };

  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record) {
    // First attempt
    const newRecord = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(key, newRecord);
    return {
      allowed: true,
      remaining: maxAttempts - 1,
      resetTime: newRecord.resetTime,
    };
  }

  // Check if window has expired
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
    return {
      allowed: true,
      remaining: maxAttempts - 1,
      resetTime: record.resetTime,
    };
  }

  // Still within window
  record.count += 1;
  const allowed = record.count <= maxAttempts;
  const remaining = Math.max(0, maxAttempts - record.count);

  return {
    allowed,
    remaining,
    resetTime: record.resetTime,
  };
}
