import { Router } from "express";

import authenticate, {
  optionalAuthenticate,
} from "../../middleware/auth.middleware.js";
import authorize from "../../middleware/authorize.middleware.js";
import validate from "../../middleware/validate.middleware.js";

import {
  createJobSchema,
  updateJobSchema,
  updateJobStatusSchema,
  getPublicJobsQuerySchema,
  getMyJobsQuerySchema,
} from "./job.validation.js";

import {
  createJob,
  getMyJobs,
  getJobById,
  updateJob,
  updateJobStatus,
  getPublicJobs,
} from "./job.controller.js";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("RECRUITER"),
  validate(createJobSchema),
  createJob
);

router.get(
  "/me",
  authenticate,
  authorize("RECRUITER"),
  validate(getMyJobsQuerySchema, "query"),
  getMyJobs
);

router.get(
  "/",
  validate(getPublicJobsQuerySchema, "query"),
  getPublicJobs
);

router.get(
  "/:id",
  optionalAuthenticate,
  getJobById
);

router.patch(
  "/:id",
  authenticate,
  authorize("RECRUITER"),
  validate(updateJobSchema),
  updateJob
);

router.patch(
  "/:id/status",
  authenticate,
  authorize("RECRUITER"),
  validate(updateJobStatusSchema),
  updateJobStatus
);

export default router;