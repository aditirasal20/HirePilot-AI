import { z } from "zod";

/**
 * Validation schema for dashboard optional query parameters
 */
export const dashboardQuerySchema = z.object({
  timezone: z
    .string({
      invalid_type_error: "Timezone must be a string.",
    })
    .trim()
    .optional(),
});
