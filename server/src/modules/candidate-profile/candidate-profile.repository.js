import prisma from "../../lib/prisma.js";

class CandidateProfileRepository {
  async findByUserId(userId) {
    return prisma.candidateProfile.findUnique({
      where: {
        userId,
      },
    });
  }

  async updateByUserId(userId, data) {
    return prisma.candidateProfile.update({
      where: {
        userId,
      },
      data,
    });
  }
}

export default new CandidateProfileRepository();
