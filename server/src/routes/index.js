import { Router } from "express";

import authRoutes from "../modules/auth/auth.routes.js";
import companyRoutes from "../modules/company/company.routes.js";
import jobRoutes from "../modules/job/job.routes.js";
import applicationRoutes from "../modules/application/application.routes.js";
import resumeRoutes from "../modules/resume/resume.routes.js";
import interviewRoutes from "../modules/interview/interview.routes.js";
import dashboardRoutes from "../modules/dashboard/dashboard.routes.js";
import notificationRoutes from "../modules/notification/notification.routes.js";
import jobMatchingRoutes from "../modules/job-matching/job-matching.routes.js"
import resumeAiRoutes from "../modules/resume-ai/resume-ai.routes.js"
import candidateProfileRoutes from "../modules/candidate-profile/candidate-profile.routes.js"

const router = Router();

router.use("/auth", authRoutes);
router.use("/companies", companyRoutes);
router.use("/jobs", jobRoutes);
router.use("/applications", applicationRoutes);
router.use("/resumes", resumeRoutes);
router.use("/interviews", interviewRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/notifications", notificationRoutes);
router.use("/job-matching", jobMatchingRoutes);
router.use("/resume-ai", resumeAiRoutes);
router.use("/candidate", candidateProfileRoutes);

export default router;