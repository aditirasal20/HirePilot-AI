import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";

import candidateProfileService from "./candidate-profile.service.js";

const getProfile = asyncHandler(async (req, res) => {
  const profile = await candidateProfileService.getProfile(
    req.user.id
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      "Candidate profile fetched successfully",
      {
        profile,
      }
    )
  );
});

const updateProfile = asyncHandler(async (req, res) => {
  const profile = await candidateProfileService.updateProfile(
    req.user.id,
    req.body
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      "Candidate profile updated successfully",
      {
        profile,
      }
    )
  );
});

export { getProfile, updateProfile };
