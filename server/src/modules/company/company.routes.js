import { Router } from "express";

import authenticate from "../../middleware/auth.middleware.js";
import authorize from "../../middleware/authorize.middleware.js";
import validate from "../../middleware/validate.middleware.js";

import {
  createCompanySchema,
  updateCompanySchema,
} from "./company.validation.js";

import {
  createCompany,
  getMyCompany,
  updateCompany,
} from "./company.controller.js";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("RECRUITER"),
  validate(createCompanySchema),
  createCompany
);

router.get(
  "/me",
  authenticate,
  authorize("RECRUITER"),
  getMyCompany
);

router.patch(
  "/:id",
  authenticate,
  authorize("RECRUITER"),
  validate(updateCompanySchema),
  updateCompany
);

export default router;