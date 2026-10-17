import dotenv from "dotenv";

dotenv.config();

const requiredSecrets = ["DATABASE_URL", "ACCESS_TOKEN_SECRET", "REFRESH_TOKEN_SECRET"];

for (const secret of requiredSecrets) {
  if (!process.env[secret]) {
    console.warn(`[env] Missing required environment variable: ${secret}`);
  }
}

export const env = {
  PORT: Number(process.env.PORT) || 5000,
  DATABASE_URL: process.env.DATABASE_URL,

  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  EMAIL_VERIFICATION_TOKEN_SECRET:
    process.env.EMAIL_VERIFICATION_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET,
  PASSWORD_RESET_TOKEN_SECRET:
    process.env.PASSWORD_RESET_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET,

  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY || "15m",
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || "7d",
  EMAIL_VERIFICATION_TOKEN_EXPIRY:
    process.env.EMAIL_VERIFICATION_TOKEN_EXPIRY || "24h",
  PASSWORD_RESET_TOKEN_EXPIRY:
    process.env.PASSWORD_RESET_TOKEN_EXPIRY || "15m",

  NODE_ENV: process.env.NODE_ENV || "development",

  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "*",

  GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "",

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",
};

export const isProduction = env.NODE_ENV === "production";
