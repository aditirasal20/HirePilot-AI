import aiLogger from "./ai.logger.js";

/**
 * Exponential Backoff Retry Strategy Handler
 * Retries failed operations on transient API errors (429 Rate Limit, 500 Internal, 503 Service Unavailable, Timeouts).
 */
class RetryStrategy {
  /**
   * Execute an async function with exponential backoff retries
   * 
   * @param {Function} fn - Async operation function to execute
   * @param {Object} options - Retry configuration options
   */
  async execute(
    fn,
    {
      maxRetries = 3,
      initialDelayMs = 1000,
      maxDelayMs = 10000,
      backoffFactor = 2,
      moduleName = "AI_MODULE",
      promptName = "UNKNOWN_PROMPT",
      version = "1.0.0",
    } = {}
  ) {
    let attempt = 0;
    let delay = initialDelayMs;
    const startTime = Date.now();

    while (attempt < maxRetries) {
      attempt++;
      try {
        const result = await fn();
        return result;
      } catch (error) {
        const isRetryable = this._isRetryableError(error);
        const willRetry = isRetryable && attempt < maxRetries;

        aiLogger.logFailure({
          moduleName,
          promptName,
          version,
          latencyMs: Date.now() - startTime,
          error,
          attempt,
          willRetry,
        });

        if (!willRetry) {
          throw error;
        }

        // Add randomized jitter to prevent thundering herd problem
        const jitter = Math.random() * 200;
        const sleepTime = Math.min(maxDelayMs, delay * Math.pow(backoffFactor, attempt - 1) + jitter);

        console.log(
          `[RetryStrategy] Waiting ${Math.round(sleepTime)}ms before attempt ${attempt + 1}/${maxRetries}...`
        );

        await this._sleep(sleepTime);
      }
    }
  }

  /**
   * Determine whether an error is transient and retryable
   * @param {Error} error 
   */
  _isRetryableError(error) {
    if (!error) return false;

    const status = error.status || error.statusCode || (error.response && error.response.status);
    const message = (error.message || "").toLowerCase();

    // 429 Too Many Requests / Rate Limit
    if (status === 429 || message.includes("rate limit") || message.includes("resource_exhausted")) {
      return true;
    }

    // 500, 502, 503, 504 Server Errors
    if ([500, 502, 503, 504].includes(status)) {
      return true;
    }

    // Network Timeouts & Connection Drops
    if (
      message.includes("timeout") ||
      message.includes("econnreset") ||
      message.includes("etimedout") ||
      message.includes("socket hang up")
    ) {
      return true;
    }

    return false;
  }

  /**
   * Helper sleep function
   * @param {number} ms 
   */
  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default new RetryStrategy();
