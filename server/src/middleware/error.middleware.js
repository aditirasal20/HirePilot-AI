import { isProduction } from "../config/env.js";
import ApiError from "../utils/ApiError.js";

const PrismaErrorMapping = {
  P2000: { statusCode: 400, message: "The provided value is too long for its column." },
  P2002: { statusCode: 409, message: "A record with the same unique value already exists." },
  P2003: { statusCode: 400, message: "The referenced record does not exist." },
  P2011: { statusCode: 400, message: "A required value is missing." },
  P2023: { statusCode: 400, message: "Invalid record identifier provided." },
  P2025: { statusCode: 404, message: "The requested record could not be found." },
};

const isPrismaError = (error) =>
  typeof error?.code === "string" && error.code.startsWith("P") && /^P\d{4}$/.test(error.code);

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Normalize known Prisma client errors into friendly 4xx responses
  if (isPrismaError(err)) {
    const mapping = PrismaErrorMapping[err.code];
    if (mapping) {
      statusCode = mapping.statusCode;
      message = mapping.message;
    }
  }

  // Multer file size limit exceeded
  if (err?.name === "MulterError" && err?.code === "LIMIT_FILE_SIZE") {
    statusCode = 400;
    message = "File size exceeds the maximum allowed limit.";
  }

  if (!(err instanceof ApiError) && statusCode === 500) {
    console.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || [],
    stack: isProduction ? undefined : err.stack,
  });
};

export default errorHandler;
