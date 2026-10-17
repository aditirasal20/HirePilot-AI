import ApiError from "../../utils/ApiError.js";
import resumeRepository from "./resume.repository.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../../utils/cloudinary.js";
import pdfExtractor from "../../ai/pdf.extractor.js";

class ResumeService {
  /**
   * Maximum allowed resumes per candidate
   */
  MAX_RESUMES_PER_CANDIDATE = 5;

  /**
   * Upload a new PDF resume and persist metadata
   * 
   * @param {string} userId - Authenticated user ID
   * @param {Object} file - Express Multer file object (file.buffer, file.originalname)
   * @param {string} title - Custom resume title
   */
  async createResume(userId, file, title) {
    if (!file || !file.buffer) {
      throw new ApiError(400, "Resume PDF file is required.");
    }

    const candidateProfile =
      await resumeRepository.findCandidateProfileByUserId(userId);

    if (!candidateProfile) {
      throw new ApiError(404, "Candidate profile not found.");
    }

    // Enforce candidate resume capacity quota
    const count = await resumeRepository.countByCandidateId(candidateProfile.id);
    if (count >= this.MAX_RESUMES_PER_CANDIDATE) {
      throw new ApiError(
        400,
        `Maximum limit of ${this.MAX_RESUMES_PER_CANDIDATE} resumes reached. Delete an existing resume to upload a new one.`
      );
    }

    // First resume uploaded automatically becomes default
    const isDefault = count === 0;

    // Extract PDF text at upload time so downstream AI jobs (resume analysis, job matching)
    // always have resume content available without re-downloading the file.
    // Extraction validates the output, so raw binary is never persisted as parsedText.
    let parsedText = null;
    try {
      const extraction = await pdfExtractor.extractText(file.buffer);
      parsedText = pdfExtractor.cleanExtractedText(extraction.text);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        400,
        `Could not extract text from the uploaded PDF: ${error.message}`
      );
    }

    // Upload asset to Cloudinary storage
    const uploadResult = await uploadToCloudinary(
      file.buffer,
      "hirepilot/resumes",
      { filename: file.originalname }
    );

    // Persist resume record
    return resumeRepository.create({
      candidateProfileId: candidateProfile.id,
      title,
      fileUrl: uploadResult.fileUrl,
      publicId: uploadResult.publicId,
      originalFileName: file.originalname || "resume.pdf",
      parsedText,
      isDefault,
    });
  }

  /**
   * Get all resumes belonging to the authenticated candidate
   * 
   * @param {string} userId - Authenticated user ID
   */
  async getMyResumes(userId) {
    const candidateProfile =
      await resumeRepository.findCandidateProfileByUserId(userId);

    if (!candidateProfile) {
      throw new ApiError(404, "Candidate profile not found.");
    }

    return resumeRepository.findResumesByCandidate(candidateProfile.id);
  }

  /**
   * Get single resume details by ID
   * 
   * @param {string} userId - Authenticated user ID
   * @param {string} resumeId - Resume ID
   */
  async getResumeById(userId, resumeId) {
    const candidateProfile =
      await resumeRepository.findCandidateProfileByUserId(userId);

    if (!candidateProfile) {
      throw new ApiError(404, "Candidate profile not found.");
    }

    const resume = await resumeRepository.findResumeByIdAndCandidate(
      resumeId,
      candidateProfile.id
    );

    if (!resume) {
      throw new ApiError(404, "Resume not found.");
    }

    return resume;
  }

  /**
   * Update resume metadata (e.g. title)
   * 
   * @param {string} userId - Authenticated user ID
   * @param {string} resumeId - Resume ID
   * @param {Object} payload - { title }
   */
  async updateResume(userId, resumeId, payload) {
    const candidateProfile =
      await resumeRepository.findCandidateProfileByUserId(userId);

    if (!candidateProfile) {
      throw new ApiError(404, "Candidate profile not found.");
    }

    const resume = await resumeRepository.findResumeByIdAndCandidate(
      resumeId,
      candidateProfile.id
    );

    if (!resume) {
      throw new ApiError(404, "Resume not found or unauthorized.");
    }

    const updateData = {};
    if (payload.title !== undefined) {
      updateData.title = payload.title;
    }

    return resumeRepository.update(resumeId, updateData);
  }

  /**
   * Set a resume as default for the authenticated candidate
   * 
   * @param {string} userId - Authenticated user ID
   * @param {string} resumeId - Target Resume ID
   */
  async setDefaultResume(userId, resumeId) {
    const candidateProfile =
      await resumeRepository.findCandidateProfileByUserId(userId);

    if (!candidateProfile) {
      throw new ApiError(404, "Candidate profile not found.");
    }

    const resume = await resumeRepository.findResumeByIdAndCandidate(
      resumeId,
      candidateProfile.id
    );

    if (!resume) {
      throw new ApiError(404, "Resume not found or unauthorized.");
    }

    if (resume.isDefault) {
      throw new ApiError(400, "Resume is already set as default.");
    }

    return resumeRepository.setDefaultResume(candidateProfile.id, resumeId);
  }

  /**
   * Delete a resume record, handling automatic default promotion & Cloudinary cleanup
   * 
   * @param {string} userId - Authenticated user ID
   * @param {string} resumeId - Target Resume ID
   */
  async deleteResume(userId, resumeId) {
    const candidateProfile =
      await resumeRepository.findCandidateProfileByUserId(userId);

    if (!candidateProfile) {
      throw new ApiError(404, "Candidate profile not found.");
    }

    const resume = await resumeRepository.findResumeByIdAndCandidate(
      resumeId,
      candidateProfile.id
    );

    if (!resume) {
      throw new ApiError(404, "Resume not found or unauthorized.");
    }

    // Protect foreign key integrity: Block deletion if attached to active job applications
    if (resume._count?.applications > 0) {
      throw new ApiError(
        409,
        "Cannot delete resume because it is attached to active job applications."
      );
    }

    // Determine next default resume for promotion if deleting the current default
    let nextDefaultResumeId = null;
    if (resume.isDefault) {
      const latestRemaining = await resumeRepository.findLatestResumeExcept(
        candidateProfile.id,
        resumeId
      );
      nextDefaultResumeId = latestRemaining?.id || null;
    }

    // Execute atomic DB deletion and default promotion
    const deletedResume = await resumeRepository.deleteResumeWithDefaultPromotion(
      resumeId,
      candidateProfile.id,
      nextDefaultResumeId
    );

    // Non-blocking asynchronous Cloudinary asset cleanup
    if (deletedResume?.publicId) {
      deleteFromCloudinary(deletedResume.publicId).catch((error) => {
        console.error(
          `[Cloudinary Cleanup Warning] Failed to delete publicId ${deletedResume.publicId}:`,
          error
        );
      });
    }

    return {
      message: "Resume deleted successfully.",
      id: resumeId,
    };
  }
}

export default new ResumeService();
