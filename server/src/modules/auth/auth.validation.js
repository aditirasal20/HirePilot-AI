import { z } from "zod";
const email = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address.");
const password = z
  .string()
  .min(8, "Use at least 8 characters.")
  .refine(
    (value) => Buffer.byteLength(value, "utf8") <= 72,
    "Use a password of 72 bytes or fewer.",
  );
export const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Enter at least 3 characters.")
    .max(100, "Use 100 characters or fewer."),
  email,
  password,
  role: z.enum(["CANDIDATE", "RECRUITER"]),
});
export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password.").max(1024),
});
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: password,
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from the current password",
    path: ["newPassword"],
  });
export const forgotPasswordSchema = z.object({ email });
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});
export const resendVerificationSchema = z.object({ email });
