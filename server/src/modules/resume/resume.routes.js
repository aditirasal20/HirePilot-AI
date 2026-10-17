import { Router } from "express";

import authenticate from "../../middleware/auth.middleware.js";
import authorize from "../../middleware/authorize.middleware.js";
import validate from "../../middleware/validate.middleware.js";
import {
  uploadSinglePdf,
  validatePdfMagicBytes,
} from "../../middleware/upload.middleware.js";

import {
  createResumeSchema,
  updateResumeSchema,
  resumeIdParamSchema,
} from "./resume.validation.js";

import {
  createResume,
  getMyResumes,
  getResumeById,
  updateResume,
  setDefaultResume,
  deleteResume,
} from "./resume.controller.js";

const router = Router();

/**
 * @route   POST /api/v1/resumes
 * @desc    Upload a new resume PDF
 * @access  Private (CANDIDATE only)
 */
router.post(
  "/",
  authenticate,
  authorize("CANDIDATE"),
  uploadSinglePdf,
  validatePdfMagicBytes,
  validate(createResumeSchema),
  createResume
);

/**
 * @route   GET /api/v1/resumes
 * @desc    Get all candidate resumes
 * @access  Private (CANDIDATE only)
 */
router.get(
  "/",
  authenticate,
  authorize("CANDIDATE"),
  getMyResumes
);

/**
 * @route   GET /api/v1/resumes/:id
 * @desc    Get single resume details by ID
 * @access  Private (CANDIDATE only)
 */
router.get(
  "/:id",
  authenticate,
  authorize("CANDIDATE"),
  validate(resumeIdParamSchema, "params"),
  getResumeById
);

/**
 * @route   PATCH /api/v1/resumes/:id/default
 * @desc    Set a resume as default for candidate
 * @access  Private (CANDIDATE only)
 */
router.patch(
  "/:id/default",
  authenticate,
  authorize("CANDIDATE"),
  validate(resumeIdParamSchema, "params"),
  setDefaultResume
);

/**
 * @route   PATCH /api/v1/resumes/:id
 * @desc    Update resume metadata (e.g. title)
 * @access  Private (CANDIDATE only)
 */
router.patch(
  "/:id",
  authenticate,
  authorize("CANDIDATE"),
  validate(resumeIdParamSchema, "params"),
  validate(updateResumeSchema),
  updateResume
);

/**
 * @route   DELETE /api/v1/resumes/:id
 * @desc    Delete a resume record
 * @access  Private (CANDIDATE only)
 */
router.delete(
  "/:id",
  authenticate,
  authorize("CANDIDATE"),
  validate(resumeIdParamSchema, "params"),
  deleteResume
);

export default router;
