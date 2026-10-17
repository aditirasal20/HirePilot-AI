import { z } from "zod";

/**
 * Validation schema for creating a new Resume metadata record (POST /api/v1/resumes)
 */
export const createResumeSchema = z.object({
  title: z
    .string({
      required_error: "Resume title is required.",
      invalid_type_error: "Resume title must be a string.",
    })
    .trim()
    .min(3, "Resume title must be at least 3 characters long.")
    .max(100, "Resume title cannot exceed 100 characters."),
});

/**
 * Validation schema for updating Resume metadata (PATCH /api/v1/resumes/:id)
 */
export const updateResumeSchema = z.object({
  title: z
    .string({
      invalid_type_error: "Resume title must be a string.",
    })
    .trim()
    .min(3, "Resume title must be at least 3 characters long.")
    .max(100, "Resume title cannot exceed 100 characters.")
    .optional(),
});

/**
 * Validation schema for CUID path parameters (GET/PATCH/DELETE /api/v1/resumes/:id)
 */
export const resumeIdParamSchema = z.object({
  id: z
    .string({
      required_error: "Resume ID is required in URL path.",
      invalid_type_error: "Resume ID must be a string.",
    })
    .cuid("Invalid Resume ID format."),
});
