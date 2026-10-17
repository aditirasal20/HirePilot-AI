import api from "./axios";
import { getErrorMessage } from "./auth.api";

const extractData = (response) => response?.data?.data ?? response?.data;

const handleError = (error) => {
    const message = getErrorMessage(error);
    const normalized = new Error(message);
    normalized.status = error?.response?.status;
    throw normalized;
};

export async function getNotifications(params = {}) {
    try {
        const response = await api.get("/notifications", { params });
        const data = extractData(response);
        return {
            notifications: data?.notifications ?? [],
            pagination: data?.pagination ?? {},
        };
    } catch (error) {
        handleError(error);
    }
}

export async function getUnreadCount() {
    try {
        const response = await api.get("/notifications/unread-count");
        const data = extractData(response);
        return data?.unreadCount ?? 0;
    } catch (error) {
        handleError(error);
    }
}

export async function markAsRead(notificationId) {
    try {
        const response = await api.patch(`/notifications/${notificationId}/read`);
        const data = extractData(response);
        return data?.notification ?? null;
    } catch (error) {
        handleError(error);
    }
}

export async function markAllAsRead() {
    try {
        const response = await api.patch("/notifications/read-all");
        return extractData(response);
    } catch (error) {
        handleError(error);
    }
}

export async function deleteNotification(notificationId) {
    try {
        const response = await api.delete(`/notifications/${notificationId}`);
        return extractData(response);
    } catch (error) {
        handleError(error);
    }
}

export default {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
};
