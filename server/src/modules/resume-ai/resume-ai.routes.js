/**
 * @file resume-ai.routes.js
 */
import { Router } from "express";
import authenticate from "../../middleware/auth.middleware.js";
import authorize from "../../middleware/authorize.middleware.js";
import validate from "../../middleware/validate.middleware.js";
import { resumeIdParamSchema } from "./resume-ai.validation.js";
import resumeAiController from "./resume-ai.controller.js";

const router = Router();

router.use(authenticate, authorize("CANDIDATE"));

router.post(
  "/:resumeId/analyze",
  validate(resumeIdParamSchema, "params"),
  resumeAiController.startAnalysis
);

router.get(
  "/:resumeId/analysis",
  validate(resumeIdParamSchema, "params"),
  resumeAiController.getAnalysis
);

export default router;
