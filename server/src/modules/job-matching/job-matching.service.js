/**
 * @file job-matching.service.js
 * @description Business logic for AI Job Matching workflows.
 */
import ApiError from "../../utils/ApiError.js";
import jobMatchingRepository from "./job-matching.repository.js";
import aiQueueManager from "../../ai/ai.queue.js";
import { emitToUser } from "../notification/notification.socket.js";
import { JOB_MATCHING_EVENTS } from "./job-matching.events.js";

const IN_PROGRESS_STATUSES = ["QUEUED", "PROCESSING"];

class JobMatchingService {
  async queueJobMatching(jobId, resumeId, userId, { refresh = false } = {}) {
    const candidate = await jobMatchingRepository.findCandidateProfileByUserId(userId);
    if (!candidate) {
      throw new ApiError(404, "Candidate profile not found.");
    }

    const resume = await jobMatchingRepository.findResumeById(resumeId);
    if (!resume) {
      throw new ApiError(404, "Resume not found.");
    }
    if (resume.candidateProfileId !== candidate.id) {
      throw new ApiError(403, "Unauthorized resume.");
    }
    if (resume.analysisStatus !== "COMPLETED") {
      throw new ApiError(400, "Resume AI analysis must be completed before job matching.");
    }

    const job = await jobMatchingRepository.findJobById(jobId);
    if (!job || job.status !== "OPEN") {
      throw new ApiError(404, "Job not found.");
    }

    const existing = await jobMatchingRepository.findExistingMatch(resumeId, jobId);
    if (existing) {
      if (IN_PROGRESS_STATUSES.includes(existing.analysisStatus)) {
        throw new ApiError(409, "Job matching is already in progress.");
      }
      if (existing.analysisStatus === "COMPLETED" && !refresh) {
        return { matchId: existing.id, status: "COMPLETED", cached: true };
      }
      return this._enqueue(existing.id, { resumeId, jobId, candidateId: candidate.id, userId });
    }

    let match;
    try {
      match = await jobMatchingRepository.createJobMatch({
        candidateId: candidate.id,
        resumeId,
        jobId,
        analysisStatus: "QUEUED",
      });
    } catch (error) {
      // Concurrent duplicate match creation is expected under the resumeId_jobId unique constraint
      if (error?.code === "P2002") {
        const concurrentMatch = await jobMatchingRepository.findExistingMatch(resumeId, jobId);
        if (concurrentMatch) {
          if (IN_PROGRESS_STATUSES.includes(concurrentMatch.analysisStatus)) {
            throw new ApiError(409, "Job matching is already in progress.");
          }
          if (concurrentMatch.analysisStatus === "COMPLETED" && !refresh) {
            return { matchId: concurrentMatch.id, status: "COMPLETED", cached: true };
          }
          return this._enqueue(concurrentMatch.id, { resumeId, jobId, candidateId: candidate.id, userId });
        }
      }
      throw error;
    }

    return this._enqueue(match.id, { resumeId, jobId, candidateId: candidate.id, userId });
  }

  async _enqueue(matchId, payload) {
    await jobMatchingRepository.updateJobMatch(matchId, {
      analysisStatus: "QUEUED",
    });

    await aiQueueManager.addAIJob(
      "job-matching",
      "match-job",
      {
        matchId,
        resumeId: payload.resumeId,
        jobId: payload.jobId,
        candidateId: payload.candidateId,
        userId: payload.userId,
      },
      {
        jobId: `job-matching:${matchId}`,
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
      }
    );

    emitToUser(payload.userId, JOB_MATCHING_EVENTS.MATCH_QUEUED, { matchId });

    return { matchId, status: "QUEUED", cached: false };
  }

  async getJobMatchReport(jobId, resumeId, userId) {
    const candidate = await jobMatchingRepository.findCandidateProfileByUserId(userId);
    if (!candidate) {
      throw new ApiError(404, "Candidate profile not found.");
    }

    const report = await jobMatchingRepository.findJobMatchByResumeAndJob(resumeId, jobId);
    if (!report || report.candidateId !== candidate.id) {
      throw new ApiError(404, "Job match not found.");
    }

    return report;
  }

  async getMyMatches(userId) {
    const candidate = await jobMatchingRepository.findCandidateProfileByUserId(userId);
    if (!candidate) {
      throw new ApiError(404, "Candidate profile not found.");
    }

    return jobMatchingRepository.findCandidateMatches(candidate.id);
  }

  async deleteJobMatch(matchId, userId) {
    const candidate = await jobMatchingRepository.findCandidateProfileByUserId(userId);
    if (!candidate) {
      throw new ApiError(404, "Candidate profile not found.");
    }

    const match = await jobMatchingRepository.findJobMatchById(matchId);
    if (!match || match.candidateId !== candidate.id) {
      throw new ApiError(404, "Job match not found.");
    }

    await jobMatchingRepository.deleteJobMatch(matchId);

    return { message: "Job match deleted successfully." };
  }
}

export default new JobMatchingService();
