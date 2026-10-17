import { NotificationType } from "@prisma/client";
import notificationService from "./notification.service.js";

/**
 * Centralized Event Handlers for Notification Module
 * Listens to domain events across HirePilot AI modules and dispatches notifications.
 */
class NotificationEventHandler {
  /**
   * Event Handler: ApplicationSubmitted
   * Triggered when a candidate submits an application
   */
  async handleApplicationSubmitted(data) {
    const { candidateUserId, recruiterUserId, jobId, jobTitle, companyName } = data;

    // 1. Notify Candidate
    await notificationService.createNotification({
      userId: candidateUserId,
      title: "Application Submitted Successfully",
      message: `Your application for '${jobTitle}' at ${companyName} has been received.`,
      type: NotificationType.APPLICATION,
      entityId: jobId,
      entityType: "Job",
    });

    // 2. Notify Recruiter (if recruiterUserId provided)
    if (recruiterUserId) {
      await notificationService.createNotification({
        userId: recruiterUserId,
        title: "New Job Application Received",
        message: `A candidate has submitted an application for '${jobTitle}'.`,
        type: NotificationType.APPLICATION,
        entityId: jobId,
        entityType: "Job",
      });
    }
  }

  /**
   * Event Handler: ApplicationShortlisted
   */
  async handleApplicationShortlisted(data) {
    const { candidateUserId, jobTitle, companyName, applicationId } = data;

    await notificationService.createNotification({
      userId: candidateUserId,
      title: "Application Shortlisted!",
      message: `Congratulations! Your application for '${jobTitle}' at ${companyName} has been shortlisted.`,
      type: NotificationType.APPLICATION,
      entityId: applicationId,
      entityType: "Application",
    });
  }

  /**
   * Event Handler: ApplicationRejected
   */
  async handleApplicationRejected(data) {
    const { candidateUserId, jobTitle, companyName, applicationId } = data;

    await notificationService.createNotification({
      userId: candidateUserId,
      title: "Application Update",
      message: `Thank you for applying for '${jobTitle}' at ${companyName}. The status of your application has been updated.`,
      type: NotificationType.APPLICATION,
      entityId: applicationId,
      entityType: "Application",
    });
  }

  /**
   * Event Handler: InterviewScheduled
   */
  async handleInterviewScheduled(data) {
    const { candidateUserId, recruiterUserId, jobTitle, scheduledAt, interviewId } = data;

    const formattedDate = new Date(scheduledAt).toLocaleString();

    // Notify Candidate
    await notificationService.createNotification({
      userId: candidateUserId,
      title: "Interview Scheduled",
      message: `An interview for '${jobTitle}' has been scheduled for ${formattedDate}.`,
      type: NotificationType.INTERVIEW,
      entityId: interviewId,
      entityType: "Interview",
    });

    // Notify Recruiter
    if (recruiterUserId) {
      await notificationService.createNotification({
        userId: recruiterUserId,
        title: "Interview Confirmed",
        message: `Interview for '${jobTitle}' scheduled for ${formattedDate}.`,
        type: NotificationType.INTERVIEW,
        entityId: interviewId,
        entityType: "Interview",
      });
    }
  }

  /**
   * Event Handler: InterviewRescheduled
   */
  async handleInterviewRescheduled(data) {
    const { candidateUserId, recruiterUserId, jobTitle, newScheduledAt, interviewId } = data;

    const formattedDate = new Date(newScheduledAt).toLocaleString();

    await notificationService.createNotification({
      userId: candidateUserId,
      title: "Interview Rescheduled",
      message: `Your interview for '${jobTitle}' has been rescheduled to ${formattedDate}.`,
      type: NotificationType.INTERVIEW,
      entityId: interviewId,
      entityType: "Interview",
    });
  }

