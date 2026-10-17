import ApiError from "../../utils/ApiError.js";
import notificationRepository from "./notification.repository.js";
import { emitToUser } from "./notification.socket.js";
import notificationQueue from "./notification.queue.js";

/**
 * Service layer for Notification Module
 * Manages notification creation, ownership authorization, Socket.IO emissions, and BullMQ queue job dispatch.
 */
class NotificationService {
  /**
   * Create a new notification record, emit real-time socket event, and queue background jobs
   * @param {Object} data - { userId, title, message, type, entityId, entityType, metadata }
   */
  async createNotification(data) {
    const notification = await notificationRepository.create(data);

    // 1. Emit real-time Socket.IO notification event to target user
    emitToUser(data.userId, "notification:new", notification);

    // 2. Dispatch background notification job to BullMQ queue for asynchronous delivery
    notificationQueue.addJob("send-email-notification", {
      notificationId: notification.id,
      userId: data.userId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
    });

    return notification;
  }

  /**
   * Get paginated notifications for the authenticated user
   * @param {string} userId - Authenticated user CUID
   * @param {Object} query - { page, limit, isRead, type }
   */
  async getUserNotifications(userId, query = {}) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

    const { notifications, totalNotifications } =
      await notificationRepository.findByUser(userId, {
        page,
        limit,
        isRead: query.isRead,
        type: query.type,
      });

    const totalPages = Math.max(1, Math.ceil(totalNotifications / limit));

    return {
      notifications,
      pagination: {
        page,
        limit,
        totalNotifications,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Get total unread notification count for the authenticated user
   * @param {string} userId - Authenticated user CUID
   */
  async getUnreadCount(userId) {
    const unreadCount = await notificationRepository.findUnreadCount(userId);
    return { unreadCount };
  }

  /**
   * Mark a single notification as read
   * @param {string} userId - Authenticated user CUID
   * @param {string} notificationId - Target Notification CUID
   */
  async markNotificationAsRead(userId, notificationId) {
    const notification = await notificationRepository.findByIdAndUser(
      notificationId,
      userId
    );

    if (!notification) {
      throw new ApiError(404, "Notification not found.");
    }

    if (notification.isRead) {
      return notification;
    }

    const updatedNotification = await notificationRepository.markRead(
      notificationId,
      userId
    );

    // Emit real-time Socket.IO read event
    emitToUser(userId, "notification:read", {
      id: notificationId,
      isRead: true,
    });

    return updatedNotification;
  }

  /**
   * Mark all unread notifications as read for the authenticated user
   * @param {string} userId - Authenticated user CUID
   */
  async markAllNotificationsAsRead(userId) {
    await notificationRepository.markAllRead(userId);

    // Emit real-time Socket.IO all-read event
    emitToUser(userId, "notification:all-read", {
      userId,
      timestamp: new Date(),
    });

    return {
      message: "All notifications marked as read.",
    };
  }

  /**
   * Delete a notification record owned by the authenticated user
   * @param {string} userId - Authenticated user CUID
   * @param {string} notificationId - Target Notification CUID
   */
  async deleteNotification(userId, notificationId) {
    const notification = await notificationRepository.findByIdAndUser(
      notificationId,
      userId
    );

    if (!notification) {
      throw new ApiError(404, "Notification not found.");
    }

    await notificationRepository.delete(notificationId, userId);

    return {
      message: "Notification deleted successfully.",
      id: notificationId,
    };
  }
}

export default new NotificationService();
