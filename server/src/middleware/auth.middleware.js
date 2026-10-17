import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

import { verifyAccessToken } from "../utils/jwt.js";

import authRepository from "../modules/auth/auth.repository.js";

const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    throw new ApiError(401, "Access token missing");
  }

  const token = authHeader.split(" ")[1];

  let decoded;

  try {
    decoded = verifyAccessToken(token);
  } catch (error) {
    throw new ApiError(401, "Invalid or expired access token");
  }

  const user = await authRepository.findUserById(decoded.userId);

  if (!user) {
    throw new ApiError(401, "User not found");
  }

  req.user = user;

  next();
});

export const optionalAuthenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyAccessToken(token);
    const user = await authRepository.findUserById(decoded.userId);
    req.user = user || null;
  } catch (error) {
    req.user = null;
  }

  next();
});

export default authenticate;