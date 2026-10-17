import ApiError from "../utils/ApiError.js";

/**
 * Sliding Window Rate Limiter & Queue Overflow Protection
 * Throttles Gemini API requests per minute (RPM) and protects against model rate limits.
 */
class AIRateLimiter {
  constructor({ maxRequestsPerMinute = 60, overflowQueueLimit = 100 } = {}) {
    this.maxRequestsPerMinute = maxRequestsPerMinute;
    this.overflowQueueLimit = overflowQueueLimit;
    this.requestTimestamps = [];
  }

  /**
   * Acquire execution slot or throw 429 Error if rate limits are exceeded
   */
  async acquireSlot() {
    const now = Date.now();
    const windowStart = now - 60 * 1000;

    // Purge timestamps older than 60 seconds
    this.requestTimestamps = this.requestTimestamps.filter((ts) => ts > windowStart);

    if (this.requestTimestamps.length >= this.maxRequestsPerMinute) {
      const oldestRequest = this.requestTimestamps[0];
      const timeToWaitMs = oldestRequest + 60 * 1000 - now;

      console.warn(
        `[AI Rate Limiter Throttled] Limit of ${this.maxRequestsPerMinute} RPM reached. ` +
        `Slot available in ${Math.round(timeToWaitMs)}ms.`
      );

      if (this.requestTimestamps.length >= this.maxRequestsPerMinute + this.overflowQueueLimit) {
        throw new ApiError(
          429,
          "AI service rate limit and queue capacity exceeded. Please try again shortly."
        );
      }

      // Pause execution until window resets
      await new Promise((resolve) => setTimeout(resolve, Math.max(100, timeToWaitMs)));
    }

    this.requestTimestamps.push(Date.now());
    return true;
  }

  /**
   * Get current rate limit stats
   */
  getStats() {
    const now = Date.now();
    const windowStart = now - 60 * 1000;
    const activeInWindow = this.requestTimestamps.filter((ts) => ts > windowStart).length;

    return {
      activeInWindow,
      maxRequestsPerMinute: this.maxRequestsPerMinute,
      capacityRemaining: Math.max(0, this.maxRequestsPerMinute - activeInWindow),
    };
  }
}

export default new AIRateLimiter();
