import prisma from "../../lib/prisma.js";
import { JobStatus } from "@prisma/client";
import ApiError from "../../utils/ApiError.js";

class ApplicationRepository {
  /**
   * Selection projection for newly created application responses
   */
  get createdApplicationSelect() {
    return {
      id: true,
      candidateId: true,
      jobId: true,
      resumeId: true,
      status: true,
      appliedAt: true,
      job: {
        select: {
          id: true,
          title: true,
          location: true,
          employmentType: true,
          company: {
            select: {
              id: true,
              name: true,
              logo: true,
            },
          },
        },
      },
    };
  }

  /**
   * Selection projection for candidate application cards
   */
  get candidateApplicationCardSelect() {
    return {
      id: true,
      status: true,
      appliedAt: true,
      job: {
        select: {
          id: true,
          title: true,
          location: true,
          employmentType: true,
          salaryMin: true,
          salaryMax: true,
          company: {
            select: {
              id: true,
              name: true,
              logo: true,
              location: true,
            },
          },
        },
      },
      resume: {
        select: {
          id: true,
          title: true,
          fileUrl: true,
        },
      },
    };
  }

  /**
   * Selection projection for recruiter reviewing job applications
   */
  get recruiterApplicationCardSelect() {
    return {
      id: true,
      status: true,
      appliedAt: true,
      candidate: {
        select: {
          id: true,
          location: true,
          yearsOfExperience: true,
          currentPosition: true,
          expectedSalary: true,
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
      resume: {
        select: {
          id: true,
          title: true,
          fileUrl: true,
          aiScore: true,
          analysisStatus: true,
          extractedSkills: true,
        },
      },
    };
  }

  /**
   * Selection projection for detailed single application view
   */
  get singleApplicationDetailSelect() {
    return {
      id: true,
      status: true,
      appliedAt: true,
      recruiterNotes: true,
      candidate: {
        select: {
          id: true,
          userId: true,
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
        },
      },
      job: {
        select: {
          id: true,
          title: true,
          description: true,
          requiredSkills: true,
          location: true,
          employmentType: true,
          salaryMin: true,
          salaryMax: true,
          status: true,
          recruiter: {
            select: {
              id: true,
              userId: true,
            },
          },
          company: {
            select: {
              id: true,
              name: true,
              logo: true,
              website: true,
              location: true,
            },
          },
        },
      },
      resume: {
        select: {
          id: true,
          title: true,
          originalFileName: true,
          fileUrl: true,
          analysisStatus: true,
          aiScore: true,
          extractedSkills: true,
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
      },
      interview: {
        select: {
          id: true,
          interviewType: true,
          scheduledAt: true,
          durationMinutes: true,
          timezone: true,
          meetingLink: true,
          notes: true,
          status: true,
          cancelReason: true,
          completedAt: true,
          cancelledAt: true,
          feedback: true,
          score: true,
          createdAt: true,
        },
      },
    };
  }

  /**
   * Find candidate profile record by system User ID
   * @param {string} userId 
   */
  async findCandidateProfileByUserId(userId) {
    return prisma.candidateProfile.findUnique({
      where: {
        userId,
      },
      select: {
        id: true,
      },
    });
  }

  /**
   * Find recruiter profile record by system User ID
   * @param {string} userId 
   */
  async findRecruiterProfileByUserId(userId) {
    return prisma.recruiterProfile.findUnique({
      where: {
        userId,
      },
      select: {
        id: true,
        companyId: true,
      },
    });
  }

  /**
   * Find an OPEN job record by Job ID
   * @param {string} jobId 
   */
  async findOpenJobById(jobId) {
    return prisma.job.findFirst({
      where: {
        id: jobId,
        status: JobStatus.OPEN,
      },
      select: {
        id: true,
        title: true,
        status: true,
        companyId: true,
      },
    });
  }

  /**
   * Find a job record by ID and verify recruiter ownership
   * @param {string} jobId 
   * @param {string} recruiterId 
   */
  async findJobByIdAndRecruiter(jobId, recruiterId) {
    return prisma.job.findFirst({
      where: {
        id: jobId,
        recruiterId,
      },
      select: {
        id: true,
        title: true,
        status: true,
        recruiterId: true,
      },
    });
  }

  /**
   * Find a resume record by Resume ID
   * Optimized to select only fields required for existence & ownership verification
   * @param {string} resumeId 
   */
  async findResumeById(resumeId) {
    return prisma.resume.findUnique({
      where: {
        id: resumeId,
      },
      select: {
        id: true,
        candidateProfileId: true,
      },
    });
  }

  /**
   * Check if an application already exists for a given candidate and job
   * Uses the @@unique([candidateId, jobId]) index for O(1) B-tree lookup
   * @param {string} candidateId 
   * @param {string} jobId 
   */
  async findExistingApplication(candidateId, jobId) {
    return prisma.application.findUnique({
      where: {
        candidateId_jobId: {
          candidateId,
          jobId,
        },
      },
      select: {
        id: true,
      },
    });
  }

  /**
   * Create a new application record
   * Handles Prisma P2002 unique constraint error gracefully to return 409 Conflict
   * @param {Object} data - { candidateId, jobId, resumeId, status }
   */
  async create(data) {
    try {
      return await prisma.application.create({
        data,
        select: this.createdApplicationSelect,
      });
    } catch (error) {
      if (error.code === "P2002") {
        throw new ApiError(409, "You have already applied for this job.");
      }
      throw error;
    }
  }

  /**
   * Find paginated applications for a specific candidate
   * @param {string} candidateId 
   * @param {Object} queryParams - { page, limit, status }
   */
  async findCandidateApplications(candidateId, { page = 1, limit = 10, status }) {
    const skip = (page - 1) * limit;

    const where = {
      candidateId,
    };

    if (status) {
      where.status = status;
    }

    const [applications, totalApplications] = await Promise.all([
      prisma.application.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          appliedAt: "desc",
        },
        select: this.candidateApplicationCardSelect,
      }),
      prisma.application.count({
        where,
      }),
    ]);

    return { applications, totalApplications, page, limit };
  }

