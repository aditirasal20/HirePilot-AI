/**
 * @file resume-ai.service.js
 * @description Business logic for Resume AI analysis workflows.
 */
import ApiError from "../../utils/ApiError.js";
import resumeAiRepository from "./resume-ai.repository.js";
import aiQueueManager from "../../ai/ai.queue.js";
import { RESUME_AI_EVENTS } from "./resume-ai.events.js";

class ResumeAiService {
  /**
   * Queue a resume analysis job for the authenticated candidate.
   * The status claim (QUEUED) is performed atomically so two concurrent
   * requests cannot enqueue the same resume twice.
   */
  async startAnalysis(resumeId, userId) {
    const resume = await resumeAiRepository.findResumeByIdAndUser(resumeId, userId);
    if (!resume) {
      throw new ApiError(404, "Resume not found for analysis.");
    }

    const claimed = await resumeAiRepository.claimForAnalysis(resumeId, userId);
    if (!claimed) {
      throw new ApiError(409, "Resume analysis is already in progress. Please wait for it to complete.");
    }

    const { emitToUser } = await import("../notification/notification.socket.js");
    emitToUser(userId, RESUME_AI_EVENTS.ANALYSIS_QUEUED, { resumeId });

    await aiQueueManager.addAIJob("resume-analysis", "analyze-resume", {
      resumeId,
      userId,
      resumeTitle: resume.title,
    }, { jobId: `resume-analysis:${resumeId}` });

    return { message: "Resume analysis has been queued successfully." };
  }

  async getAnalysis(resumeId, userId) {
    const report = await resumeAiRepository.getAnalysisReport(resumeId, userId);
    if (!report) {
      throw new ApiError(404, "Analysis report not found.");
    }
    return { ...report, analysisScore: report.aiScore };
  }
}

export default new ResumeAiService();
