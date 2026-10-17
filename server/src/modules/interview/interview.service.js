import { candidateInterviewView } from "../../utils/candidate-view.js";
import { ApplicationStatus, InterviewStatus } from "@prisma/client";
import ApiError from "../../utils/ApiError.js";
import interviewRepository from "./interview.repository.js";
import notificationEventHandler from "../notification/notification.events.js";

class InterviewService {
  /**
   * Schedule a new interview for a shortlisted application (Recruiter only)
   * 
   * Workflow:
   * 1. Resolve Recruiter Profile from User ID
   * 2. Verify Application exists and belongs to a job owned by recruiter
   * 3. Verify Application status is SHORTLISTED
   * 4. Check if an interview has already been scheduled for this application
   * 5. Verify scheduledAt is in the future
   * 6. Execute atomic $transaction (Create Interview + Update Application status to INTERVIEW_SCHEDULED)
   * 7. Publish domain event hook for notification dispatch
   * 
   * @param {string} userId - Authenticated recruiter User ID
   * @param {Object} payload 
   */
  async scheduleInterview(userId, payload) {
    const recruiter =
      await interviewRepository.findRecruiterProfileByUserId(userId);

    if (!recruiter) {
      throw new ApiError(404, "Recruiter profile not found.");
    }

    const application =
      await interviewRepository.findApplicationForScheduling(
        payload.applicationId
      );

    if (!application || application.job.recruiterId !== recruiter.id) {
      throw new ApiError(
        404,
        "Application not found or you are not authorized to schedule an interview."
      );
    }

    // Prerequisite check: Application must be in SHORTLISTED state
    if (application.status !== ApplicationStatus.SHORTLISTED) {
      throw new ApiError(
        400,
        "An interview can only be scheduled for applications that are in SHORTLISTED status."
      );
    }

    // Duplicate interview check
    const existingInterview =
      await interviewRepository.findInterviewByApplicationId(
        payload.applicationId
      );

    if (existingInterview) {
      throw new ApiError(
        409,
        "An interview has already been scheduled for this application."
      );
    }

    const scheduledDate = new Date(payload.scheduledAt);
    if (scheduledDate <= new Date()) {
      throw new ApiError(
        400,
        "Scheduled interview date must be in the future."
      );
    }

    const interviewData = {
      applicationId: payload.applicationId,
      interviewType: payload.interviewType,
      scheduledAt: scheduledDate,
      durationMinutes: payload.durationMinutes,
      timezone: payload.timezone,
      meetingLink: payload.meetingLink || null,
      notes: payload.notes || null,
      status: InterviewStatus.SCHEDULED,
    };

    // Execute atomic transaction (Create Interview + Update Application Status)
    const interview = await interviewRepository.createScheduleTransaction(
      interviewData,
      payload.applicationId
    );

    // Domain Event Hook: Event subscriber can send Email/Socket notifications
    this._publishDomainEvent("InterviewScheduled", interview, userId);

    return interview;
  }

  /**
   * List interviews (Role-aware: Recruiters view job interviews; Candidates view their interviews)
   * 
   * @param {string} userId - Authenticated User ID
   * @param {string} userRole - CANDIDATE | RECRUITER
   * @param {Object} query - { page, limit, status, interviewType }
   */
  async getInterviews(userId, userRole, query = {}) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

    let result;

    if (userRole === "RECRUITER") {
      const recruiter =
        await interviewRepository.findRecruiterProfileByUserId(userId);

      if (!recruiter) {
        throw new ApiError(404, "Recruiter profile not found.");
      }

      result = await interviewRepository.findRecruiterInterviews(
        recruiter.id,
        {
          page,
          limit,
          status: query.status,
          interviewType: query.interviewType,
        }
      );
    } else if (userRole === "CANDIDATE") {
      const candidate =
        await interviewRepository.findCandidateProfileByUserId(userId);

      if (!candidate) {
        throw new ApiError(404, "Candidate profile not found.");
      }

      result = await interviewRepository.findCandidateInterviews(
        candidate.id,
        {
          page,
          limit,
          status: query.status,
          interviewType: query.interviewType,
        }
      );
    } else {
      throw new ApiError(403, "Access denied.");
    }

