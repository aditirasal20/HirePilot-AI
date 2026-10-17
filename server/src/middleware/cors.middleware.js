import { env } from "../config/env.js";

const ALLOWED_METHODS = "GET,HEAD,PUT,PATCH,POST,DELETE";

/**
 * Configurable CORS middleware without external dependencies.
 * Allows the frontend origin defined via CLIENT_ORIGIN (or any origin in development).
 */
export const corsMiddleware = (req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = env.CLIENT_ORIGIN === "*" ? ["*"] : env.CLIENT_ORIGIN.split(",").map((o) => o.trim());

  if (origin && (env.CLIENT_ORIGIN === "*" || allowedOrigins.includes(origin))) {
    res.setHeader("Access-Control-Allow-Origin", env.CLIENT_ORIGIN === "*" ? origin : origin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Methods", ALLOWED_METHODS);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
};
