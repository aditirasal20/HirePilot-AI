import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import dashboardService from "./dashboard.service.js";

/**
 * Controller for Candidate Dashboard
 * GET /api/v1/dashboard/candidate
 */
const getCandidateDashboard = asyncHandler(async (req, res) => {
  const result = await dashboardService.getCandidateDashboard(req.user.id);

  return res.status(200).json(
    new ApiResponse(200, "Candidate dashboard fetched successfully", result)
  );
});

/**
 * Controller for Recruiter Dashboard
 * GET /api/v1/dashboard/recruiter
 */
const getRecruiterDashboard = asyncHandler(async (req, res) => {
  const result = await dashboardService.getRecruiterDashboard(req.user.id);

  return res.status(200).json(
    new ApiResponse(200, "Recruiter dashboard fetched successfully", result)
  );
});

export { getCandidateDashboard, getRecruiterDashboard };
