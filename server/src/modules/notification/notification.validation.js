import { z } from "zod";
import { NotificationType } from "@prisma/client";

/**
 * Validation schema for listing user notifications (GET /api/v1/notifications)
 */
export const getNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  isRead: z
    .preprocess((val) => {
      if (val === "true") return true;
      if (val === "false") return false;
      return val;
    }, z.boolean().optional())
    .optional(),
  type: z.nativeEnum(NotificationType).optional(),
});

/**
 * Validation schema for CUID path parameters (GET/PATCH/DELETE /api/v1/notifications/:id)
 */
export const notificationIdParamSchema = z.object({
  id: z
    .string({
      required_error: "Notification ID is required in URL path.",
      invalid_type_error: "Notification ID must be a string.",
    })
    .cuid("Invalid Notification ID format."),
});

/**
 * Internal validation schema for creating a notification
 */
export const createNotificationSchema = z.object({
  userId: z
    .string({
      required_error: "User ID is required.",
    })
    .cuid("Invalid User ID format."),
  title: z
    .string({
      required_error: "Notification title is required.",
    })
    .trim()
    .min(1, "Title cannot be empty.")
    .max(200, "Title cannot exceed 200 characters."),
  message: z
    .string({
      required_error: "Notification message is required.",
    })
    .trim()
    .min(1, "Message cannot be empty.")
    .max(1000, "Message cannot exceed 1000 characters."),
  type: z.nativeEnum(NotificationType, {
    required_error: "Notification type is required.",
  }),
  entityId: z.string().trim().optional(),
  entityType: z.string().trim().optional(),
  metadata: z.record(z.any()).optional(),
});
