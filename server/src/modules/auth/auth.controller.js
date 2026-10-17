import { verifyRefreshToken } from "../../utils/jwt.js";
import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";

import authService from "./auth.service.js";

import {
  REFRESH_TOKEN_COOKIE_NAME,
  refreshTokenCookieOptions,
} from "./auth.constants.js";

const setRefreshTokenCookie = (res, refreshToken) => {
  return res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
    ...refreshTokenCookieOptions,
    maxAge: Math.max(
      0,
      verifyRefreshToken(refreshToken).exp * 1000 - Date.now(),
    ),
  });
};

const clearRefreshTokenCookie = (res) => {
  return res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
    httpOnly: refreshTokenCookieOptions.httpOnly,
    secure: refreshTokenCookieOptions.secure,
    sameSite: refreshTokenCookieOptions.sameSite,
    path: refreshTokenCookieOptions.path,
  });
};

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        result.requiresEmailVerification
          ? "Account created. Please verify your email."
          : "Account created. You can now log in.",
        result,
      ),
    );
});

const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body);

  setRefreshTokenCookie(res, refreshToken);

  return res.status(200).json(
    new ApiResponse(200, "Login successful", {
      user,
      accessToken,
    }),
  );
});

const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];

  try {
    const {
      user,
      accessToken,
      refreshToken: newRefreshToken,
    } = await authService.refresh(refreshToken);

    setRefreshTokenCookie(res, newRefreshToken);

    return res.status(200).json(
      new ApiResponse(200, "Tokens refreshed successfully", {
        user,
        accessToken,
      }),
    );
  } catch (error) {
    if ([401, 403].includes(error.statusCode)) clearRefreshTokenCookie(res);
    throw error;
  }
});

const logout = asyncHandler(async (req, res) => {
  try {
    await authService.logout({
      userId: req.user?.id,
      refreshToken: req.cookies?.[REFRESH_TOKEN_COOKIE_NAME],
    });
  } finally {
    clearRefreshTokenCookie(res);
  }

  return res.status(200).json(new ApiResponse(200, "Logged out successfully"));
});

const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email);

  return res.status(200).json(new ApiResponse(200, result.message, result));
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    throw new ApiError(400, "Passwords do not match");
  }

  const result = await authService.resetPassword(token, { password });
  clearRefreshTokenCookie(res);

  return res
    .status(200)
    .json(new ApiResponse(200, "Password reset successfully", result));
});

const verifyEmail = asyncHandler(async (req, res) => {
  const result = await authService.verifyEmail(req.body.token);

  return res
    .status(200)
    .json(new ApiResponse(200, "Email verified successfully", result));
});

const resendVerification = asyncHandler(async (req, res) => {
  const result = await authService.resendVerification(req.body.email);

  return res.status(200).json(new ApiResponse(200, result.message, result));
});

const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user.id, req.body);

  clearRefreshTokenCookie(res);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Password changed successfully. Please log in again.",
      ),
    );
});

export {
  register,
  login,
  refresh,
  logout,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
};
