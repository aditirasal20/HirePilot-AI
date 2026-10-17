/**
 * @file resume-ai.validation.js
 */
import { z } from "zod";

export const resumeIdParamSchema = z.object({
  resumeId: z
    .string({
      required_error: "Resume ID is required in URL path.",
      invalid_type_error: "Resume ID must be a string.",
    })
    .cuid("Invalid Resume ID format."),
});
