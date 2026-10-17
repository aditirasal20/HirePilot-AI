import ApiError from "../../utils/ApiError.js";
import candidateProfileRepository from "./candidate-profile.repository.js";

class CandidateProfileService {
  async getProfile(userId) {
    const profile =
      await candidateProfileRepository.findByUserId(userId);

    if (!profile) {
      throw new ApiError(404, "Candidate profile not found.");
    }

    return profile;
  }

  async updateProfile(userId, data) {
    const profile =
      await candidateProfileRepository.findByUserId(userId);

    if (!profile) {
      throw new ApiError(404, "Candidate profile not found.");
    }

    return candidateProfileRepository.updateByUserId(userId, data);
  }
}

export default new CandidateProfileService();
