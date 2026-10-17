import { candidateApplicationView } from "../../utils/candidate-view.js";
import { ApplicationStatus } from "@prisma/client";
import ApiError from "../../utils/ApiError.js";
import applicationRepository from "./application.repository.js";
import notificationEventHandler from "../notification/notification.events.js";

class ApplicationService {
  /**
   * Apply for a job as an authenticated candidate
   * 
   * Workflow:
   * 1. Resolve Candidate Profile from User ID
   * 2. Perform parallel independent lookups (Job, Resume, Existing Application)
   * 3. Validate Job existence and OPEN status
   * 4. Validate Resume existence and ownership
   * 5. Enforce unique application rule (Prevent duplicate applications)
   * 6. Persist application with default APPLIED status
   * 
   * @param {string} userId - Authenticated user ID (from JWT)
   * @param {Object} payload - { jobId, resumeId }
   */
  async createApplication(userId, { jobId, resumeId }) {
    // 1. Verify candidate profile exists
    const candidateProfile =
      await applicationRepository.findCandidateProfileByUserId(userId);

    if (!candidateProfile) {
      throw new ApiError(404, "Candidate profile not found.");
    }

    // 2. Concurrently execute independent database queries for performance
    const [job, resume, existingApplication] = await Promise.all([
      applicationRepository.findOpenJobById(jobId),
      applicationRepository.findResumeById(resumeId),
      applicationRepository.findExistingApplication(candidateProfile.id, jobId),
    ]);

    // 3. Verify Job exists and is OPEN for applications
    if (!job) {
      throw new ApiError(404, "Job not found or is not open for applications.");
    }

    // 4. Verify Resume exists
    if (!resume) {
      throw new ApiError(404, "Resume not found.");
    }

    // 5. Verify Resume ownership (Must belong to requesting candidate)
    if (resume.candidateProfileId !== candidateProfile.id) {
      throw new ApiError(
        403,
        "Resume does not belong to your profile."
      );
    }

    // 6. Prevent duplicate job applications
    if (existingApplication) {
      throw new ApiError(
        409,
        "You have already applied for this job."
      );
    }

    // 7. Create and return the application record
    const application = await applicationRepository.create({
      candidateId: candidateProfile.id,
      jobId,
      resumeId,
      status: ApplicationStatus.APPLIED,
    });

    // 8. Notify candidate and recruiter asynchronously (non-blocking; must not fail the request)
    this._dispatchApplicationSubmittedNotification(userId, jobId, application);

    return application;
  }

  async _dispatchApplicationSubmittedNotification(candidateUserId, jobId, application) {
    try {
      const job = await applicationRepository.findJobForNotification(jobId);
      if (!job) return;

      const jobTitle = job.title;
      const companyName = job.company?.name || "the company";
      const recruiterUserId = job.recruiter?.userId;

      await notificationEventHandler.handleApplicationSubmitted({
        candidateUserId,
        recruiterUserId,
        jobId,
        jobTitle,
        companyName,
      });
    } catch (error) {
      console.error("[Application] Failed to dispatch submitted notification:", error.message);
    }
  }