    const { interviews, totalInterviews } = result;
    const totalPages = Math.max(1, Math.ceil(totalInterviews / limit));

    return {
      interviews: userRole === "CANDIDATE" ? interviews.map(candidateInterviewView) : interviews,
      pagination: {
        page,
        limit,
        totalInterviews,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Fetch single interview by ID with strict ownership authorization
   * 
   * @param {string} userId - Authenticated User ID
   * @param {string} userRole - CANDIDATE | RECRUITER
   * @param {string} interviewId - Interview ID
   */
  async getInterviewById(userId, userRole, interviewId) {
    const interview = await interviewRepository.findInterviewById(interviewId);

    if (!interview) {
      throw new ApiError(404, "Interview not found.");
    }

    // Ownership Checks
    const isCandidateOwner =
      userRole === "CANDIDATE" &&
      interview.application.candidate.user.id === userId;

    const isRecruiterOwner =
      userRole === "RECRUITER" &&
      interview.application.job.recruiterId ===
        (await interviewRepository.findRecruiterProfileByUserId(userId))?.id;

    if (!isCandidateOwner && !isRecruiterOwner) {
      throw new ApiError(404, "Interview not found.");
    }

    return isCandidateOwner ? candidateInterviewView(interview) : interview;
  }

  /**
   * Update interview details & support proper rescheduling (Recruiter only)
   * 
   * @param {string} userId - Authenticated recruiter User ID
   * @param {string} interviewId - Target Interview ID
   * @param {Object} payload - { scheduledAt, durationMinutes, timezone, meetingLink, notes, interviewType }
   */
  async updateInterview(userId, interviewId, payload) {
    const recruiter =
      await interviewRepository.findRecruiterProfileByUserId(userId);

    if (!recruiter) {
      throw new ApiError(404, "Recruiter profile not found.");
    }

    const interview = await interviewRepository.findInterviewById(interviewId);

    if (!interview || interview.application.job.recruiterId !== recruiter.id) {
      throw new ApiError(
        404,
        "Interview not found or you are not authorized to update it."
      );
    }

    if (
      interview.status === InterviewStatus.COMPLETED ||
      interview.status === InterviewStatus.CANCELLED
    ) {
      throw new ApiError(
        400,
        `Cannot modify an interview that is already ${interview.status}.`
      );
    }

    const updateData = {};

    if (payload.interviewType) updateData.interviewType = payload.interviewType;
    if (payload.durationMinutes) updateData.durationMinutes = payload.durationMinutes;
    if (payload.timezone) updateData.timezone = payload.timezone;
    if (payload.meetingLink !== undefined) updateData.meetingLink = payload.meetingLink || null;
    if (payload.notes !== undefined) updateData.notes = payload.notes || null;

    // Rescheduling Logic: If scheduledAt changes, update date & set status to RESCHEDULED
    if (payload.scheduledAt) {
      const newScheduledDate = new Date(payload.scheduledAt);
      if (newScheduledDate <= new Date()) {
        throw new ApiError(
          400,
          "Rescheduled interview date must be in the future."
        );
      }

      if (newScheduledDate.getTime() !== new Date(interview.scheduledAt).getTime()) {
        updateData.scheduledAt = newScheduledDate;
        updateData.status = InterviewStatus.RESCHEDULED;
      }
    }

    const updatedInterview = await interviewRepository.update(
      interviewId,
      updateData
    );

    if (updateData.status === InterviewStatus.RESCHEDULED) {
      this._publishDomainEvent("InterviewRescheduled", updatedInterview, userId);
    }

    return updatedInterview;
  }

  /**
   * Update interview status (Recruiter only)
   * Enforces status transition rules, audit fields, and cancellation reasons.
   * 
   * @param {string} userId - Authenticated recruiter User ID
   * @param {string} interviewId - Target Interview ID
   * @param {Object} payload - { status, cancelReason, feedback, score }
   */
  async updateInterviewStatus(userId, interviewId, payload) {
    const recruiter =
      await interviewRepository.findRecruiterProfileByUserId(userId);

    if (!recruiter) {
      throw new ApiError(404, "Recruiter profile not found.");
    }

    const interview = await interviewRepository.findInterviewById(interviewId);

    if (!interview || interview.application.job.recruiterId !== recruiter.id) {
      throw new ApiError(
        404,
        "Interview not found or you are not authorized to update its status."
      );
    }

    if (interview.status === payload.status) {
      throw new ApiError(
        400,
        `Interview status is already set to ${payload.status}.`
      );
    }

    const validTransitions = {
      SCHEDULED: [
        InterviewStatus.COMPLETED,
        InterviewStatus.CANCELLED,
        InterviewStatus.NO_SHOW,
        InterviewStatus.RESCHEDULED,
      ],
      RESCHEDULED: [
        InterviewStatus.COMPLETED,
        InterviewStatus.CANCELLED,
        InterviewStatus.NO_SHOW,
      ],
      COMPLETED: [], // Terminal state
      CANCELLED: [], // Terminal state
      NO_SHOW: [],   // Terminal state
    };

    const allowedNextStates = validTransitions[interview.status] || [];

    if (!allowedNextStates.includes(payload.status)) {
      throw new ApiError(
        400,
        `Cannot change interview status from ${interview.status} to ${payload.status}.`
      );
    }

    const updateData = {
      status: payload.status,
    };

    // Audit fields & AI evaluation optional fields
    if (payload.status === InterviewStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }

    if (payload.status === InterviewStatus.CANCELLED) {
      updateData.cancelledAt = new Date();
      if (payload.cancelReason) {
        updateData.cancelReason = payload.cancelReason;
      }
    }

    if (payload.feedback) updateData.feedback = payload.feedback;
    if (payload.score !== undefined) updateData.score = payload.score;

    const updatedInterview = await interviewRepository.update(
      interviewId,
      updateData
    );

    this._publishDomainEvent(`InterviewStatus_${payload.status}`, updatedInterview, userId);

    return updatedInterview;
  }

  /**
   * Cancel an interview (Recruiter only)
   * 
   * @param {string} userId - Authenticated recruiter User ID
   * @param {string} interviewId - Target Interview ID
   * @param {string} cancelReason - Optional reason for cancellation
   */
  async cancelInterview(userId, interviewId, cancelReason) {
    return this.updateInterviewStatus(userId, interviewId, {
      status: InterviewStatus.CANCELLED,
      cancelReason,
    });
  }

  /**
   * Domain Event Publisher Hook for Notification System
   * Dispatches real-time notifications to the affected candidate/recruiter asynchronously.
   * Notification failures are non-blocking and must never fail the core request.
   * @param {string} eventName 
   * @param {Object} data - Interview record (with application relations)
   * @param {string} recruiterUserId - Acting recruiter's user ID
   */
  _publishDomainEvent(eventName, data, recruiterUserId) {
    const candidateUserId = data.application?.candidate?.user?.id;
    const jobTitle = data.application?.job?.title;

    const dispatch = async () => {
      try {
        switch (eventName) {
          case "InterviewScheduled":
            await notificationEventHandler.handleInterviewScheduled({
              candidateUserId,
              recruiterUserId,
              jobTitle,
              scheduledAt: data.scheduledAt,
              interviewId: data.id,
            });
            break;
          case "InterviewRescheduled":
            await notificationEventHandler.handleInterviewRescheduled({
              candidateUserId,
              recruiterUserId,
              jobTitle,
              newScheduledAt: data.scheduledAt,
              interviewId: data.id,
            });
            break;
          case "InterviewStatus_COMPLETED":
            await notificationEventHandler.handleInterviewCompleted({
              candidateUserId,
              jobTitle,
              interviewId: data.id,
            });
            break;
          case "InterviewStatus_CANCELLED":
            await notificationEventHandler.handleInterviewCancelled({
              candidateUserId,
              jobTitle,
              cancelReason: data.cancelReason,
              interviewId: data.id,
            });
            break;
          default:
            break;
        }
      } catch (error) {
        console.error(`[Interview] Failed to dispatch notification for '${eventName}':`, error.message);
      }
    };

    dispatch();
  }
}

export default new InterviewService();
