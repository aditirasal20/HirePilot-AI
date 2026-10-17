import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";

import companyService from "./company.service.js";

const createCompany = asyncHandler(async (req, res) => {
  const company = await companyService.create(
    req.user.id,
    req.body
  );

  return res.status(201).json(
    new ApiResponse(
      201,
      "Company created successfully",
      {
        company,
      }
    )
  );
});

const getMyCompany = asyncHandler(async (req, res) => {
  const company = await companyService.getMyCompany(
    req.user.id
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      "Company fetched successfully",
      {
        company,
      }
    )
  );
});

const updateCompany = asyncHandler(async (req, res) => {
  const company = await companyService.updateCompany(
    req.user.id,
    req.params.id,
    req.body
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      "Company updated successfully",
      {
        company,
      }
    )
  );
});

export { createCompany, getMyCompany, updateCompany };