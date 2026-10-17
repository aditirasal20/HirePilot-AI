/**
 * @file job-matching.worker.js
 * @description Worker pipeline for AI Job Matching jobs. Owns the prompt rendering,
 * Gemini call, JobMatch record persistence, and candidate notification.
 */

import jobMatchingRepository from "./job-matching.repository.js";
import promptManager from "../../ai/prompt.manager.js";
import geminiService from "../../ai/gemini.service.js";
import aiLogger from "../../ai/ai.logger.js";
import { emitToUser } from "../notification/notification.socket.js";
import notificationEventHandler from "../notification/notification.events.js";
import { JOB_MATCHING_EVENTS } from "./job-matching.events.js";

const REQUIRED_REPORT_KEYS = [
  "overallScore",
  "matchedSkills",
  "missingSkills",
  "strengths",
  "weaknesses",
  "summary",
  "recommendation",
];

export async function processJobMatching(job) {
  const { matchId, resumeId, jobId, userId } = job?.data || {};

  if (!matchId || !resumeId || !jobId) {
    throw new Error("Job matching job missing required payload fields (matchId, resumeId, jobId).");
  }

  const startedAt = Date.now();

  await jobMatchingRepository.updateJobMatch(matchId, {
    analysisStatus: "PROCESSING",
    analysisStartedAt: new Date(),
  });

  emitToUser(userId, JOB_MATCHING_EVENTS.MATCH_STARTED, { matchId });

  try {
    const [resume, jobDetails] = await Promise.all([
      jobMatchingRepository.findResumeById(resumeId),
      jobMatchingRepository.findJobById(jobId),
    ]);

    if (!resume || !jobDetails) {
      throw new Error("Resume or Job not found.");
    }

    const toCsv = (value) => (Array.isArray(value) ? value.join(", ") : value || "Not provided");

    const renderedPrompt = promptManager.renderPrompt("JOB_MATCHING_V2", {
      currentDate: new Date().toISOString().slice(0, 10),
      resumeSummary: resume.summary || "No summary available.",
      resumeSkills: toCsv(resume.extractedSkills),
      resumeStrengths: toCsv(resume.strengths),
      resumeWeaknesses: toCsv(resume.weaknesses),
      jobTitle: jobDetails.title,
      jobDescription: jobDetails.description || "No description provided.",
      requiredSkills: toCsv(jobDetails.requiredSkills),
    });

    const aiResult = await geminiService.generateStructuredJSON({
      prompt: renderedPrompt.userPrompt,
      systemPrompt: renderedPrompt.systemPrompt,
      moduleName: "JOB_MATCHING",
      promptName: renderedPrompt.name,
      temperature: 0.2,
      requiredKeys: REQUIRED_REPORT_KEYS,
    });

    const report = aiResult.data;

    await jobMatchingRepository.updateJobMatch(matchId, {
      analysisStatus: "COMPLETED",
      analysisCompletedAt: new Date(),
      overallScore: report.overallScore,
      matchedSkills: report.matchedSkills,
      missingSkills: report.missingSkills,
      strengths: report.strengths,
      weaknesses: report.weaknesses,
      summary: report.summary,
      recommendation: report.recommendation,
    });

    aiLogger.logSuccess({
      moduleName: "JOB_MATCHING",
      promptName: "JOB_MATCHING_V2",
      version: promptManager.getPrompt("JOB_MATCHING_V2").version,
      latencyMs: Date.now() - startedAt,
    });

    emitToUser(userId, JOB_MATCHING_EVENTS.MATCH_COMPLETED, { matchId });

    if (userId) {
      try {
        await notificationEventHandler.handleAIJobMatchReady({
          userId,
          jobId,
          jobTitle: jobDetails.title,
          matchPercentage: report.overallScore,
        });
      } catch (notifError) {
        console.error("[Job Matching] Failed to dispatch match notification:", notifError.message);
      }
    }

    return { success: true, matchId };
  } catch (error) {
    aiLogger.logFailure({
      moduleName: "JOB_MATCHING",
      promptName: "JOB_MATCHING_V2",
      version: promptManager.getPrompt("JOB_MATCHING_V2").version,
      latencyMs: Date.now() - startedAt,
      error,
    });

    await jobMatchingRepository.updateJobMatch(matchId, {
      analysisStatus: "FAILED",
      analysisCompletedAt: new Date(),
    }).catch(() => {});

    emitToUser(userId, JOB_MATCHING_EVENTS.MATCH_FAILED, {
      matchId,
      error: error.message,
    });

    throw error;
  }
}
