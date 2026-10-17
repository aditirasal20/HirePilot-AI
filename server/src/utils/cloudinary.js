import { v2 as cloudinary } from "cloudinary";
import { Readable } from "node:stream";
import { env } from "../config/env.js";
import { extname, basename } from "node:path";

const sanitizeFilename = (filename) => {
  const fallback = "resume";
  const ext = extname(filename || "").toLowerCase().slice(0, 10);
  const base = basename(filename || "", ext);
  const safeBase = base
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .replace(/-+/g, "-")
    .slice(0, 60) || fallback;
  return `${safeBase}${ext}`;
};

/**
 * Cloudinary storage helper.
 * Wraps real file upload and deletion via the Cloudinary SDK.
 */

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

const assertConfigured = () => {
  if (
    !env.CLOUDINARY_CLOUD_NAME ||
    !env.CLOUDINARY_API_KEY ||
    !env.CLOUDINARY_API_SECRET
  ) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, " +
        "CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in the environment."
    );
  }
};

/**
 * Upload a binary buffer to Cloudinary as a raw file.
 *
 * @param {Buffer} fileBuffer - File bytes (e.g. Multer memory storage buffer)
 * @param {string} folder - Cloudinary folder for the asset
 * @param {Object} options - Extra upload options (e.g. { filename })
 * @returns {Promise<{fileUrl: string, publicId: string}>}
 */
export const uploadToCloudinary = async (
  fileBuffer,
  folder = "hirepilot/resumes",
  options = {}
) => {
  assertConfigured();

  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder,
        filename_override: sanitizeFilename(options.filename),
      },
      (error, uploadResult) => {
        if (error) return reject(error);
        resolve(uploadResult);
      }
    );

    Readable.from(fileBuffer).pipe(stream);
  });

  return {
    fileUrl: result.secure_url,
    publicId: result.public_id,
  };
};

/**
 * Delete a raw asset from Cloudinary by public ID.
 *
 * @param {string} publicId - Cloudinary public ID of the asset
 * @returns {Promise<Object>} Cloudinary destroy result
 */
export const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return { result: "ok" };

  assertConfigured();

  return cloudinary.uploader.destroy(publicId, {
    resource_type: "raw",
  });
};
