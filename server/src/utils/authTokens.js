import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const signToken = (payload, secret, expiresIn) =>
  jwt.sign(payload, secret, { expiresIn });

const verifyToken = (token, secret) => jwt.verify(token, secret);

const verificationSecret =
  env.EMAIL_VERIFICATION_TOKEN_SECRET || env.ACCESS_TOKEN_SECRET;

const resetSecret = env.PASSWORD_RESET_TOKEN_SECRET || env.ACCESS_TOKEN_SECRET;

export const generateEmailVerificationToken = (payload) =>
  signToken(
    { ...payload, purpose: "email-verification" },
    verificationSecret,
    env.EMAIL_VERIFICATION_TOKEN_EXPIRY
  );

export const verifyEmailVerificationToken = (token) => {
  const payload = verifyToken(token, verificationSecret);

  if (payload?.purpose !== "email-verification") {
    throw new Error("Invalid email verification token");
  }

  return payload;
};

export const generatePasswordResetToken = (payload) =>
  signToken(
    { ...payload, purpose: "password-reset" },
    resetSecret,
    env.PASSWORD_RESET_TOKEN_EXPIRY
  );

export const verifyPasswordResetToken = (token) => {
  const payload = verifyToken(token, resetSecret);

  if (payload?.purpose !== "password-reset") {
    throw new Error("Invalid password reset token");
  }

  return payload;
};
