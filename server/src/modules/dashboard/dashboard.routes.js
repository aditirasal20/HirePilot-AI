import { Router } from "express";

import authenticate from "../../middleware/auth.middleware.js";
import authorize from "../../middleware/authorize.middleware.js";
import validate from "../../middleware/validate.middleware.js";

import { dashboardQuerySchema } from "./dashboard.validation.js";

import {
  getCandidateDashboard,
  getRecruiterDashboard,
} from "./dashboard.controller.js";

const router = Router();

/**
 * @route   GET /api/v1/dashboard/candidate
 * @desc    Fetch Candidate Dashboard metrics, stats, & recommendations
 * @access  Private (CANDIDATE only)
 */
router.get(
  "/candidate",
  authenticate,
  authorize("CANDIDATE"),
  validate(dashboardQuerySchema, "query"),
  getCandidateDashboard
);

/**
 * @route   GET /api/v1/dashboard/recruiter
 * @desc    Fetch Recruiter Dashboard metrics, stats, & top candidates
 * @access  Private (RECRUITER only)
 */
router.get(
  "/recruiter",
  authenticate,
  authorize("RECRUITER"),
  validate(dashboardQuerySchema, "query"),
  getRecruiterDashboard
);

export default router;