  /**
   * Get all applications submitted by the authenticated candidate
   * 
   * @param {string} userId - Authenticated user ID
   * @param {Object} query - { page, limit, status }
   */
  async getMyApplications(userId, query = {}) {
    const candidateProfile =
      await applicationRepository.findCandidateProfileByUserId(userId);

    if (!candidateProfile) {
      throw new ApiError(404, "Candidate profile not found.");
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

    const { applications, totalApplications } =
      await applicationRepository.findCandidateApplications(
        candidateProfile.id,
        {
          page,
          limit,
          status: query.status,
        }
      );

    const totalPages = Math.max(1, Math.ceil(totalApplications / limit));

    return {
      applications,
      pagination: {
        page,
        limit,
        totalApplications,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Get all applications submitted for a job owned by the authenticated recruiter
   * 
   * Workflow:
   * 1. Resolve Recruiter Profile from User ID
   * 2. Verify Job exists and is owned by the recruiter
   * 3. Fetch paginated applications matching optional status filters
   * 
   * @param {string} userId - Authenticated recruiter User ID
   * @param {string} jobId - Target Job ID
   * @param {Object} query - { page, limit, status }
   */
  async getJobApplications(userId, jobId, query = {}) {
    const recruiter =
      await applicationRepository.findRecruiterProfileByUserId(userId);

    if (!recruiter) {
      throw new ApiError(404, "Recruiter profile not found.");
    }

    const job = await applicationRepository.findJobByIdAndRecruiter(
      jobId,
      recruiter.id
    );

    if (!job) {
      throw new ApiError(
        404,
        "Job not found or you are not authorized to view its applications."
      );
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

    const { applications, totalApplications, stageCounts } =
      await applicationRepository.findJobApplications(jobId, {
        page,
        limit,
        status: query.status,
        search: query.search,
        minScore: query.minScore,
        sort: query.sort,
      });

    const totalPages = Math.max(1, Math.ceil(totalApplications / limit));

    return {
      job: {
        id: job.id,
        title: job.title,
        status: job.status,
      },
      applications,
      stageCounts,
      pagination: {
        page,
        limit,
        totalApplications,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Update the status of an application (Recruiter only)
   * Enforces status transition state machine logic.
   * 
   * @param {string} userId - Authenticated recruiter User ID
   * @param {string} applicationId - Application ID
   * @param {string} newStatus - Target ApplicationStatus enum
   */
  async updateApplicationStatus(userId, applicationId, newStatus) {
    const recruiter =
      await applicationRepository.findRecruiterProfileByUserId(userId);

    if (!recruiter) {
      throw new ApiError(404, "Recruiter profile not found.");
    }

    const application =
      await applicationRepository.findApplicationByIdWithJobAndRecruiter(
        applicationId
      );

    if (!application || application.job.recruiterId !== recruiter.id) {
      throw new ApiError(
        404,
        "Application not found or you are not authorized to modify its status."
      );
    }

    if (application.status === newStatus) {
      throw new ApiError(
        400,
        `Application status is already set to ${newStatus}.`
      );
    }

    const validTransitions = {
      APPLIED: [ApplicationStatus.REVIEWING, ApplicationStatus.SHORTLISTED, ApplicationStatus.REJECTED],
      REVIEWING: [
        ApplicationStatus.SHORTLISTED,
        ApplicationStatus.REJECTED,
      ],
      SHORTLISTED: [
        ApplicationStatus.INTERVIEW_SCHEDULED,
        ApplicationStatus.REJECTED,
      ],
      INTERVIEW_SCHEDULED: [
        ApplicationStatus.HIRED,
        ApplicationStatus.REJECTED,
      ],
      REJECTED: [], // Terminal state
      HIRED: [],    // Terminal state
    };

    const allowedNextStates = validTransitions[application.status] || [];

    if (!allowedNextStates.includes(newStatus)) {
      throw new ApiError(
        400,
        `Cannot change application status from ${application.status} to ${newStatus}.`
      );
    }

    const updatedApplication = await applicationRepository.updateStatus(applicationId, newStatus);

    this._dispatchStatusNotification(applicationId, newStatus);

    return updatedApplication;
  }

  async _dispatchStatusNotification(applicationId, newStatus) {
    try {
      const app = await applicationRepository.findApplicationForStatusNotification(applicationId);
      if (!app) return;

      const base = {
        candidateUserId: app.candidate?.userId,
        applicationId: app.id,
        jobTitle: app.job?.title,
        companyName: app.job?.company?.name,
      };

      if (newStatus === ApplicationStatus.SHORTLISTED) {
        await notificationEventHandler.handleApplicationShortlisted(base);
      } else if (newStatus === ApplicationStatus.REJECTED) {
        await notificationEventHandler.handleApplicationRejected(base);
      } else if (newStatus === ApplicationStatus.HIRED) {
        await notificationEventHandler.handleApplicationHired(base);
      }
    } catch (error) {
      console.error("[Application] Failed to dispatch status notification:", error.message);
    }
  }

  /**
   * Fetch a single application by ID with strict ownership authorization
   * (Accessible by submitting Candidate OR owning Recruiter)
   * 
   * @param {string} userId - Authenticated User ID
   * @param {string} userRole - CANDIDATE | RECRUITER
   * @param {string} applicationId - Application ID
   */
  async getApplicationById(userId, userRole, applicationId) {
    const application =
      await applicationRepository.findApplicationByIdForDetail(applicationId);

    if (!application) {
      throw new ApiError(404, "Application not found.");
    }

    // Ownership Verification
    const isCandidateOwner =
      userRole === "CANDIDATE" && application.candidate.userId === userId;

    const isRecruiterOwner =
      userRole === "RECRUITER" &&
      application.job.recruiter?.userId === userId;

    if (!isCandidateOwner && !isRecruiterOwner) {
      throw new ApiError(404, "Application not found.");
    }

    return isCandidateOwner ? candidateApplicationView(application) : application;
  }

  /**
   * Update recruiter notes for an application (Recruiter only)
   * 
   * @param {string} userId - Authenticated recruiter User ID
   * @param {string} applicationId - Application ID
   * @param {string} notes - Recruiter notes text
   */
  async updateRecruiterNotes(userId, applicationId, notes) {
    const recruiter =
      await applicationRepository.findRecruiterProfileByUserId(userId);

    if (!recruiter) {
      throw new ApiError(404, "Recruiter profile not found.");
    }

    const application =
      await applicationRepository.findApplicationByIdWithJobAndRecruiter(
        applicationId
      );

    if (!application || application.job.recruiterId !== recruiter.id) {
      throw new ApiError(
        404,
        "Application not found or you are not authorized to update its notes."
      );
    }

    return applicationRepository.updateRecruiterNotes(
      applicationId,
      notes && notes.trim() ? notes.trim() : null
    );
  }
}

export default new ApplicationService();
