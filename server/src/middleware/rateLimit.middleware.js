import ApiError from "../utils/ApiError.js";

/**
 * Lightweight in-memory sliding-window rate limiter.
 * Suitable for a single-process deployment. For multi-instance production,
 * replace with a Redis-backed limiter (e.g. express-rate-limit + ioredis).
 */
class RateLimiter {
  constructor({ windowMs = 60 * 1000, max = 100 } = {}) {
    this.windowMs = windowMs;
    this.max = max;
    this.hits = new Map();
  }

  middleware() {
    return (req, res, next) => {
      const key = `${req.ip}:${req.originalUrl.split("?")[0]}`;
      const now = Date.now();
      const windowStart = now - this.windowMs;

      const timestamps = (this.hits.get(key) || []).filter((ts) => ts > windowStart);

      if (timestamps.length >= this.max) {
        throw new ApiError(429, "Too many requests. Please try again later.");
      }

      timestamps.push(now);
      this.hits.set(key, timestamps);

      // Opportunistic cleanup to prevent unbounded memory growth
      if (this.hits.size > 10000) {
        for (const [k, v] of this.hits) {
          const remaining = v.filter((ts) => ts > windowStart);
          if (remaining.length === 0) this.hits.delete(k);
        }
      }

      next();
    };
  }
}

export const authRateLimiter = new RateLimiter({ windowMs: 15 * 60 * 1000, max: 20 }).middleware();
export const apiRateLimiter = new RateLimiter({ windowMs: 60 * 1000, max: 300 }).middleware();
