import { z } from "zod";
import { InterviewType, InterviewStatus } from "@prisma/client";

/**
 * Validation schema for scheduling a new interview (POST /api/v1/interviews)
 */
export const createInterviewSchema = z.object({
  applicationId: z
    .string({
      required_error: "Application ID is required.",
      invalid_type_error: "Application ID must be a string.",
    })
    .cuid("Invalid Application ID format."),

  interviewType: z
    .nativeEnum(InterviewType, {
      invalid_type_error: "Invalid interview type provided.",
    })
    .optional()
    .default(InterviewType.ONLINE),

  scheduledAt: z.coerce
    .date({
      required_error: "Scheduled date and time is required.",
      invalid_type_error: "Invalid date format.",
    })
    .refine((date) => date > new Date(), {
      message: "Scheduled interview date must be in the future.",
    }),

  durationMinutes: z.coerce
    .number({
      invalid_type_error: "Duration must be a number.",
    })
    .int()
    .min(15, "Duration must be at least 15 minutes.")
    .max(480, "Duration cannot exceed 480 minutes (8 hours).")
    .optional()
    .default(30),

  timezone: z
    .string({
      invalid_type_error: "Timezone must be a string.",
    })
    .trim()
    .min(1, "Timezone cannot be empty.")
    .optional()
    .default("Asia/Kolkata"),

  meetingLink: z
    .string({
      invalid_type_error: "Meeting link must be a string.",
    })
    .trim()
    .url("Meeting link must be a valid URL.")
    .optional()
    .or(z.literal("")),

  notes: z
    .string({
      invalid_type_error: "Notes must be a string.",
    })
    .trim()
    .max(1000, "Notes cannot exceed 1000 characters.")
    .optional(),
});

/**
 * Validation schema for query parameters when fetching interviews (GET /api/v1/interviews)
 */
export const getInterviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.nativeEnum(InterviewStatus).optional(),
  interviewType: z.nativeEnum(InterviewType).optional(),
});

/**
 * Validation schema for CUID path parameters (GET/PATCH/DELETE /api/v1/interviews/:id)
 */
export const interviewIdParamSchema = z.object({
  id: z
    .string({
      required_error: "Interview ID is required in URL path.",
      invalid_type_error: "Interview ID must be a string.",
    })
    .cuid("Invalid Interview ID format."),
});

/**
 * Validation schema for updating interview details (PATCH /api/v1/interviews/:id)
 */
export const updateInterviewSchema = z.object({
  interviewType: z.nativeEnum(InterviewType).optional(),

  scheduledAt: z.coerce
    .date()
    .refine((date) => date > new Date(), {
      message: "Scheduled interview date must be in the future.",
    })
    .optional(),

  durationMinutes: z.coerce
    .number()
    .int()
    .min(15)
    .max(480)
    .optional(),

  timezone: z.string().trim().min(1).optional(),

  meetingLink: z
    .string()
    .trim()
    .url("Meeting link must be a valid URL.")
    .optional()
    .or(z.literal("")),

  notes: z.string().trim().max(1000).optional(),
});

/**
 * Validation schema for updating interview status (PATCH /api/v1/interviews/:id/status)
 */
export const updateInterviewStatusSchema = z.object({
  status: z.nativeEnum(InterviewStatus, {
    required_error: "Status is required.",
    invalid_type_error: "Invalid interview status provided.",
  }),

  cancelReason: z
    .string()
    .trim()
    .max(500, "Cancel reason cannot exceed 500 characters.")
    .optional(),

  feedback: z
    .string()
    .trim()
    .max(2000, "Feedback cannot exceed 2000 characters.")
    .optional(),

  score: z.coerce
    .number()
    .min(0, "Score cannot be less than 0.")
    .max(100, "Score cannot exceed 100.")
    .optional(),
});
