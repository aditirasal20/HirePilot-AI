import prisma from "../../lib/prisma.js";

/**
 * Repository layer for Notification Module
 * Handles Prisma queries, projections, index queries, and bulk updates strictly.
 */
class NotificationRepository {
  /**
   * Standard selection projection for Notification entities
   */
  get standardNotificationSelect() {
    return {
      id: true,
      userId: true,
      title: true,
      message: true,
      type: true,
      entityId: true,
      entityType: true,
      isRead: true,
      metadata: true,
      createdAt: true,
      updatedAt: true,
    };
  }

  /**
   * Create a new notification record
   * @param {Object} data - { userId, title, message, type, entityId, entityType, metadata }
   */
  async create(data) {
    return prisma.notification.create({
      data,
      select: this.standardNotificationSelect,
    });
  }

  /**
   * Find paginated notifications for a user
   * @param {string} userId - User CUID
   * @param {Object} queryParams - { page, limit, isRead, type }
   */
  async findByUser(userId, { page = 1, limit = 10, isRead, type }) {
    const skip = (page - 1) * limit;

    const where = {
      userId,
    };

    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    if (type) {
      where.type = type;
    }

    const [notifications, totalNotifications] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        select: this.standardNotificationSelect,
      }),
      prisma.notification.count({
        where,
      }),
    ]);

    return { notifications, totalNotifications, page, limit };
  }

  /**
   * Find unread notifications count for a user
   * @param {string} userId - User CUID
   */
  async findUnreadCount(userId) {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  /**
   * Find notification by ID and verify user ownership
   * @param {string} id - Notification CUID
   * @param {string} userId - User CUID
   */
  async findByIdAndUser(id, userId) {
    return prisma.notification.findFirst({
      where: {
        id,
        userId,
      },
      select: this.standardNotificationSelect,
    });
  }

  /**
   * Mark a single notification as read
   * @param {string} id - Notification CUID
   * @param {string} userId - User CUID
   */
  async markRead(id, userId) {
    return prisma.notification.update({
      where: {
        id,
      },
      data: {
        isRead: true,
      },
      select: this.standardNotificationSelect,
    });
  }

  /**
   * Mark all unread notifications as read for a user
   * @param {string} userId - User CUID
   */
  async markAllRead(userId) {
    return prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }

  /**
   * Delete a single notification record
   * @param {string} id - Notification CUID
   * @param {string} userId - User CUID
   */
  async delete(id, userId) {
    return prisma.notification.delete({
      where: {
        id,
      },
      select: this.standardNotificationSelect,
    });
  }
}

export default new NotificationRepository();
