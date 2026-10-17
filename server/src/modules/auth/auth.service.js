import bcrypt from "bcrypt";
import ApiError from "../../utils/ApiError.js";
import authRepository from "./auth.repository.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashRefreshToken,
} from "../../utils/jwt.js";
import {
  generateEmailVerificationToken,
  verifyEmailVerificationToken,
  generatePasswordResetToken,
  verifyPasswordResetToken,
} from "../../utils/authTokens.js";
import { requireEmailDelivery, sendAuthEmail } from "./auth.mailer.js";

const requiresVerification = () =>
  process.env.REQUIRE_EMAIL_VERIFICATION === "true";
const emailMessage =
  "If an eligible account exists, an email has been sent. Check your inbox and spam folder.";

class AuthService {
  async register({ fullName, email, password, role }) {
    if (requiresVerification()) requireEmailDelivery();
    const normalizedEmail = email.trim().toLowerCase();
    if (await authRepository.findUserByEmail(normalizedEmail))
      throw new ApiError(
        409,
        "An account with this email already exists. Please log in.",
      );
    const hashedPassword = await bcrypt.hash(password, 10);
    let user;
    try {
      user = await authRepository.registerUser(
        {
          fullName: fullName.trim(),
          email: normalizedEmail,
          password: hashedPassword,
          role,
        },
        role,
      );
    } catch (error) {
      if (error?.code === "P2002")
        throw new ApiError(
          409,
          "An account with this email already exists. Please log in.",
        );
      throw error;
    }
    let emailDeliveryFailed = false;
    if (requiresVerification()) {
      try {
        await sendAuthEmail({
          email: user.email,
          token: generateEmailVerificationToken({
            userId: user.id,
            email: user.email,
          }),
          purpose: "verify",
        });
      } catch {
        emailDeliveryFailed = true;
      }
    }
    return {
      user: this.sanitizeUser(user),
      requiresEmailVerification: requiresVerification(),
      emailDeliveryFailed,
    };
  }
  async login({ email, password }) {
    const user = await authRepository.findUserWithPassword(
      email.trim().toLowerCase(),
    );
    if (!user || !(await bcrypt.compare(password, user.password)))
      throw new ApiError(401, "Invalid email or password.");
    this.checkVerification(user);
    return { user: this.sanitizeUser(user), ...(await this.issueTokens(user)) };
  }
  async refresh(refreshToken) {
    if (!refreshToken) throw new ApiError(401, "Refresh token missing");
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new ApiError(401, "Invalid or expired refresh token");
    }
    const user = await authRepository.findUserByIdWithAuth(payload.userId);
    if (
      !user ||
      !user.refreshTokenHash ||
      !user.refreshTokenExpiresAt ||
      hashRefreshToken(refreshToken) !== user.refreshTokenHash ||
      user.refreshTokenExpiresAt <= new Date()
    )
      throw new ApiError(401, "Invalid or expired refresh token");
    this.checkVerification(user);
    return {
      user: this.sanitizeUser(user),
      ...(await this.issueTokens(user, user.refreshTokenHash)),
    };
  }
  async logout({ userId, refreshToken } = {}) {
    if (userId) return authRepository.clearRefreshToken(userId);
    if (!refreshToken) return;
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      return;
    }
    await authRepository.clearRefreshToken(payload.userId);
  }
  async changePassword(userId, { currentPassword, newPassword }) {
    const user = await authRepository.findUserByIdWithAuth(userId);
    if (!user) throw new ApiError(404, "User not found");
    if (!(await bcrypt.compare(currentPassword, user.password)))
      throw new ApiError(400, "Current password is incorrect");
    await authRepository.updatePassword(
      userId,
      await bcrypt.hash(newPassword, 10),
    );
  }
  async verifyEmail(token) {
    let payload;
    try {
      payload = verifyEmailVerificationToken(token);
    } catch {
      throw new ApiError(400, "Invalid or expired verification link");
    }
    const user = await authRepository.findUserByIdWithAuth(payload.userId);
    if (!user || user.email !== payload.email)
      throw new ApiError(400, "Invalid verification link");
    if (!user.isEmailVerified) await authRepository.markEmailVerified(user.id);
    return { user: await authRepository.findUserById(user.id) };
  }
  async resendVerification(email) {
    requireEmailDelivery();
    const user = await authRepository.findUserByEmail(
      email.trim().toLowerCase(),
    );
    if (user && !user.isEmailVerified)
      await sendAuthEmail({
        email: user.email,
        purpose: "verify",
        token: generateEmailVerificationToken({
          userId: user.id,
          email: user.email,
        }),
      });
    return { message: emailMessage };
  }
  async forgotPassword(email) {
    requireEmailDelivery();
    const user = await authRepository.findUserWithPassword(
      email.trim().toLowerCase(),
    );
    if (user)
      await sendAuthEmail({
        email: user.email,
        purpose: "reset",
        token: generatePasswordResetToken({
          userId: user.id,
          email: user.email,
          passwordVersion: hashRefreshToken(user.password),
        }),
      });
    return { message: emailMessage };
  }
  async resetPassword(token, { password }) {
    let payload;
    try {
      payload = verifyPasswordResetToken(token);
    } catch {
      throw new ApiError(400, "Invalid or expired reset link");
    }
    const user = await authRepository.findUserByIdWithAuth(payload.userId);
    if (
      !user ||
      user.email !== payload.email ||
      payload.passwordVersion !== hashRefreshToken(user.password)
    )
      throw new ApiError(400, "Invalid or expired reset link");
    const updated = await authRepository.updatePasswordIfCurrent(
      user.id,
      user.password,
      await bcrypt.hash(password, 10),
    );
    if (!updated.count)
      throw new ApiError(400, "This reset link has already been used");
    return { user: this.sanitizeUser(user) };
  }
  checkVerification(user) {
    if (requiresVerification() && !user.isEmailVerified)
      throw new ApiError(403, "Please verify your email before logging in.");
  }
  async issueTokens(user, previousHash) {
    this.checkVerification(user);
    const payload = { userId: user.id, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    const expiry = new Date(verifyRefreshToken(refreshToken).exp * 1000);
    if (previousHash) {
      const result = await authRepository.rotateRefreshToken(
        user.id,
        previousHash,
        hashRefreshToken(refreshToken),
        expiry,
      );
      if (!result.count)
        throw new ApiError(401, "Refresh token has already been used");
    } else {
      await authRepository.updateRefreshToken(
        user.id,
        hashRefreshToken(refreshToken),
        expiry,
      );
    }
    return { accessToken, refreshToken };
  }
  sanitizeUser(user) {
    const safe = { ...user };
    delete safe.password;
    delete safe.refreshTokenHash;
    delete safe.refreshTokenExpiresAt;
    return safe;
  }
}
export default new AuthService();
