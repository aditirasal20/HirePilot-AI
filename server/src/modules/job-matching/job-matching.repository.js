import prisma from "../../lib/prisma.js";

class JobMatchingRepository {
  async findCandidateProfileByUserId(userId) {
    return prisma.candidateProfile.findUnique({
      where: { userId },
      select: {
        id: true,
      },
    });
  }

  async findResumeById(resumeId) {
    return prisma.resume.findUnique({
      where: { id: resumeId },
      select: {
        id: true,
        candidateProfileId: true,

        summary: true,

        extractedSkills: true,

        strengths: true,

        weaknesses: true,

        analysisStatus: true
      }
    });
  }

  async findJobById(jobId) {
    return prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        title: true,
        description: true,
        requiredSkills: true,
        yearsOfExperience: true,
        employmentType: true,
        location: true,
        status: true,
        company: {
          select: {
            id: true,
            name: true,
            industry: true,
          },
        },
      },
    });
  }

  async findExistingMatch(resumeId, jobId) {
    return prisma.jobMatch.findUnique({
      where: {
        resumeId_jobId: {
          resumeId,
          jobId,
        },
      },
    });
  }

  async createJobMatch(data) {
    return prisma.jobMatch.create({
      data,
    });
  }

  async updateJobMatch(id, data) {
    return prisma.jobMatch.update({
      where: { id },
      data,
    });
  }

  async findJobMatchById(id) {
    return prisma.jobMatch.findUnique({
      where: { id },
      include: {
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
        resume: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  async findJobMatchByResumeAndJob(resumeId, jobId) {
    return prisma.jobMatch.findUnique({
      where: {
        resumeId_jobId: {
          resumeId,
          jobId,
        },
      },
      include: {
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

  async findCandidateMatches(candidateId) {
    return prisma.jobMatch.findMany({
      where: {
        candidateId,
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            location: true,
            company: {
              select: {
                name: true,
                logo: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async deleteJobMatch(id) {
    return prisma.jobMatch.delete({
      where: { id },
    });
  }
}

export default new JobMatchingRepository();