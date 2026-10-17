/**
 * Centralized AI Execution Logger
 * Tracks prompts, execution latency, token consumption, retries, and errors.
 */
class AILogger {
  constructor() {
    this.logs = [];
  }

  /**
   * Log a successful AI execution entry
   * @param {Object} entry 
   */
  logSuccess({ moduleName, promptName, version, latencyMs, tokenUsage, model = "gemini-1.5-pro" }) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      status: "SUCCESS",
      moduleName,
      promptName,
      version,
      latencyMs,
      tokenUsage: tokenUsage || { promptTokens: 0, responseTokens: 0, totalTokens: 0 },
      model,
    };

    console.log(
      `[AI Logger SUCCESS] [${logEntry.moduleName}:${logEntry.promptName} v${logEntry.version}] ` +
      `Latency: ${logEntry.latencyMs}ms | Tokens: ${logEntry.tokenUsage.totalTokens}`
    );

    this._persistLog(logEntry);
    return logEntry;
  }

  /**
   * Log a failed or retried AI execution entry
   * @param {Object} entry 
   */
  logFailure({ moduleName, promptName, version, latencyMs, error, attempt = 1, willRetry = false }) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      status: willRetry ? "RETRYING" : "FAILED",
      moduleName,
      promptName,
      version,
      latencyMs,
      attempt,
      error: error?.message || String(error),
      statusCode: error?.status || error?.statusCode || 500,
    };

    console.error(
      `[AI Logger ${logEntry.status}] [${logEntry.moduleName}:${logEntry.promptName}] ` +
      `Attempt ${attempt} | Error: ${logEntry.error} (${logEntry.latencyMs}ms)`
    );

    this._persistLog(logEntry);
    return logEntry;
  }

  /**
   * Internal log persistence (In-memory buffer with hooks for External APMs like Datadog/Elastic)
   * @param {Object} logEntry 
   */
  _persistLog(logEntry) {
    this.logs.push(logEntry);
    // Maintain maximum buffer of 1000 recent logs in memory
    if (this.logs.length > 1000) {
      this.logs.shift();
    }
  }

  /**
   * Retrieve execution metrics summary
   */
  getMetricsSummary() {
    const total = this.logs.length;
    const successes = this.logs.filter((l) => l.status === "SUCCESS").length;
    const failures = this.logs.filter((l) => l.status === "FAILED").length;
    const avgLatency =
      total > 0
        ? Math.round(this.logs.reduce((acc, l) => acc + (l.latencyMs || 0), 0) / total)
        : 0;

    return {
      totalExecutions: total,
      successes,
      failures,
      successRatePercentage: total > 0 ? ((successes / total) * 100).toFixed(2) : 100,
      averageLatencyMs: avgLatency,
    };
  }
}

export default new AILogger();
