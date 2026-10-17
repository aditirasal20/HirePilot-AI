import prisma from "../../lib/prisma.js";

class AuthRepository {
  async findUserByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async registerUser(userData, role) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: userData,
      });

      if (role === "CANDIDATE") {
        await tx.candidateProfile.create({
          data: {
            userId: user.id,
          },
        });
      }

      if (role === "RECRUITER") {
        await tx.recruiterProfile.create({
          data: {
            userId: user.id,
          },
        });
      }

      return tx.user.findUnique({
        where: {
          id: user.id,
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          avatar: true,
          role: true,
          isEmailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });
  }

  async updateRefreshToken(userId, refreshTokenHash, refreshTokenExpiresAt) {
    return prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        refreshTokenHash,
        refreshTokenExpiresAt,
      },
    });
  }

  async rotateRefreshToken(
    userId,
    previousHash,
    refreshTokenHash,
    refreshTokenExpiresAt,
  ) {
    return prisma.user.updateMany({
      where: {
        id: userId,
        refreshTokenHash: previousHash,
        refreshTokenExpiresAt: { gt: new Date() },
      },
      data: { refreshTokenHash, refreshTokenExpiresAt },
    });
  }

  async updatePasswordIfCurrent(userId, password, nextPassword) {
    return prisma.user.updateMany({
      where: { id: userId, password },
      data: {
        password: nextPassword,
        refreshTokenHash: null,
        refreshTokenExpiresAt: null,
      },
    });
  }

  async clearRefreshToken(userId) {
    return prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        refreshTokenHash: null,
        refreshTokenExpiresAt: null,
      },
    });
  }

  async markEmailVerified(userId) {
    return prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        isEmailVerified: true,
      },
    });
  }

  async findUserWithPassword(email) {
    return prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  async findUserByIdWithAuth(id) {
    return prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        avatar: true,
        role: true,
        isEmailVerified: true,
        password: true,
        refreshTokenHash: true,
        refreshTokenExpiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updatePassword(userId, hashedPassword) {
    return prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        password: hashedPassword,
        refreshTokenHash: null,
        refreshTokenExpiresAt: null,
      },
    });
  }

  async findUserById(id) {
    return prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        avatar: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}

export default new AuthRepository();
