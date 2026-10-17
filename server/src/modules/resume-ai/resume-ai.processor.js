/**
 * @file resume-ai.processor.js
 * @description Core processor for resume analysis jobs. Owns the AI prompt rendering,
 * Gemini call, persistence of the analysis report, and candidate notification.
 */
import resumeAiRepository from "./resume-ai.repository.js";
import { RESUME_AI_EVENTS } from "./resume-ai.events.js";
import notificationEventHandler from "../notification/notification.events.js";
import geminiService from "../../ai/gemini.service.js";
import promptManager from "../../ai/prompt.manager.js";
import aiLogger from "../../ai/ai.logger.js";
import pdfExtractor from "../../ai/pdf.extractor.js";

const REQUIRED_ANALYSIS_KEYS = [
  "overallAtsScore",
  "grammarScore",
  "formattingScore",
  "keywordScore",
  "jobReadinessScore",
  "professionalSummary",
  "strengths",
  "weaknesses",
  "missingSkills",
  "recommendedSkills",
  "skills",
];

/**
 * Main resume analysis pipeline
 * @param {Object} job - { data: { resumeId, userId } }
 */
export async function processResumeAnalysis(job) {
  const { resumeId, userId } = job?.data || {};
  if (!resumeId) {
    throw new Error("Resume analysis job missing required 'resumeId' in payload.");
  }

  const startedAt = Date.now();

  const resume = await resumeAiRepository.findResumeById(resumeId);
  if (!resume) {
    throw new Error(`Resume '${resumeId}' not found for analysis.`);
  }

  // Only extracted plain text may reach Gemini. Reject empty or binary content
  // so raw PDF bytes are never forwarded to the AI service.
  const resumeText = resume.parsedText?.trim() || "";
  if (!resumeText) {
    throw new Error(
      `Resume '${resumeId}' has no extractable text. Upload a text-based PDF resume and try again.`
    );
  }
  if (!pdfExtractor.isReadableText(resumeText)) {
    throw new Error(
      `Resume '${resumeId}' contains unreadable binary content. Re-upload a text-based PDF resume.`
    );
  }

  await resumeAiRepository.updateAnalysisStatus(resumeId, "PROCESSING", {
    analysisStartedAt: new Date(),
  });

  try {
    const renderedPrompt = promptManager.renderPrompt("RESUME_ANALYSIS", {
      resumeTitle: resume.title,
      resumeText,
    });

    const aiResult = await geminiService.generateStructuredJSON({
      prompt: renderedPrompt.userPrompt,
      systemPrompt: renderedPrompt.systemPrompt,
      moduleName: "RESUME_ANALYSIS",
      promptName: renderedPrompt.name,
      temperature: 0.2,
      requiredKeys: REQUIRED_ANALYSIS_KEYS,
    });

    const report = aiResult.data;

    await resumeAiRepository.saveAnalysisReport(resumeId, report, resumeText);

    aiLogger.logSuccess({
      moduleName: "RESUME_AI",
      promptName: "RESUME_ANALYSIS",
      version: "1.0.0",
      latencyMs: Date.now() - startedAt,
      tokenUsage: aiResult.usage,
    });

    await notifyCandidate(userId, resumeId, resume.title, report.overallAtsScore);

    return report;
  } catch (error) {
    await resumeAiRepository.updateAnalysisStatus(resumeId, "FAILED").catch(() => {});

    aiLogger.logFailure({
      moduleName: "RESUME_AI",
      promptName: "RESUME_ANALYSIS",
      version: "1.0.0",
      latencyMs: Date.now() - startedAt,
      error,
    });

    const { emitToUser } = await import("../notification/notification.socket.js");
    emitToUser(userId, RESUME_AI_EVENTS.ANALYSIS_FAILED, { resumeId });

    throw error;
  }
}

/**
 * Persist a notification and emit a socket event so the candidate is informed
 * the moment their resume analysis completes.
 */
async function notifyCandidate(userId, resumeId, resumeTitle, aiScore) {
  if (!userId) return;

  try {
    await notificationEventHandler.handleResumeAnalyzed({
      userId,
      resumeId,
      resumeTitle,
      aiScore: aiScore ?? 0,
    });

    const { emitToUser } = await import("../notification/notification.socket.js");
    emitToUser(userId, RESUME_AI_EVENTS.ANALYSIS_COMPLETED, { resumeId, aiScore });
  } catch (err) {
    console.error("[Resume AI] Failed to notify candidate:", err.message);
  }
}
