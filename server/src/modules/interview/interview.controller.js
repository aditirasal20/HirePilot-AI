import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import interviewService from "./interview.service.js";

/**
 * Controller for scheduling a new interview (Recruiter only)
 * POST /api/v1/interviews
 */
const scheduleInterview = asyncHandler(async (req, res) => {
  const interview = await interviewService.scheduleInterview(
    req.user.id,
    req.body
  );

  return res.status(201).json(
    new ApiResponse(201, "Interview scheduled successfully", {
      interview,
    })
  );
});

/**
 * Controller for listing interviews (Role-aware: Candidate / Recruiter)
 * GET /api/v1/interviews
 */
const getInterviews = asyncHandler(async (req, res) => {
  const result = await interviewService.getInterviews(
    req.user.id,
    req.user.role,
    req.query
  );

  return res.status(200).json(
    new ApiResponse(200, "Interviews fetched successfully", result)
  );
});

/**
 * Controller for fetching a single interview by ID
 * GET /api/v1/interviews/:id
 */
const getInterviewById = asyncHandler(async (req, res) => {
  const interview = await interviewService.getInterviewById(
    req.user.id,
    req.user.role,
    req.params.id
  );

  return res.status(200).json(
    new ApiResponse(200, "Interview details fetched successfully", {
      interview,
    })
  );
});

/**
 * Controller for updating interview details & rescheduling
 * PATCH /api/v1/interviews/:id
 */
const updateInterview = asyncHandler(async (req, res) => {
  const updatedInterview = await interviewService.updateInterview(
    req.user.id,
    req.params.id,
    req.body
  );

  return res.status(200).json(
    new ApiResponse(200, "Interview details updated successfully", {
      interview: updatedInterview,
    })
  );
});

/**
 * Controller for updating interview status
 * PATCH /api/v1/interviews/:id/status
 */
const updateInterviewStatus = asyncHandler(async (req, res) => {
  const updatedInterview = await interviewService.updateInterviewStatus(
    req.user.id,
    req.params.id,
    req.body
  );

  return res.status(200).json(
    new ApiResponse(200, "Interview status updated successfully", {
      interview: updatedInterview,
    })
  );
});

/**
 * Controller for cancelling an interview
 * DELETE /api/v1/interviews/:id
 */
const cancelInterview = asyncHandler(async (req, res) => {
  const cancelledInterview = await interviewService.cancelInterview(
    req.user.id,
    req.params.id,
    req.body.cancelReason
  );

  return res.status(200).json(
    new ApiResponse(200, "Interview cancelled successfully", {
      interview: cancelledInterview,
    })
  );
});

export {
  scheduleInterview,
  getInterviews,
  getInterviewById,
  updateInterview,
  updateInterviewStatus,
  cancelInterview,
};
