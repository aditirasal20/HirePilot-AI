import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import resumeService from "./resume.service.js";

/**
 * Controller for uploading a new resume PDF
 * POST /api/v1/resumes
 */
const createResume = asyncHandler(async (req, res) => {
  const resume = await resumeService.createResume(
    req.user.id,
    req.file,
    req.body.title
  );

  return res.status(201).json(
    new ApiResponse(201, "Resume uploaded successfully", {
      resume,
    })
  );
});

/**
 * Controller for fetching all candidate resumes
 * GET /api/v1/resumes
 */
const getMyResumes = asyncHandler(async (req, res) => {
  const resumes = await resumeService.getMyResumes(req.user.id);

  return res.status(200).json(
    new ApiResponse(200, "Resumes fetched successfully", {
      resumes,
    })
  );
});

/**
 * Controller for fetching a single resume by ID
 * GET /api/v1/resumes/:id
 */
const getResumeById = asyncHandler(async (req, res) => {
  const resume = await resumeService.getResumeById(
    req.user.id,
    req.params.id
  );

  return res.status(200).json(
    new ApiResponse(200, "Resume details fetched successfully", {
      resume,
    })
  );
});

/**
 * Controller for updating resume metadata (e.g. title)
 * PATCH /api/v1/resumes/:id
 */
const updateResume = asyncHandler(async (req, res) => {
  const updatedResume = await resumeService.updateResume(
    req.user.id,
    req.params.id,
    req.body
  );

  return res.status(200).json(
    new ApiResponse(200, "Resume updated successfully", {
      resume: updatedResume,
    })
  );
});

/**
 * Controller for setting a resume as default
 * PATCH /api/v1/resumes/:id/default
 */
const setDefaultResume = asyncHandler(async (req, res) => {
  const updatedResume = await resumeService.setDefaultResume(
    req.user.id,
    req.params.id
  );

  return res.status(200).json(
    new ApiResponse(200, "Resume set as default successfully", {
      resume: updatedResume,
    })
  );
});

/**
 * Controller for deleting a resume
 * DELETE /api/v1/resumes/:id
 */
const deleteResume = asyncHandler(async (req, res) => {
  const result = await resumeService.deleteResume(
    req.user.id,
    req.params.id
  );

  return res.status(200).json(
    new ApiResponse(200, "Resume deleted successfully", result)
  );
});

export {
  createResume,
  getMyResumes,
  getResumeById,
  updateResume,
  setDefaultResume,
  deleteResume,
};
