import ApiError from "../../utils/ApiError.js";
import dashboardRepository from "./dashboard.repository.js";

/**
 * Service layer for Dashboard Module
 * Handles business rules, profile completion percentage calculation, date range boundaries, and parallel data aggregation.
 */
class DashboardService {
  /**
   * Calculate profile completion percentage based on weighted candidate profile fields
   * @param {Object} profile - CandidateProfile object with user relation
   * @returns {number} Integer percentage between 0 and 100
   */
  calculateProfileCompletion(profile) {
    if (!profile) return 0;

    let score = 0;

    // User Avatar (10%)
    if (profile.user?.avatar) score += 10;

    // Resumes uploaded (15%)
    if (profile._count?.resumes > 0) score += 15;

    // Bio (10%)
    if (profile.bio && profile.bio.trim().length > 0) score += 10;

    // Phone (10%)
    if (profile.phone && profile.phone.trim().length > 0) score += 10;

    // Location (10%)
    if (profile.location && profile.location.trim().length > 0) score += 10;

    // Years of Experience (5%)
    if (profile.yearsOfExperience !== null && profile.yearsOfExperience !== undefined) score += 5;

    // Current Position (10%)
    if (profile.currentPosition && profile.currentPosition.trim().length > 0) score += 10;

    // Expected Salary (5%)
    if (profile.expectedSalary !== null && profile.expectedSalary !== undefined) score += 5;

    // LinkedIn URL (10%)
    if (profile.linkedinUrl && profile.linkedinUrl.trim().length > 0) score += 10;

    // GitHub URL (10%)
    if (profile.githubUrl && profile.githubUrl.trim().length > 0) score += 10;

    // Portfolio URL (5%)
    if (profile.portfolioUrl && profile.portfolioUrl.trim().length > 0) score += 5;

    return Math.min(100, score);
  }

  /**
   * Fetch candidate dashboard metrics and personalized recommendations
   * @param {string} userId - Authenticated system user ID
   */
  async getCandidateDashboard(userId) {
    const candidateProfile =
      await dashboardRepository.findCandidateProfileForDashboard(userId);

    if (!candidateProfile) {
      throw new ApiError(404, "Candidate profile not found.");
    }

    const candidateId = candidateProfile.id;

    // Concurrently execute all independent queries for optimal performance
    const [
      defaultResume,
      stats,
      upcomingInterviews,
      recentApplications,
      appliedJobIds,
    ] = await Promise.all([
      dashboardRepository.findDefaultResume(candidateId),
      dashboardRepository.countCandidateApplicationsStats(candidateId),
      dashboardRepository.findUpcomingCandidateInterviews(candidateId, 5),
      dashboardRepository.findRecentCandidateApplications(candidateId, 5),
      dashboardRepository.findCandidateAppliedJobIds(candidateId),
    ]);

    // Fetch recommended open jobs excluding already applied jobs
    const recommendedJobs = await dashboardRepository.findRecommendedJobs(
      appliedJobIds,
      5
    );

    const profileCompletion = this.calculateProfileCompletion(candidateProfile);

    return {
      profileCompletion,
      defaultResume: defaultResume || null,
      stats,
      upcomingInterviews,
      recentApplications,
      recommendedJobs,
    };
  }

  /**
   * Fetch recruiter dashboard metrics, stats, recent applications, and top candidates
   * @param {string} userId - Authenticated system user ID
   */
  async getRecruiterDashboard(userId) {
    const recruiter =
      await dashboardRepository.findRecruiterProfileByUserId(userId);

    if (!recruiter) {
      throw new ApiError(404, "Recruiter profile not found.");
    }

    const recruiterId = recruiter.id;

    // Calculate Date boundaries for Today and This Week (last 7 days rolling window)
    const now = new Date();
    
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 6);

    const weekEnd = new Date(now);

    // Concurrently execute all independent metrics queries
    const [
      jobStats,
      appStats,
      interviewStats,
      recentApplications,
      upcomingInterviews,
      topCandidates,
      stageCounts,
    ] = await Promise.all([
      dashboardRepository.countRecruiterJobsStats(recruiterId),
      dashboardRepository.countRecruiterApplicationsStats(
        recruiterId,
        todayStart,
        weekStart
      ),
      dashboardRepository.countRecruiterInterviewsStats(
        recruiterId,
        todayStart,
        todayEnd,
        weekStart,
        weekEnd
      ),
      dashboardRepository.findRecentRecruiterApplications(recruiterId, 5),
      dashboardRepository.findUpcomingRecruiterInterviews(recruiterId, 5),
      dashboardRepository.findTopCandidatesForRecruiter(recruiterId, 5),
      dashboardRepository.countRecruiterStages(recruiterId),
    ]);

    return {
      stats: {
        activeJobs: jobStats.activeJobs,
        closedJobs: jobStats.closedJobs,
        totalApplications: appStats.totalApplications,
        applicationsToday: appStats.applicationsToday,
        applicationsThisWeek: appStats.applicationsThisWeek,
        interviewsToday: interviewStats.interviewsToday,
        interviewsThisWeek: interviewStats.interviewsThisWeek,
      },
      recentApplications,
      upcomingInterviews,
      topCandidates,
      stageCounts,
      reporting: { from: weekStart.toISOString(), through: now.toISOString(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    };
  }
}

export default new DashboardService();
