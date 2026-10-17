import prisma from "../../lib/prisma.js";
import { ApplicationStatus } from "@prisma/client";

class InterviewRepository {
  /**
   * Selection projection for Interview entities
   */
  get standardInterviewSelect() {
    return {
      id: true,
      applicationId: true,
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
      updatedAt: true,
      application: {
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
              location: true,
              employmentType: true,
              recruiterId: true,
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
    };
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
   * Find application record for interview scheduling verification
   * @param {string} applicationId 
   */
  async findApplicationForScheduling(applicationId) {
    return prisma.application.findUnique({
      where: {
        id: applicationId,
      },
      select: {
        id: true,
        status: true,
        candidateId: true,
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
   * Find interview linked to an application ID
   * @param {string} applicationId 
   */
  async findInterviewByApplicationId(applicationId) {
    return prisma.interview.findUnique({
      where: {
        applicationId,
      },
      select: {
        id: true,
        status: true,
      },
    });
  }

  /**
   * Find single interview by primary key ID
   * @param {string} id 
   */
  async findInterviewById(id) {
    return prisma.interview.findUnique({
      where: {
        id,
      },
      select: this.standardInterviewSelect,
    });
  }

  /**
   * Atomically create interview record and update application status using $transaction
   * @param {Object} interviewData 
   * @param {string} applicationId 
   */
  async createScheduleTransaction(interviewData, applicationId) {
    const [createdInterview] = await prisma.$transaction([
      prisma.interview.create({
        data: interviewData,
        select: this.standardInterviewSelect,
      }),
      prisma.application.update({
        where: {
          id: applicationId,
        },
        data: {
          status: ApplicationStatus.INTERVIEW_SCHEDULED,
        },
        select: {
          id: true,
          status: true,
        },
      }),
    ]);

    return createdInterview;
  }

  /**
   * Find paginated interviews for jobs owned by a recruiter
   * @param {string} recruiterId 
   * @param {Object} queryParams - { page, limit, status, interviewType }
   */
  async findRecruiterInterviews(
    recruiterId,
    { page = 1, limit = 10, status, interviewType }
  ) {
    const skip = (page - 1) * limit;

    const where = {
      application: {
        job: {
          recruiterId,
        },
      },
    };

    if (status) {
      where.status = status;
    }

    if (interviewType) {
      where.interviewType = interviewType;
    }

    const [interviews, totalInterviews] = await Promise.all([
      prisma.interview.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          scheduledAt: "asc",
        },
        select: this.standardInterviewSelect,
      }),
      prisma.interview.count({
        where,
      }),
    ]);

    return { interviews, totalInterviews, page, limit };
  }

  /**
   * Find paginated interviews for a candidate
   * @param {string} candidateId 
   * @param {Object} queryParams - { page, limit, status, interviewType }
   */
  async findCandidateInterviews(
    candidateId,
    { page = 1, limit = 10, status, interviewType }
  ) {
    const skip = (page - 1) * limit;

    const where = {
      application: {
        candidateId,
      },
    };

    if (status) {
      where.status = status;
    }

    if (interviewType) {
      where.interviewType = interviewType;
    }

    const [interviews, totalInterviews] = await Promise.all([
      prisma.interview.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          scheduledAt: "asc",
        },
        select: this.standardInterviewSelect,
      }),
      prisma.interview.count({
        where,
      }),
    ]);

    return { interviews, totalInterviews, page, limit };
  }

  /**
   * Update interview details (scheduledAt, meetingLink, notes, etc.)
   * @param {string} id 
   * @param {Object} data 
   */
  async update(id, data) {
    return prisma.interview.update({
      where: {
        id,
      },
      data,
      select: this.standardInterviewSelect,
    });
  }
}

export default new InterviewRepository();
