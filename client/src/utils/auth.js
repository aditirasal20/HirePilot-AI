import { z } from "zod";
import { ROLES, getDashboardPath } from "../types/roles";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address.");
const password = z
  .string()
  .min(8, "Use at least 8 characters.")
  .refine(
    (value) => new TextEncoder().encode(value).length <= 72,
    "Use a password of 72 bytes or fewer.",
  );
export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password."),
});
export const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Enter at least 3 characters.")
    .max(100, "Use 100 characters or fewer."),
  email,
  password,
  role: z.enum([ROLES.CANDIDATE, ROLES.RECRUITER]),
});
export const emailSchema = z.object({ email });
export const resetSchema = z
  .object({ password, confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  });
export function getFieldErrors(result) {
  if (result.success) return {};
  return Object.fromEntries(
    result.error.issues.map((issue) => [issue.path[0], issue.message]),
  );
}
export function getAuthDestination(role, from) {
  const fallback = getDashboardPath(role);
  const pathname = typeof from === "string" ? from : from?.pathname;
  if (
    !pathname ||
    !pathname.startsWith("/") ||
    pathname.startsWith("//") ||
    /[\\\r\n]/.test(pathname)
  )
    return fallback;
  const prefix = fallback.split("/")[1];
  if (pathname !== `/${prefix}` && !pathname.startsWith(`/${prefix}/`))
    return fallback;
  const url = new URL(pathname, "https://hirepilot.local");
  if (url.pathname !== `/${prefix}` && !url.pathname.startsWith(`/${prefix}/`))
    return fallback;
  return typeof from === "string"
    ? pathname
    : `${pathname}${from.search || ""}${from.hash || ""}`;
}