  /**
   * Event Handler: InterviewCancelled
   */
  async handleInterviewCancelled(data) {
    const { candidateUserId, jobTitle, cancelReason, interviewId } = data;

    await notificationService.createNotification({
      userId: candidateUserId,
      title: "Interview Cancelled",
      message: `Your interview for '${jobTitle}' has been cancelled.${cancelReason ? ` Reason: ${cancelReason}` : ""}`,
      type: NotificationType.INTERVIEW,
      entityId: interviewId,
      entityType: "Interview",
    });
  }

  /**
   * Event Handler: InterviewCompleted
   */
  async handleInterviewCompleted(data) {
    const { candidateUserId, jobTitle, interviewId } = data;

    await notificationService.createNotification({
      userId: candidateUserId,
      title: "Interview Completed",
      message: `Your interview for '${jobTitle}' has been marked as completed.`,
      type: NotificationType.INTERVIEW,
      entityId: interviewId,
      entityType: "Interview",
    });
  }

  /**
   * Event Handler: ResumeUploaded
   */
  async handleResumeUploaded(data) {
    const { userId, resumeTitle, resumeId } = data;

    await notificationService.createNotification({
      userId,
      title: "Resume Uploaded",
      message: `Your resume '${resumeTitle}' has been uploaded successfully.`,
      type: NotificationType.RESUME,
      entityId: resumeId,
      entityType: "Resume",
    });
  }

  /**
   * Event Handler: ResumeAnalyzed
   */
  async handleResumeAnalyzed(data) {
    const { userId, resumeTitle, resumeId, aiScore } = data;

    await notificationService.createNotification({
      userId,
      title: "AI Resume Analysis Complete",
      message: `AI analysis completed for '${resumeTitle}'. Overall ATS Score: ${aiScore}%.`,
      type: NotificationType.AI,
      entityId: resumeId,
      entityType: "Resume",
      metadata: { aiScore },
    });
  }

  /**
   * Event Handler: ResumeScoreUpdated
   */
  async handleResumeScoreUpdated(data) {
    const { userId, resumeId, newScore } = data;

    await notificationService.createNotification({
      userId,
      title: "Resume ATS Score Updated",
      message: `Your resume ATS match score has been updated to ${newScore}%.`,
      type: NotificationType.AI,
      entityId: resumeId,
      entityType: "Resume",
    });
  }

  /**
   * Event Handler: AIJobMatchReady
   */
  async handleAIJobMatchReady(data) {
    const { userId, jobTitle, matchPercentage, jobId } = data;

    await notificationService.createNotification({
      userId,
      title: "AI Job Match Recommendation",
      message: `You have a ${matchPercentage}% match score for '${jobTitle}'.`,
      type: NotificationType.AI,
      entityId: jobId,
      entityType: "Job",
    });
  }

  /**
   * Event Handler: ApplicationHired
   */
  async handleApplicationHired(data) {
    const { candidateUserId, jobTitle, companyName, applicationId } = data;

    await notificationService.createNotification({
      userId: candidateUserId,
      title: "Congratulations, You're Hired!",
      message: `Great news! You have been hired for '${jobTitle}' at ${companyName}. Welcome aboard!`,
      type: NotificationType.APPLICATION,
      entityId: applicationId,
      entityType: "Application",
    });
  }

  /**
   * Event Handler: OfferGenerated
   */
  async handleOfferGenerated(data) {
    const { candidateUserId, jobTitle, companyName, applicationId } = data;

    await notificationService.createNotification({
      userId: candidateUserId,
      title: "Job Offer Generated!",
      message: `Congratulations! You have received a job offer for '${jobTitle}' at ${companyName}.`,
      type: NotificationType.APPLICATION,
      entityId: applicationId,
      entityType: "Application",
    });
  }

  /**
   * Event Handler: SystemNotification
   */
  async handleSystemNotification(data) {
    const { userId, title, message } = data;

    await notificationService.createNotification({
      userId,
      title: title || "System Notification",
      message,
      type: NotificationType.SYSTEM,
    });
  }
}

export default new NotificationEventHandler();
