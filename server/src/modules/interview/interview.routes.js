import { Router } from "express";

import authenticate from "../../middleware/auth.middleware.js";
import authorize from "../../middleware/authorize.middleware.js";
import validate from "../../middleware/validate.middleware.js";

import {
  createInterviewSchema,
  getInterviewsQuerySchema,
  interviewIdParamSchema,
  updateInterviewSchema,
  updateInterviewStatusSchema,
} from "./interview.validation.js";

import {
  scheduleInterview,
  getInterviews,
  getInterviewById,
  updateInterview,
  updateInterviewStatus,
  cancelInterview,
} from "./interview.controller.js";

const router = Router();

/**
 * @route   POST /api/v1/interviews
 * @desc    Schedule a new interview
 * @access  Private (RECRUITER only)
 */
router.post(
  "/",
  authenticate,
  authorize("RECRUITER"),
  validate(createInterviewSchema),
  scheduleInterview
);

/**
 * @route   GET /api/v1/interviews
 * @desc    Get role-aware list of interviews
 * @access  Private (RECRUITER or CANDIDATE)
 */
router.get(
  "/",
  authenticate,
  authorize("CANDIDATE", "RECRUITER"),
  validate(getInterviewsQuerySchema, "query"),
  getInterviews
);

/**
 * @route   PATCH /api/v1/interviews/:id/status
 * @desc    Update interview status
 * @access  Private (RECRUITER only)
 */
router.patch(
  "/:id/status",
  authenticate,
  authorize("RECRUITER"),
  validate(interviewIdParamSchema, "params"),
  validate(updateInterviewStatusSchema),
  updateInterviewStatus
);

/**
 * @route   GET /api/v1/interviews/:id
 * @desc    Get single interview details by ID
 * @access  Private (RECRUITER or CANDIDATE owner)
 */
router.get(
  "/:id",
  authenticate,
  authorize("CANDIDATE", "RECRUITER"),
  validate(interviewIdParamSchema, "params"),
  getInterviewById
);

/**
 * @route   PATCH /api/v1/interviews/:id
 * @desc    Update interview details & reschedule
 * @access  Private (RECRUITER only)
 */
router.patch(
  "/:id",
  authenticate,
  authorize("RECRUITER"),
  validate(interviewIdParamSchema, "params"),
  validate(updateInterviewSchema),
  updateInterview
);

/**
 * @route   DELETE /api/v1/interviews/:id
 * @desc    Cancel an interview
 * @access  Private (RECRUITER only)
 */
router.delete(
  "/:id",
  authenticate,
  authorize("RECRUITER"),
  validate(interviewIdParamSchema, "params"),
  cancelInterview
);

export default router;