import { Router } from "express";

import authenticate from "../../middleware/auth.middleware.js";
import authorize from "../../middleware/authorize.middleware.js";
import validate from "../../middleware/validate.middleware.js";

import { updateCandidateProfileSchema } from "./candidate-profile.validation.js";

import {
  getProfile,
  updateProfile,
} from "./candidate-profile.controller.js";

const router = Router();

/**
 * @route   GET /api/v1/candidate/profile
 * @desc    Get the authenticated candidate's profile
 * @access  Private (CANDIDATE only)
 */
router.get(
  "/profile",
  authenticate,
  authorize("CANDIDATE"),
  getProfile
);

/**
 * @route   PATCH /api/v1/candidate/profile
 * @desc    Update the authenticated candidate's profile
 * @access  Private (CANDIDATE only)
 */
router.patch(
  "/profile",
  authenticate,
  authorize("CANDIDATE"),
  validate(updateCandidateProfileSchema),
  updateProfile
);

export default router;
