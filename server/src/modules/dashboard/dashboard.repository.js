import prisma from "../../lib/prisma.js";
import { JobStatus, ApplicationStatus, InterviewStatus } from "@prisma/client";

/**
 * Repository layer for Dashboard Module
 * Encapsulates pure Prisma queries with lean select projections and performance optimization.
 */
class DashboardRepository {
  /**
   * Find candidate profile data along with user profile and resume count
   * @param {string} userId - Candidate system user ID
   */
  async findCandidateProfileForDashboard(userId) {
    return prisma.candidateProfile.findUnique({
      where: {
        userId,
      },
      select: {
        id: true,
        phone: true,
        bio: true,
        location: true,
        yearsOfExperience: true,
        currentPosition: true,
        expectedSalary: true,
        linkedinUrl: true,
        githubUrl: true,
        portfolioUrl: true,
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            resumes: true,
          },
        },
      },
    });
  }

  /**
   * Find default resume for a candidate
   * @param {string} candidateId 
   */
  async findDefaultResume(candidateId) {
    return prisma.resume.findFirst({
      where: {
        candidateProfileId: candidateId,
        isDefault: true,
      },
      select: {
        id: true,
        title: true,
        fileUrl: true,
        aiScore: true,
        analysisStatus: true,
        extractedSkills: true,
        isDefault: true,
        createdAt: true,
      },
    });
  }

  /**
   * Aggregate application stats for candidate broken down by status concurrently
   * @param {string} candidateId 
   */
  async countCandidateApplicationsStats(candidateId) {
    const [
      totalApplications,
      reviewing,
      shortlisted,
      interviewScheduled,
      hired,
      rejected,
    ] = await Promise.all([
      prisma.application.count({ where: { candidateId } }),
      prisma.application.count({
        where: { candidateId, status: ApplicationStatus.REVIEWING },
      }),
      prisma.application.count({
        where: { candidateId, status: ApplicationStatus.SHORTLISTED },
      }),
      prisma.application.count({
        where: { candidateId, status: ApplicationStatus.INTERVIEW_SCHEDULED },
      }),
      prisma.application.count({
        where: { candidateId, status: ApplicationStatus.HIRED },
      }),
      prisma.application.count({
        where: { candidateId, status: ApplicationStatus.REJECTED },
      }),
    ]);

    return {
      applications: totalApplications,
      reviewing,
      shortlisted,
      interviewScheduled,
      hired,
      rejected,
    };
  }

  /**
   * Find upcoming interviews for a candidate
   * @param {string} candidateId 
   * @param {number} limit 
   */
  async findUpcomingCandidateInterviews(candidateId, limit = 5) {
    return prisma.interview.findMany({
      where: {
        application: {
          candidateId,
        },
        status: {
          in: [InterviewStatus.SCHEDULED, InterviewStatus.RESCHEDULED],
        },
        scheduledAt: {
          gte: new Date(),
        },
      },
      take: limit,
      orderBy: {
        scheduledAt: "asc",
      },
      select: {
        id: true,
        scheduledAt: true,
        durationMinutes: true,
        timezone: true,
        interviewType: true,
        meetingLink: true,
        status: true,
        application: {
          select: {
            id: true,
            job: {
              select: {
                id: true,
                title: true,
                company: {
                  select: {
                    id: true,
                    name: true,
                    logo: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  /**
   * Find recent applications submitted by candidate
   * @param {string} candidateId 
   * @param {number} limit 
   */
  async findRecentCandidateApplications(candidateId, limit = 5) {
    return prisma.application.findMany({
      where: {
        candidateId,
      },
      take: limit,
      orderBy: {
        appliedAt: "desc",
      },
      select: {
        id: true,
        status: true,
        appliedAt: true,
        job: {
          select: {
            id: true,
            title: true,
            location: true,
            company: {
              select: {
                id: true,
                name: true,
                logo: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get list of job IDs the candidate has already applied to
   * @param {string} candidateId 
   */
  async findCandidateAppliedJobIds(candidateId) {
    const applications = await prisma.application.findMany({
      where: {
        candidateId,
      },
      select: {
        jobId: true,
      },
    });
    return applications.map((app) => app.jobId);
  }

  /**
   * Find open jobs for candidate recommendation excluding already applied jobs
   * @param {string[]} excludeJobIds 
   * @param {number} limit 
   */
  async findRecommendedJobs(excludeJobIds = [], limit = 5) {
    const where = {
      status: JobStatus.OPEN,
    };

    if (Array.isArray(excludeJobIds) && excludeJobIds.length > 0) {
      where.id = { notIn: excludeJobIds };
    }

    return prisma.job.findMany({
      where,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        location: true,
        employmentType: true,
        salaryMin: true,
        salaryMax: true,
        createdAt: true,
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            location: true,
          },
        },
      },
    });
  }

  /**
   * Find recruiter profile data by system User ID
   * @param {string} userId - Recruiter system user ID
   */
  async findRecruiterProfileByUserId(userId) {
    return prisma.recruiterProfile.findUnique({
      where: {
        userId,
      },
      select: {
        id: true,
        companyId: true,
        designation: true,
        isVerified: true,
      },
    });
  }

  /**
   * Count active and closed jobs for a recruiter
   * @param {string} recruiterId 
   */
  async countRecruiterStages(recruiterId) {
    const rows = await prisma.application.groupBy({ by: ["status"], where: { job: { recruiterId } }, _count: { _all: true } });
    return Object.fromEntries(rows.map(row => [row.status, row._count._all]));
  }

  async countRecruiterJobsStats(recruiterId) {
    const [activeJobs, closedJobs] = await Promise.all([
      prisma.job.count({
        where: {
          recruiterId,
          status: JobStatus.OPEN,
        },
      }),
      prisma.job.count({
        where: {
          recruiterId,
          status: JobStatus.CLOSED,
        },
      }),
    ]);

    return { activeJobs, closedJobs };
  }

  /**
   * Count application statistics for a recruiter (Total, Today, This Week)
   * @param {string} recruiterId 
   * @param {Date} todayStart 
   * @param {Date} weekStart 
   */
  async countRecruiterApplicationsStats(recruiterId, todayStart, weekStart) {
    const jobFilter = { job: { recruiterId } };

    const [totalApplications, applicationsToday, applicationsThisWeek] =
      await Promise.all([
        prisma.application.count({
          where: jobFilter,
        }),
        prisma.application.count({
          where: {
            ...jobFilter,
            appliedAt: {
              gte: todayStart,
            },
          },
        }),
        prisma.application.count({
          where: {
            ...jobFilter,
            appliedAt: {
              gte: weekStart,
            },
          },
        }),
      ]);

    return {
      totalApplications,
      applicationsToday,
      applicationsThisWeek,
    };
  }

  /**
   * Count interview statistics for a recruiter (Today, This Week)
   * @param {string} recruiterId 
   * @param {Date} todayStart 
   * @param {Date} todayEnd 
   * @param {Date} weekStart 
   * @param {Date} weekEnd 
   */
  async countRecruiterInterviewsStats(
    recruiterId,
    todayStart,
    todayEnd,
    weekStart,
    weekEnd
  ) {
    const interviewFilter = {
      application: {
        job: {
          recruiterId,
        },
      },
      status: {
        not: InterviewStatus.CANCELLED,
      },
    };

    const [interviewsToday, interviewsThisWeek] = await Promise.all([
      prisma.interview.count({
        where: {
          ...interviewFilter,
          scheduledAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),
      prisma.interview.count({
        where: {
          ...interviewFilter,
          scheduledAt: {
            gte: weekStart,
            lte: weekEnd,
          },
        },
      }),
    ]);

    return {
      interviewsToday,
      interviewsThisWeek,
    };
  }

  /**
   * Find recent applications submitted to recruiter's job postings
   * @param {string} recruiterId 
   * @param {number} limit 
   */
  async findRecentRecruiterApplications(recruiterId, limit = 5) {
    return prisma.application.findMany({
      where: {
        job: {
          recruiterId,
        },
      },
      take: limit,
      orderBy: {
        appliedAt: "desc",
      },
      select: {
        id: true,
        status: true,
        appliedAt: true,
        candidate: {
          select: {
            id: true,
            yearsOfExperience: true,
            currentPosition: true,
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        job: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  /**
   * Find upcoming interviews for a recruiter's job postings
   * @param {string} recruiterId 
   * @param {number} limit 
   */
  async findUpcomingRecruiterInterviews(recruiterId, limit = 5) {
    return prisma.interview.findMany({
      where: {
        application: {
          job: {
            recruiterId,
          },
        },
        status: {
          in: [InterviewStatus.SCHEDULED, InterviewStatus.RESCHEDULED],
        },
        scheduledAt: {
          gte: new Date(),
        },
      },
      take: limit,
      orderBy: {
        scheduledAt: "asc",
      },
      select: {
        id: true,
        scheduledAt: true,
        durationMinutes: true,
        timezone: true,
        interviewType: true,
        meetingLink: true,
        status: true,
        application: {
          select: {
            id: true,
            candidate: {
              select: {
                id: true,
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                    avatar: true,
                  },
                },
              },
            },
            job: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Find top candidates who applied to recruiter's jobs sorted by resume AI score, experience, and recency
   * @param {string} recruiterId 
   * @param {number} limit 
   */
  async findTopCandidatesForRecruiter(recruiterId, limit = 5) {
    return prisma.application.findMany({
      where: {
        job: {
          recruiterId,
        },
      },
      take: limit,
      orderBy: [
        { resume: { aiScore: "desc" } },
        { candidate: { yearsOfExperience: "desc" } },
        { appliedAt: "desc" },
      ],
      select: {
        id: true,
        status: true,
        appliedAt: true,
        candidate: {
          select: {
            id: true,
            location: true,
            yearsOfExperience: true,
            currentPosition: true,
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        job: {
          select: {
            id: true,
            title: true,
          },
        },
        resume: {
          select: {
            id: true,
            title: true,
            aiScore: true,
            extractedSkills: true,
            fileUrl: true,
          },
        },
      },
    });
  }
}

export default new DashboardRepository();
