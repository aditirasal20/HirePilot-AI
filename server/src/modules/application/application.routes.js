import { Router } from "express";

import authenticate from "../../middleware/auth.middleware.js";
import authorize from "../../middleware/authorize.middleware.js";
import validate from "../../middleware/validate.middleware.js";

import {
  createApplicationSchema,
  getMyApplicationsQuerySchema,
  getJobApplicationsParamsSchema,
  getJobApplicationsQuerySchema,
  getApplicationByIdParamsSchema,
  updateApplicationStatusParamsSchema,
  updateApplicationStatusSchema,
  updateApplicationNotesParamsSchema,
  updateApplicationNotesSchema,
} from "./application.validation.js";
import {
  createApplication,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
  getApplicationById,
  updateRecruiterNotes,
} from "./application.controller.js";

const router = Router();

/**
 * @route   POST /api/v1/applications
 * @desc    Submit a job application
 * @access  Private (CANDIDATE only)
 */
router.post(
  "/",
  authenticate,
  authorize("CANDIDATE"),
  validate(createApplicationSchema),
  createApplication
);

/**
 * @route   GET /api/v1/applications/me
 * @desc    Get candidate's submitted applications
 * @access  Private (CANDIDATE only)
 */
router.get(
  "/me",
  authenticate,
  authorize("CANDIDATE"),
  validate(getMyApplicationsQuerySchema, "query"),
  getMyApplications
);

/**
 * @route   GET /api/v1/applications/job/:jobId
 * @desc    Get applications submitted for a job posting
 * @access  Private (RECRUITER only)
 */
router.get(
  "/job/:jobId",
  authenticate,
  authorize("RECRUITER"),
  validate(getJobApplicationsParamsSchema, "params"),
  validate(getJobApplicationsQuerySchema, "query"),
  getJobApplications
);

/**
 * @route   PATCH /api/v1/applications/:id/status
 * @desc    Update application status (state machine transitions)
 * @access  Private (RECRUITER only)
 */
router.patch(
  "/:id/status",
  authenticate,
  authorize("RECRUITER"),
  validate(updateApplicationStatusParamsSchema, "params"),
  validate(updateApplicationStatusSchema),
  updateApplicationStatus
);

/**
 * @route   GET /api/v1/applications/:id
 * @desc    Get detailed application by ID (Owner Candidate or Recruiter only)
 * @access  Private (CANDIDATE or RECRUITER)
 */
router.get(
  "/:id",
  authenticate,
  authorize("CANDIDATE", "RECRUITER"),
  validate(getApplicationByIdParamsSchema, "params"),
  getApplicationById
);

/**
 * @route   PATCH /api/v1/applications/:id/notes
 * @desc    Update recruiter notes on an application
 * @access  Private (RECRUITER only)
 */
router.patch(
  "/:id/notes",
  authenticate,
  authorize("RECRUITER"),
  validate(updateApplicationNotesParamsSchema, "params"),
  validate(updateApplicationNotesSchema),
  updateRecruiterNotes
);

export default router;
