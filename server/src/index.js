import express from "express";
import http from "http";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";

import { env, isProduction } from "./config/env.js";
import routes from "./routes/index.js";
import errorHandler from "./middleware/error.middleware.js";
import { corsMiddleware } from "./middleware/cors.middleware.js";
import { apiRateLimiter } from "./middleware/rateLimit.middleware.js";
import { initNotificationSocket } from "./modules/notification/notification.socket.js";
import ApiError from "./utils/ApiError.js";

const app = express();

app.use(corsMiddleware);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "HirePilot AI API is running",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "HirePilot AI API is healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/v1", apiRateLimiter, routes);

app.use((req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
});

app.use(errorHandler);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: env.CLIENT_ORIGIN === "*" ? true : env.CLIENT_ORIGIN.split(",").map((o) => o.trim()),
    credentials: true,
  },
});

initNotificationSocket(io);

server.listen(env.PORT, () => {
  console.log(`HirePilot AI server running on http://localhost:${env.PORT} (${isProduction ? "production" : "development"})`);
});

const shutdown = (signal) => {
  console.log(`[Server] ${signal} received, shutting down gracefully...`);
  server.close(() => {
    console.log("[Server] HTTP server closed.");
    process.exit(0);
  });

  setTimeout(() => {
    console.error("[Server] Forced shutdown after timeout.");
    process.exit(1);
  }, 10000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  console.error("[Unhandled Rejection]", reason);
});

process.on("uncaughtException", (error) => {
  console.error("[Uncaught Exception]", error);
  if (isProduction) {
    process.exit(1);
  }
});