  /**
   * Find paginated applications submitted for a specific job posting
   * @param {string} jobId 
   * @param {Object} queryParams - { page, limit, status }
   */
  async findJobApplications(jobId, { page = 1, limit = 10, status, search, minScore, sort = "latest" }) {
    const base = { jobId };
    if (search) base.candidate = { user: { OR: [{ fullName: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }] } };
    if (minScore !== undefined) base.resume = { analysisStatus: "COMPLETED", aiScore: { gte: Number(minScore) } };
    const where = { ...base, ...(status ? { status } : {}) };
    const orderBy = sort === "score" ? [{ resume: { aiScore: { sort: "desc", nulls: "last" } } }, { appliedAt: "desc" }, { id: "desc" }] : [{ appliedAt: sort === "oldest" ? "asc" : "desc" }, { id: "desc" }];
    const [applications, totalApplications, stages] = await Promise.all([
      prisma.application.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy, select: this.recruiterApplicationCardSelect }),
      prisma.application.count({ where }),
      prisma.application.groupBy({ by: ["status"], where: base, _count: { _all: true } }),
    ]);
    return { applications, totalApplications, stageCounts: Object.fromEntries(stages.map(row => [row.status, row._count._all])), page, limit };
  }

  /**
   * Find application by ID with minimal job & recruiter information for status updates
   * @param {string} id 
   */
  async findApplicationByIdWithJobAndRecruiter(id) {
    return prisma.application.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        status: true,
        jobId: true,
        job: {
          select: {
            id: true,
            recruiterId: true,
          },
        },
      },
    });
  }

  /**
   * Find a job's recruiter userId and company name for notification dispatch
   * @param {string} jobId 
   */
  async findJobForNotification(jobId) {
    return prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        title: true,
        recruiter: {
          select: {
            userId: true,
          },
        },
        company: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  /**
   * Find application details needed for status-change notifications
   * @param {string} applicationId 
   */
  async findApplicationForStatusNotification(applicationId) {
    return prisma.application.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        candidate: {
          select: {
            userId: true,
          },
        },
        job: {
          select: {
            id: true,
            title: true,
            company: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Find full detailed application record by ID for single application view
   * @param {string} id 
   */
  async findApplicationByIdForDetail(id) {
    return prisma.application.findUnique({
      where: {
        id,
      },
      select: this.singleApplicationDetailSelect,
    });
  }

  /**
   * Update status of an application
   * @param {string} id 
   * @param {string} status 
   */
  async updateStatus(id, status) {
    return prisma.application.update({
      where: {
        id,
      },
      data: {
        status,
      },
      select: this.createdApplicationSelect,
    });
  }

  /**
   * Update recruiter notes on an application
   * @param {string} id 
   * @param {string} notes 
   */
  async updateRecruiterNotes(id, notes) {
    return prisma.application.update({
      where: {
        id,
      },
      data: {
        recruiterNotes: notes || null,
      },
      select: {
        id: true,
        recruiterNotes: true,
      },
    });
  }
}

export default new ApplicationRepository();
