/**
 * BullMQ-style AI Queue Producer Infrastructure
 * Central producer for async background queues: resume-analysis, job-matching, interview-generation, cover-letter, resume-rewrite.
 *
 * The queue is backed by an in-process dispatcher with exponential-backoff retries and
 * duplicate-job protection. It preserves the BullMQ producer/consumer contract
 * (queueName, jobName, payload, options) so it can be swapped for a real Redis-backed
 * BullMQ instance without touching module code.
 */

import aiLogger from "./ai.logger.js";

export const AI_QUEUE_NAMES = {
  RESUME_ANALYSIS: "resume-analysis",
  JOB_MATCHING: "job-matching",
  INTERVIEW_GENERATION: "interview-generation",
  COVER_LETTER: "cover-letter",
  RESUME_REWRITE: "resume-rewrite",
};

class AIQueueManager {
  constructor() {
    this.activeQueues = new Map();
    this.inFlightJobKeys = new Set();
    this.queueNames = Object.values(AI_QUEUE_NAMES);
    console.log(`[AI Queue Manager] Initialized queues:`, this.queueNames);
  }

  /**
   * Dispatch an asynchronous AI background job to target queue
   *
   * @param {string} queueName - One of AI_QUEUE_NAMES
   * @param {string} jobName - e.g. 'analyze-resume', 'match-job', 'generate-questions'
   * @param {Object} payload - Task payload
   * @param {Object} options - Job options (attempts, backoff, jobId, priority)
   */
  async addAIJob(queueName, jobName, payload, options = {}) {
    if (!this.queueNames.includes(queueName)) {
      throw new Error(`Invalid AI queue name: '${queueName}'. Available: ${this.queueNames.join(", ")}`);
    }

    if (!payload || typeof payload !== "object") {
      throw new Error(`AI job '${jobName}' requires a payload object.`);
    }

    // Idempotency: skip re-dispatching a logical job that is already queued/in-flight
    const dedupeKey = options.jobId || payload.jobId || payload.resumeId || payload.matchId;
    if (dedupeKey) {
      if (this.inFlightJobKeys.has(dedupeKey)) {
        console.log(`[AI Queue] Duplicate dispatch skipped for job key '${dedupeKey}'.`);
        return null;
      }
      this.inFlightJobKeys.add(dedupeKey);
    }

    const jobId = options.jobId || `ai_job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const defaultOptions = {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: true,
      ...options,
    };

    const jobRecord = {
      id: jobId,
      queueName,
      jobName,
      payload,
      options: defaultOptions,
      attemptsMade: 0,
      createdAt: new Date().toISOString(),
    };

    console.log(`[AI Queue Dispatched] Queue '${queueName}' -> Job '${jobName}' (${jobId})`);

    // Non-blocking worker pipeline execution with retry support
    setImmediate(() => this._executeJob(jobRecord).finally(() => {
      if (dedupeKey) this.inFlightJobKeys.delete(dedupeKey);
    }));

    return jobRecord;
  }

  /**
   * Execute a job with exponential backoff retries on failure
   * @param {Object} jobRecord
   */
  async _executeJob(jobRecord) {
    const { id, queueName, jobName, payload, options } = jobRecord;
    const maxAttempts = Math.max(1, options.attempts || 1);
    let attempt = 1;

    while (attempt <= maxAttempts) {
      jobRecord.attemptsMade = attempt;
      const startedAt = Date.now();
      try {
        const { processAIWorkerJob } = await import("./ai.worker.js");
        await processAIWorkerJob(jobRecord);
        return { id, success: true };
      } catch (err) {
        const willRetry = attempt < maxAttempts;
        aiLogger.logFailure({
          moduleName: "AI_QUEUE",
          promptName: `${queueName}:${jobName}`,
          version: "1.0.0",
          latencyMs: Date.now() - startedAt,
          error: err,
          attempt,
          willRetry,
        });

        if (!willRetry) {
          console.error(`[AI Queue Failed] ${id} exhausted ${maxAttempts} attempts.`);
          throw err;
        }

        const baseDelay = options.backoff?.delay || 2000;
        const jitter = Math.random() * 500;
        const sleepTime = Math.min(30000, baseDelay * Math.pow(2, attempt - 1) + jitter);
        console.log(`[AI Queue Retry] ${id} attempt ${attempt + 1}/${maxAttempts} in ${Math.round(sleepTime)}ms`);
        await new Promise((resolve) => setTimeout(resolve, sleepTime));
        attempt++;
      }
    }
  }
}

const aiQueueManager = new AIQueueManager();
export default aiQueueManager;
