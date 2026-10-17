/**
 * @file job-matching.routes.js
 */
import { Router } from "express";
import authenticate from "../../middleware/auth.middleware.js";
import authorize from "../../middleware/authorize.middleware.js";
import validate from "../../middleware/validate.middleware.js";
import jobMatchingController from "./job-matching.controller.js";
import {
  analyzeJobMatchSchema,
  getJobMatchReportSchema,
  deleteJobMatchSchema,
} from "./job-matching.validation.js";

const router = Router();

router.use(authenticate, authorize("CANDIDATE"));

// Queue Analysis
router.post(
  "/:jobId/analyze",
  validate(analyzeJobMatchSchema.params, "params"),
  validate(analyzeJobMatchSchema.body, "body"),
  jobMatchingController.analyzeJob
);

// Get Report
router.get(
  "/:jobId/report",
  validate(getJobMatchReportSchema.params, "params"),
  validate(getJobMatchReportSchema.query, "query"),
  jobMatchingController.getReport
);

// Get My Matches
router.get("/", jobMatchingController.getMyMatches);

// Delete Match
router.delete(
  "/:matchId",
  validate(deleteJobMatchSchema.params, "params"),
  jobMatchingController.deleteMatch
);

export default router;
