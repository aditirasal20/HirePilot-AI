/**
 * @file resume-ai.repository.js
 */
import prisma from "../../lib/prisma.js";

class ResumeAiRepository {
  /**
   * Find a resume owned by the given candidate user.
   * Resume records belong to a candidate profile, so ownership is resolved through the user's candidate profile.
   * @param {string} resumeId
   * @param {string} userId
   */
  async findResumeByIdAndUser(resumeId, userId) {
    return prisma.resume.findFirst({
      where: {
        id: resumeId,
        candidateProfile: {
          userId,
        },
      },
      select: {
        id: true,
        title: true,
        fileUrl: true,
        parsedText: true,
        analysisStatus: true,
      },
    });
  }

  async findResumeById(resumeId) {
    return prisma.resume.findUnique({
      where: { id: resumeId },
      select: {
        id: true,
        title: true,
        fileUrl: true,
        parsedText: true,
        analysisStatus: true,
      },
    });
  }

  /**
   * Atomically claim a resume for analysis by flipping its status to QUEUED.
   * Returns the updated record, or null when the resume is missing, not owned by
   * the user, or already QUEUED/PROCESSING (in-progress).
   */
  async claimForAnalysis(resumeId, userId) {
    const result = await prisma.resume.updateMany({
      where: {
        id: resumeId,
        candidateProfile: { is: { userId } },
        analysisStatus: { notIn: ["QUEUED", "PROCESSING"] },
      },
      data: { analysisStatus: "QUEUED" },
    });

    if (result.count !== 1) {
      const resume = await this.findResumeByIdAndUser(resumeId, userId);
      return resume && (resume.analysisStatus === "QUEUED" || resume.analysisStatus === "PROCESSING")
        ? resume
        : null;
    }

    return prisma.resume.findUnique({ where: { id: resumeId } });
  }

  async updateAnalysisStatus(resumeId, status, additionalData = {}) {
    return prisma.resume.update({
      where: { id: resumeId },
      data: {
        analysisStatus: status,
        ...additionalData,
      },
    });
  }

  async saveAnalysisReport(resumeId, reportData, parsedText) {
    const clampScore = (value) => {
      const num = Number(value);
      if (!Number.isFinite(num)) return null;
      return Math.max(0, Math.min(100, Math.round(num * 10) / 10));
    };

    const toString = (value) =>
      typeof value === "string" && value.trim() ? value.trim() : null;

    const toStringArray = (value) =>
      Array.isArray(value)
        ? value.filter((item) => typeof item === "string" && item.trim())
        : [];

    return prisma.resume.update({
      where: { id: resumeId },
      data: {
        analysisStatus: "COMPLETED",
        analysisCompletedAt: new Date(),
        lastAnalyzedAt: new Date(),
        parsedText,
        aiScore: clampScore(reportData.overallAtsScore),
        summary: toString(reportData.professionalSummary),
        strengths: toStringArray(reportData.strengths),
        weaknesses: toStringArray(reportData.weaknesses),
        missingSkills: toStringArray(reportData.missingSkills),
        recommendedSkills: toStringArray(reportData.recommendedSkills),
        experienceLevel: toString(reportData.experienceSummary),
        atsCompatibility: clampScore(reportData.atsCompatibility),
        grammarScore: clampScore(reportData.grammarScore),
        formatScore: clampScore(reportData.formattingScore),
        keywordScore: clampScore(reportData.keywordScore),
        jobReadinessScore: clampScore(reportData.jobReadinessScore),
        careerLevel: toString(reportData.careerLevel),
        industryFit: toString(reportData.industryFit),
        extractedSkills: toStringArray(reportData.skills),
      },
    });
  }

  async getAnalysisReport(resumeId, userId) {
    return prisma.resume.findFirst({
      where: {
        id: resumeId,
        candidateProfile: {
          userId,
        },
      },
      select: {
        id: true,
        analysisStatus: true,
        analysisStartedAt: true,
        analysisCompletedAt: true,
        lastAnalyzedAt: true,
        aiScore: true,
        summary: true,
        strengths: true,
        weaknesses: true,
        missingSkills: true,
        recommendedSkills: true,
        experienceLevel: true,
        atsCompatibility: true,
        grammarScore: true,
        formatScore: true,
        keywordScore: true,
        jobReadinessScore: true,
        careerLevel: true,
        industryFit: true,
      },
    });
  }
}

export default new ResumeAiRepository();
