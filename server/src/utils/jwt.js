import { createHash, randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const generateAccessToken = (payload) =>
  jwt.sign({ ...payload, purpose: "access" }, env.ACCESS_TOKEN_SECRET, {
    expiresIn: env.ACCESS_TOKEN_EXPIRY,
    jwtid: randomUUID(),
  });
export const generateRefreshToken = (payload) =>
  jwt.sign({ ...payload, purpose: "refresh" }, env.REFRESH_TOKEN_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRY,
    jwtid: randomUUID(),
  });
export const verifyAccessToken = (token) => {
  const payload = jwt.verify(token, env.ACCESS_TOKEN_SECRET);
  if (payload.purpose !== "access") throw new Error("Invalid access token");
  return payload;
};
export const verifyRefreshToken = (token) => {
  const payload = jwt.verify(token, env.REFRESH_TOKEN_SECRET);
  if (payload.purpose !== "refresh") throw new Error("Invalid refresh token");
  return payload;
};
export const hashRefreshToken = (token) =>
  createHash("sha256").update(token).digest("hex");
