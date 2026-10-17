import nodemailer from "nodemailer";
import ApiError from "../../utils/ApiError.js";

export function requireEmailDelivery() {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_FROM ||
    !process.env.AUTH_APP_URL
  ) {
    throw new ApiError(
      503,
      "Email delivery is not configured. Please contact the app administrator.",
    );
  }
}
export async function sendAuthEmail({ email, token, purpose }) {
  requireEmailDelivery();
  const isReset = purpose === "reset";
  const url = new URL(
    isReset ? "/reset-password" : "/verify-email",
    process.env.AUTH_APP_URL,
  );
  url.searchParams.set("token", token);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    ...(process.env.SMTP_USER
      ? {
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          },
        }
      : {}),
  });
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: isReset
        ? "Reset your HirePilot password"
        : "Verify your HirePilot email",
      text: `${isReset ? "Reset your password" : "Verify your email"} using this link:\n\n${url.href}\n\nIf you didn't request this, you can ignore this email.`,
    });
  } catch {
    throw new ApiError(
      503,
      "We couldn't send the email. Please try again later.",
    );
  }
}
