import { Router } from "express";

import {
  register,
  login,
  refresh,
  logout,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
} from "./auth.controller.js";

import validate from "../../middleware/validate.middleware.js";

import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
} from "./auth.validation.js";

import authenticate, { optionalAuthenticate } from "../../middleware/auth.middleware.js";

import authorize from "../../middleware/authorize.middleware.js";

import { authRateLimiter } from "../../middleware/rateLimit.middleware.js";

const router = Router();

router.post(
  "/register",
  authRateLimiter,
  validate(registerSchema),
  register
);

router.post(
  "/login",
  authRateLimiter,
  validate(loginSchema),
  login
);

router.post(
  "/refresh",
  authRateLimiter,
  refresh
);

router.post(
  "/logout",
  optionalAuthenticate,
  logout
);

router.post(
  "/forgot-password",
  authRateLimiter,
  validate(forgotPasswordSchema),
  forgotPassword
);

router.post(
  "/reset-password",
  authRateLimiter,
  validate(resetPasswordSchema),
  resetPassword
);

router.post(
  "/verify-email",
  authRateLimiter,
  validate(verifyEmailSchema),
  verifyEmail
);

router.post(
  "/resend-verification",
  authRateLimiter,
  validate(resendVerificationSchema),
  resendVerification
);

router.patch(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  changePassword
);

router.get(
  "/me",
  authenticate,
  (req, res) => {
    res.json({
      success: true,
      user: req.user,
    });
  }
);

router.get(
  "/recruiter-only",
  authenticate,
  authorize("RECRUITER"),
  (req, res) => {
    res.json({
      success: true,
      message: "Welcome Recruiter!",
    });
  }
);

export default router;
