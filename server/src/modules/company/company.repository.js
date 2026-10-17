import prisma from "../../lib/prisma.js";

class CompanyRepository {
  async findByName(name) {
    return prisma.company.findFirst({
      where: { name },
    });
  }

  async findById(id) {
    return prisma.company.findUnique({
      where: { id },
    });
  }
  
  async findRecruiterProfile(userId) {
    return prisma.recruiterProfile.findUnique({
      where: {
        userId,
      },
      include: {
        company: true,
      },
    });
  }

  async createCompanyAndAssignRecruiter(userId, data) {
    return prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data,
      });

      await tx.recruiterProfile.update({
        where: {
          userId,
        },
        data: {
          companyId: company.id,
        },
      });

      return company;
    });
  }

  async updateById(id, data) {
    return prisma.company.update({
      where: { id },
      data,
    });
  }
}

export default new CompanyRepository();