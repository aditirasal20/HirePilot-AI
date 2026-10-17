import multer from "multer";
import ApiError from "../utils/ApiError.js";

// Multer memory storage configuration (Max 5MB per file)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype !== "application/pdf") {
    return cb(new ApiError(400, "Only PDF files are allowed for resume upload."), false);
  }
  cb(null, true);
};

export const uploadSinglePdf = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter,
}).single("file");

/**
 * Middleware wrapper enforcing PDF Magic Bytes verification (%PDF-1.)
 */
export const validatePdfMagicBytes = (req, res, next) => {
  if (!req.file || !req.file.buffer) {
    throw new ApiError(400, "Resume PDF file is required.");
  }

  // PDF Magic Bytes header signature: %PDF- (0x25, 0x50, 0x44, 0x46, 0x2D)
  const header = req.file.buffer.toString("ascii", 0, 5);
  if (!header.startsWith("%PDF-")) {
    throw new ApiError(400, "Invalid PDF file content. Magic byte verification failed.");
  }

  next();
};
