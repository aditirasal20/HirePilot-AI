import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import notificationService from "./notification.service.js";

/**
 * Controller for getting paginated user notifications
 * GET /api/v1/notifications
 */
const getNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getUserNotifications(
    req.user.id,
    req.query
  );

  return res.status(200).json(
    new ApiResponse(200, "Notifications fetched successfully", result)
  );
});

/**
 * Controller for getting unread notification count
 * GET /api/v1/notifications/unread-count
 */
const getUnreadCount = asyncHandler(async (req, res) => {
  const result = await notificationService.getUnreadCount(req.user.id);

  return res.status(200).json(
    new ApiResponse(200, "Unread count fetched successfully", result)
  );
});

/**
 * Controller for marking a single notification as read
 * PATCH /api/v1/notifications/:id/read
 */
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markNotificationAsRead(
    req.user.id,
    req.params.id
  );

  return res.status(200).json(
    new ApiResponse(200, "Notification marked as read", {
      notification,
    })
  );
});

/**
 * Controller for marking all notifications as read
 * PATCH /api/v1/notifications/read-all
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllNotificationsAsRead(
    req.user.id
  );

  return res.status(200).json(
    new ApiResponse(200, "All notifications marked as read", result)
  );
});

/**
 * Controller for deleting a notification
 * DELETE /api/v1/notifications/:id
 */
const deleteNotification = asyncHandler(async (req, res) => {
  const result = await notificationService.deleteNotification(
    req.user.id,
    req.params.id
  );

  return res.status(200).json(
    new ApiResponse(200, "Notification deleted successfully", result)
  );
});

export {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
