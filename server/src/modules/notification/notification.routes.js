import { Router } from "express";

import authenticate from "../../middleware/auth.middleware.js";
import validate from "../../middleware/validate.middleware.js";

import {
  getNotificationsQuerySchema,
  notificationIdParamSchema,
} from "./notification.validation.js";

import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "./notification.controller.js";

const router = Router();

/**
 * @route   GET /api/v1/notifications
 * @desc    Get paginated notifications for authenticated user
 * @access  Private (Authenticated users)
 */
router.get(
  "/",
  authenticate,
  validate(getNotificationsQuerySchema, "query"),
  getNotifications
);

/**
 * @route   GET /api/v1/notifications/unread-count
 * @desc    Get total unread notification count
 * @access  Private (Authenticated users)
 */
router.get(
  "/unread-count",
  authenticate,
  getUnreadCount
);

/**
 * @route   PATCH /api/v1/notifications/read-all
 * @desc    Mark all unread notifications as read
 * @access  Private (Authenticated users)
 */
router.patch(
  "/read-all",
  authenticate,
  markAllAsRead
);

/**
 * @route   PATCH /api/v1/notifications/:id/read
 * @desc    Mark a single notification as read
 * @access  Private (Authenticated users)
 */
router.patch(
  "/:id/read",
  authenticate,
  validate(notificationIdParamSchema, "params"),
  markAsRead
);

/**
 * @route   DELETE /api/v1/notifications/:id
 * @desc    Delete a notification
 * @access  Private (Authenticated users)
 */
router.delete(
  "/:id",
  authenticate,
  validate(notificationIdParamSchema, "params"),
  deleteNotification
);

export default router;
