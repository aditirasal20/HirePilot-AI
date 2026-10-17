import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import applicationService from "./application.service.js";

/**
 * Controller for handling job application creation
 * POST /api/v1/applications
 */
const createApplication = asyncHandler(async (req, res) => {
  const application = await applicationService.createApplication(
    req.user.id,
    req.body
  );

  return res.status(201).json(
    new ApiResponse(201, "Application submitted successfully", {
      application,
    })
  );
});

/**
 * Controller for fetching candidate's submitted applications
 * GET /api/v1/applications/me
 */
const getMyApplications = asyncHandler(async (req, res) => {
  const result = await applicationService.getMyApplications(
    req.user.id,
    req.query
  );

  return res.status(200).json(
    new ApiResponse(200, "Applications fetched successfully", result)
  );
});

/**
 * Controller for recruiters to fetch applications submitted for a job posting
 * GET /api/v1/applications/job/:jobId
 */
const getJobApplications = asyncHandler(async (req, res) => {
  const result = await applicationService.getJobApplications(
    req.user.id,
    req.params.jobId,
    req.query
  );

  return res.status(200).json(
    new ApiResponse(200, "Job applications fetched successfully", result)
  );
});

/**
 * Controller for recruiters to update an application status
 * PATCH /api/v1/applications/:id/status
 */
const updateApplicationStatus = asyncHandler(async (req, res) => {
  const updatedApplication =
    await applicationService.updateApplicationStatus(
      req.user.id,
      req.params.id,
      req.body.status
    );

  return res.status(200).json(
    new ApiResponse(200, "Application status updated successfully", {
      application: updatedApplication,
    })
  );
});

/**
 * Controller for candidates or recruiters to fetch a single application by ID
 * GET /api/v1/applications/:id
 */
const getApplicationById = asyncHandler(async (req, res) => {
  const application = await applicationService.getApplicationById(
    req.user.id,
    req.user.role,
    req.params.id
  );

  return res.status(200).json(
    new ApiResponse(200, "Application details fetched successfully", {
      application,
    })
  );
});

/**
 * Controller for recruiters to update recruiter notes on an application
 * PATCH /api/v1/applications/:id/notes
 */
const updateRecruiterNotes = asyncHandler(async (req, res) => {
  const updatedApplication = await applicationService.updateRecruiterNotes(
    req.user.id,
    req.params.id,
    req.body.notes
  );

  return res.status(200).json(
    new ApiResponse(200, "Recruiter notes updated successfully", {
      application: updatedApplication,
    })
  );
});

export {
  createApplication,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
  getApplicationById,
  updateRecruiterNotes,
};
