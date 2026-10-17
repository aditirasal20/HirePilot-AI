import { JobStatus } from "@prisma/client";
import ApiError from "../../utils/ApiError.js";
import jobRepository from "./job.repository.js";

class JobService {
  async create(userId, data) {
    const recruiter = await jobRepository.findRecruiterProfile(userId);

    if (!recruiter) {
      throw new ApiError(404, "Recruiter profile not found.");
    }

    if (!recruiter.companyId) {
      throw new ApiError(
        403,
        "Recruiter is not associated with a company."
      );
    }

    if (
      data.salaryMin !== undefined &&
      data.salaryMax !== undefined &&
      data.salaryMin > data.salaryMax
    ) {
      throw new ApiError(
        400,
        "Minimum salary cannot be greater than maximum salary."
      );
    }

    return jobRepository.create({
      title: data.title,
      description: data.description,
      location: data.location,
      salaryMin: data.salaryMin,
      salaryMax: data.salaryMax,
      yearsOfExperience: data.yearsOfExperience,
      employmentType: data.employmentType,
      requiredSkills: data.requiredSkills,
      recruiterId: recruiter.id,
      companyId: recruiter.companyId,
      status: JobStatus.DRAFT,
    });
  }

  async getMyJobs(userId, query = {}) {
    const recruiter = await jobRepository.findRecruiterProfile(userId);

    if (!recruiter) {
      throw new ApiError(404, "Recruiter profile not found.");
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));

    const { jobs, totalJobs } = await jobRepository.findRecruiterJobs(
      recruiter.id,
      { page, limit, search: query.search, status: query.status }
    );

    const totalPages = Math.max(1, Math.ceil(totalJobs / limit));

    return {
      jobs,
      pagination: {
        page,
        limit,
        totalJobs,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async getJobById(jobId, requestingUser = null) {
    const job = await jobRepository.findById(jobId);

    if (!job) {
      throw new ApiError(404, "Job not found.");
    }

    // Access Control: Draft & Closed jobs can only be viewed by the owner recruiter
    const isOwner = requestingUser && job.recruiter.userId === requestingUser.id;
    if (job.status !== JobStatus.OPEN && !isOwner) {
      throw new ApiError(404, "Job not found.");
    }

    return job;
  }

  async updateJob(jobId, userId, data) {
    const recruiter = await jobRepository.findRecruiterProfile(userId);

    if (!recruiter) {
      throw new ApiError(404, "Recruiter profile not found.");
    }

    const job = await jobRepository.findByIdAndRecruiter(
      jobId,
      recruiter.id
    );

    if (!job) {
      throw new ApiError(
        404,
        "Job not found or you are not authorized to update it."
      );
    }

    if (job.status === JobStatus.CLOSED) {
      throw new ApiError(
        400,
        "Closed jobs cannot be modified. Change the status to re-open the job first."
      );
    }

    // Explicit field whitelist to prevent mass assignment of status or relational IDs
    const allowedFields = [
      "title",
      "description",
      "location",
      "salaryMin",
      "salaryMax",
      "yearsOfExperience",
      "employmentType",
      "requiredSkills",
    ];

    const cleanData = {};
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        cleanData[field] = data[field];
      }
    }

    const effectiveSalaryMin = cleanData.salaryMin ?? job.salaryMin;
    const effectiveSalaryMax = cleanData.salaryMax ?? job.salaryMax;

    if (
      effectiveSalaryMin !== null &&
      effectiveSalaryMax !== null &&
      effectiveSalaryMin > effectiveSalaryMax
    ) {
      throw new ApiError(
        400,
        "Minimum salary cannot be greater than maximum salary."
      );
    }

    return jobRepository.update(jobId, cleanData);
  }

  async updateJobStatus(jobId, userId, status) {
    const recruiter = await jobRepository.findRecruiterProfile(userId);

    if (!recruiter) {
      throw new ApiError(404, "Recruiter profile not found.");
    }

    const job = await jobRepository.findByIdAndRecruiter(
      jobId,
      recruiter.id
    );

    if (!job) {
      throw new ApiError(
        404,
        "Job not found or you are not authorized to update its status."
      );
    }

    const validTransitions = {
      DRAFT: [JobStatus.OPEN],
      OPEN: [JobStatus.CLOSED],
      CLOSED: [JobStatus.OPEN],
    };

    if (!validTransitions[job.status]?.includes(status)) {
      throw new ApiError(
        400,
        `Cannot change job status from ${job.status} to ${status}.`
      );
    }

    return jobRepository.update(jobId, { status });
  }

  async getPublicJobs(query) {
    const { jobs, totalJobs, page, limit } =
      await jobRepository.findPublicJobs(query);

    const totalPages = Math.max(1, Math.ceil(totalJobs / limit));

    return {
      jobs,
      pagination: {
        page,
        limit,
        totalJobs,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }
}

export default new JobService();