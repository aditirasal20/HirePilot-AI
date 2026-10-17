import prisma from "../../lib/prisma.js";

class ResumeRepository {
  /**
   * Standard selection projection for Resume entities
   */
  get standardResumeSelect() {
    return {
      id: true,
      candidateProfileId: true,
      title: true,
      fileUrl: true,
      publicId: true,
      originalFileName: true,
      isDefault: true,
      aiScore: true,
      extractedSkills: true,
      analysisStatus: true,
      createdAt: true,
      updatedAt: true,
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
   * Find resume by primary key ID
   * @param {string} id 
   */
  async findResumeById(id) {
    return prisma.resume.findUnique({
      where: {
        id,
      },
      select: this.standardResumeSelect,
    });
  }

  /**
   * Find resume by ID and verify candidate ownership
   * Includes application count to safely check application links during deletion
   * @param {string} id 
   * @param {string} candidateProfileId 
   */
  async findResumeByIdAndCandidate(id, candidateProfileId) {
    return prisma.resume.findFirst({
      where: {
        id,
        candidateProfileId,
      },
      select: {
        ...this.standardResumeSelect,
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });
  }

  /**
   * Retrieve all resumes for a specific candidate
   * Ordered with default resume first, then by creation date descending
   * @param {string} candidateProfileId 
   */
  async findResumesByCandidate(candidateProfileId) {
    return prisma.resume.findMany({
      where: {
        candidateProfileId,
      },
      orderBy: [
        { isDefault: "desc" },
        { createdAt: "desc" },
      ],
      select: this.standardResumeSelect,
    });
  }

  /**
   * Count total resumes owned by candidate (for enforce max 5 limit)
   * @param {string} candidateProfileId 
   */
  async countByCandidateId(candidateProfileId) {
    return prisma.resume.count({
      where: {
        candidateProfileId,
      },
    });
  }

  /**
   * Find candidate's latest remaining resume excluding a specific ID
   * Used for default resume promotion upon deletion
   * @param {string} candidateProfileId 
   * @param {string} excludedResumeId 
   */
  async findLatestResumeExcept(candidateProfileId, excludedResumeId) {
    return prisma.resume.findFirst({
      where: {
        candidateProfileId,
        id: {
          not: excludedResumeId,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
      },
    });
  }

  /**
   * Persist a new resume record
   * @param {Object} data 
   */
  async create(data) {
    return prisma.resume.create({
      data,
      select: this.standardResumeSelect,
    });
  }

  /**
   * Update resume metadata
   * @param {string} id 
   * @param {Object} data 
   */
  async update(id, data) {
    return prisma.resume.update({
      where: {
        id,
      },
      data,
      select: this.standardResumeSelect,
    });
  }

  /**
   * Atomically set a resume as default for candidate using $transaction
   * Unsets all existing default flags for candidate and sets target resume to default
   * @param {string} candidateProfileId 
   * @param {string} newDefaultResumeId 
   */
  async setDefaultResume(candidateProfileId, newDefaultResumeId) {
    const [, updatedDefault] = await prisma.$transaction([
      prisma.resume.updateMany({
        where: {
          candidateProfileId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      }),
      prisma.resume.update({
        where: {
          id: newDefaultResumeId,
        },
        data: {
          isDefault: true,
        },
        select: this.standardResumeSelect,
      }),
    ]);

    return updatedDefault;
  }

  /**
   * Atomically delete a resume and optionally promote the next resume to default
   * @param {string} resumeId 
   * @param {string} candidateProfileId 
   * @param {string|null} nextDefaultResumeId 
   */
  async deleteResumeWithDefaultPromotion(
    resumeId,
    candidateProfileId,
    nextDefaultResumeId = null
  ) {
    const operations = [
      prisma.resume.delete({
        where: {
          id: resumeId,
        },
        select: this.standardResumeSelect,
      }),
    ];

    if (nextDefaultResumeId) {
      operations.push(
        prisma.resume.update({
          where: {
            id: nextDefaultResumeId,
          },
          data: {
            isDefault: true,
          },
          select: { id: true },
        })
      );
    }

    const [deletedResume] = await prisma.$transaction(operations);
    return deletedResume;
  }
}

export default new ResumeRepository();
