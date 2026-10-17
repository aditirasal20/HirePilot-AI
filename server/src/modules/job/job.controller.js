import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import jobService from "./job.service.js";

const createJob = asyncHandler(async (req, res) => {
  const job = await jobService.create(req.user.id, req.body);

  return res.status(201).json(
    new ApiResponse(201, "Job created successfully", { job })
  );
});

const getMyJobs = asyncHandler(async (req, res) => {
  const result = await jobService.getMyJobs(req.user.id, req.query);

  return res.status(200).json(
    new ApiResponse(200, "Recruiter jobs fetched successfully", result)
  );
});

const getJobById = asyncHandler(async (req, res) => {
  const job = await jobService.getJobById(req.params.id, req.user || null);

  return res.status(200).json(
    new ApiResponse(200, "Job fetched successfully", { job })
  );
});

const updateJob = asyncHandler(async (req, res) => {
  const updatedJob = await jobService.updateJob(
    req.params.id,
    req.user.id,
    req.body
  );

  return res.status(200).json(
    new ApiResponse(200, "Job updated successfully", { job: updatedJob })
  );
});

const updateJobStatus = asyncHandler(async (req, res) => {
  const updatedJob = await jobService.updateJobStatus(
    req.params.id,
    req.user.id,
    req.body.status
  );

  return res.status(200).json(
    new ApiResponse(200, "Job status updated successfully", {
      job: updatedJob,
    })
  );
});

const getPublicJobs = asyncHandler(async (req, res) => {
  const result = await jobService.getPublicJobs(req.query);

  return res.status(200).json(
    new ApiResponse(200, "Public jobs fetched successfully", result)
  );
});

export {
  createJob,
  getMyJobs,
  getJobById,
  updateJob,
  updateJobStatus,
  getPublicJobs,
};