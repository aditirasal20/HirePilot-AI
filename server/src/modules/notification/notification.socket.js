/**
 * Socket.IO Real-time Integration for Notification Module
 * Manages user-specific socket rooms and real-time event emissions.
 * Connection auth is JWT-based: the client must present a valid access token
 * (handshake.auth.token). The userId is never trusted from the client.
 */

import { verifyAccessToken } from "../../utils/jwt.js";
import authRepository from "../auth/auth.repository.js";

let ioInstance = null;

/**
 * Initialize Socket.IO server instance and configure user connection rooms
 * @param {Object} io - Socket.IO server instance
 */
export const initNotificationSocket = (io) => {
  ioInstance = io;

  io.on("connection", async (socket) => {
    // Authenticated user ID is derived from a verified access token only
    const token = socket.handshake.auth?.token || socket.handshake.auth?.accessToken;

    if (!token) {
      console.log("[Socket.IO] Connection rejected: no access token provided.");
      socket.emit("error:auth", { message: "Access token required." });
      socket.disconnect(true);
      return;
    }

    let userId;
    try {
      const decoded = verifyAccessToken(token);
      const user = await authRepository.findUserById(decoded.userId);
      if (!user) {
        throw new Error("User not found.");
      }
      userId = user.id;
    } catch (error) {
      console.log("[Socket.IO] Connection rejected: invalid or expired token.");
      socket.emit("error:auth", { message: "Invalid or expired access token." });
      socket.disconnect(true);
      return;
    }

    const roomName = `user_${userId}`;
    socket.join(roomName);
    console.log(`[Socket.IO] User ${userId} connected and joined room: ${roomName}`);

    socket.on("disconnect", () => {
      console.log(`[Socket.IO] User ${userId} disconnected from room: ${roomName}`);
    });
  });
};

/**
 * Emit real-time socket event to a target user's dedicated room
 * @param {string} userId - Target User CUID
 * @param {string} event - Event name ('notification:new', 'notification:read', 'notification:all-read')
 * @param {Object} payload - Data payload
 */
export const emitToUser = (userId, event, payload) => {
  if (!ioInstance) {
    console.warn(`[Socket.IO Warning] Socket instance not initialized. Event ${event} skipped for user ${userId}.`);
    return false;
  }

  if (!userId) {
    return false;
  }

  const roomName = `user_${userId}`;
  ioInstance.to(roomName).emit(event, payload);
  console.log(`[Socket.IO Emission] Event '${event}' sent to room '${roomName}'`);
  return true;
};
