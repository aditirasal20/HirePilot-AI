import { z } from "zod";

const optionalString = (max, message) =>
  z
    .string()
    .trim()
    .max(max, message)
    .nullable()
    .optional();

const optionalUrl = (label) =>
  z
    .string()
    .trim()
    .url(`Invalid ${label} URL`)
    .nullable()
    .optional();

const optionalInt = (message) =>
  z.coerce
    .number(message)
    .int(message)
    .min(0, message)
    .nullable()
    .optional();

const normalizeProfile = (data) => {
  const normalized = { ...data };

  for (const key of Object.keys(normalized)) {
    if (normalized[key] === "") {
      normalized[key] = null;
    }
  }

  return normalized;
};

export const updateCandidateProfileSchema = z
  .object({
    phone: optionalString(
      20,
      "Phone number cannot exceed 20 characters"
    ),
    bio: optionalString(
      1000,
      "Bio cannot exceed 1000 characters"
    ),
    location: optionalString(
      100,
      "Location cannot exceed 100 characters"
    ),
    currentPosition: optionalString(
      100,
      "Current position cannot exceed 100 characters"
    ),
    yearsOfExperience: optionalInt(
      "Years of experience must be a non-negative whole number"
    ),
    expectedSalary: optionalInt(
      "Expected salary must be a non-negative whole number"
    ),
    githubUrl: optionalUrl("GitHub"),
    linkedinUrl: optionalUrl("LinkedIn"),
    portfolioUrl: optionalUrl("Portfolio"),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required to update your profile",
  })
  .transform(normalizeProfile);
