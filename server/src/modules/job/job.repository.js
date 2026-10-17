import prisma from "../../lib/prisma.js";
import { JobStatus } from "@prisma/client";

class JobRepository {
  /**
   * Selection projection for public and recruiter job cards
   */
  get standardJobSelect() {
    return {
      id: true,
      title: true,
      description: true,
      location: true,
      salaryMin: true,
      salaryMax: true,
      yearsOfExperience: true,
      employmentType: true,
      requiredSkills: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      company: {
        select: {
          id: true,
          name: true,
          logo: true,
          location: true,
        },
      },
      recruiter: {
        select: {
          id: true,
          userId: true,
          designation: true,
        },
      },
    };
  }

  async findRecruiterProfile(userId) {
    return prisma.recruiterProfile.findUnique({
      where: {
        userId,
      },
      select: {
        id: true,
        companyId: true,
        isVerified: true,
      },
    });
  }

  async create(data) {
    return prisma.job.create({
      data,
      select: this.standardJobSelect,
    });
  }

  async findById(id) {
    return prisma.job.findUnique({
      where: {
        id,
      },
      select: this.standardJobSelect,
    });
  }

  async update(id, data) {
    return prisma.job.update({
      where: {
        id,
      },
      data,
      select: this.standardJobSelect,
    });
  }

  async findRecruiterJobs(recruiterId, { page = 1, limit = 20, search, status }) {
    const where = { recruiterId, ...(status ? { status } : {}) };
    if (search) where.OR = ["title","location","description"].map(field => ({ [field]: { contains: search, mode: "insensitive" } }));
    const [jobs,totalJobs] = await Promise.all([
      prisma.job.findMany({ where, skip: (page - 1) * limit, take: limit, select: { ...this.standardJobSelect, _count: { select: { applications: true } } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }] }),
      prisma.job.count({ where }),
    ]);
    return { jobs, totalJobs, page, limit };
  }

  async findByIdAndRecruiter(jobId, recruiterId) {
    return prisma.job.findFirst({
      where: {
        id: jobId,
        recruiterId,
      },
      select: this.standardJobSelect,
    });
  }

  async findPublicJobs(queryParams) {
    const {
      page = 1,
      limit = 10,
      search,
      location,
      employmentType,
      experience,
      minSalary,
      maxSalary,
      skill,
      sort = "latest",
    } = queryParams;

    const skip = (page - 1) * limit;

    const where = {
      status: JobStatus.OPEN,
    };

    // Full text or keyword search across title & description
    if (search) {
      const keywords = search.trim().split(/\s+/);
      where.OR = keywords.flatMap((keyword) => [
        { title: { contains: keyword, mode: "insensitive" } },
        { description: { contains: keyword, mode: "insensitive" } },
      ]);
    }

    if (location) {
      where.location = {
        contains: location,
        mode: "insensitive",
      };
    }

    if (employmentType) {
      where.employmentType = employmentType;
    }

    if (experience !== undefined) {
      where.yearsOfExperience = {
        gte: Number(experience),
      };
    }

    // Salary Filtering with Nullable Bounds Support
    if (minSalary || maxSalary) {
      where.AND = where.AND || [];

      if (minSalary) {
        where.AND.push({
          OR: [
            { salaryMax: { gte: Number(minSalary) } },
            { salaryMax: null },
          ],
        });
      }

      if (maxSalary) {
        where.AND.push({
          OR: [
            { salaryMin: { lte: Number(maxSalary) } },
            { salaryMin: null },
          ],
        });
      }
    }

    // Skill filtering (single skill or multi-skill array)
    if (skill) {
      const skillsArray = Array.isArray(skill)
        ? skill
        : skill.split(",").map((s) => s.trim());

      where.requiredSkills = {
        hasSome: skillsArray,
      };
    }

    // Sorting resolution
    const sortMap = {
      latest: { createdAt: "desc" },
      oldest: { createdAt: "asc" },
      salaryAsc: { salaryMin: "asc" },
      salaryDesc: { salaryMax: "desc" },
    };

    const orderBy = sortMap[sort] || { createdAt: "desc" };

    const [jobs, totalJobs] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: this.standardJobSelect,
      }),
      prisma.job.count({
        where,
      }),
    ]);

    return { jobs, totalJobs, page, limit };
  }
}

export default new JobRepository();
