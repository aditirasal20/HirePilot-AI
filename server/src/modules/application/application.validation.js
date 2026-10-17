import { z } from "zod";
import { ApplicationStatus } from "@prisma/client";

/**
 * Validation schema for creating a new Job Application (POST /api/v1/applications)
 */
export const createApplicationSchema = z.object({
  jobId: z
    .string({
      required_error: "Job ID is required.",
      invalid_type_error: "Job ID must be a string.",
    })
    .cuid("Invalid Job ID format."),

  resumeId: z
    .string({
      required_error: "Resume ID is required.",
      invalid_type_error: "Resume ID must be a string.",
    })
    .cuid("Invalid Resume ID format."),
});

/**
 * Validation schema for fetching candidate's applications (GET /api/v1/applications/me)
 */
export const getMyApplicationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.nativeEnum(ApplicationStatus).optional(),
});

/**
 * Validation schema for URL path params when fetching job applications (GET /api/v1/applications/job/:jobId)
 */
export const getJobApplicationsParamsSchema = z.object({
  jobId: z
    .string({
      required_error: "Job ID is required in URL path.",
      invalid_type_error: "Job ID must be a string.",
    })
    .cuid("Invalid Job ID format."),
});

/**
 * Validation schema for query parameters when fetching job applications (GET /api/v1/applications/job/:jobId)
 */
export const getJobApplicationsQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  minScore: z.coerce.number().min(0).max(100).optional(),
  sort: z.enum(["latest", "oldest", "score"]).optional().default("latest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.nativeEnum(ApplicationStatus).optional(),
});

/**
 * Validation schema for URL path params when fetching a single application (GET /api/v1/applications/:id)
 */
export const getApplicationByIdParamsSchema = z.object({
  id: z
    .string({
      required_error: "Application ID is required in URL path.",
      invalid_type_error: "Application ID must be a string.",
    })
    .cuid("Invalid Application ID format."),
});

/**
 * Validation schema for URL path params when updating application status (PATCH /api/v1/applications/:id/status)
 */
export const updateApplicationStatusParamsSchema = z.object({
  id: z
    .string({
      required_error: "Application ID is required in URL path.",
      invalid_type_error: "Application ID must be a string.",
    })
    .cuid("Invalid Application ID format."),
});

/**
 * Validation schema for payload when updating application status (PATCH /api/v1/applications/:id/status)
 */
export const updateApplicationStatusSchema = z.object({
  status: z.nativeEnum(ApplicationStatus, {
    required_error: "Status is required.",
    invalid_type_error: "Invalid application status provided.",
  }),
});

/**
 * Validation schema for URL path params when updating recruiter notes (PATCH /api/v1/applications/:id/notes)
 */
export const updateApplicationNotesParamsSchema = z.object({
  id: z
    .string({
      required_error: "Application ID is required in URL path.",
      invalid_type_error: "Application ID must be a string.",
    })
    .cuid("Invalid Application ID format."),
});

/**
 * Validation schema for payload when updating recruiter notes (PATCH /api/v1/applications/:id/notes)
 */
export const updateApplicationNotesSchema = z.object({
  notes: z
    .string({
      invalid_type_error: "Notes must be a string.",
    })
    .trim()
    .max(2000, "Notes cannot exceed 2000 characters.")
    .optional(),
});
