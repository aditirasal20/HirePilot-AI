import ApiError from "../../utils/ApiError.js";
import companyRepository from "./company.repository.js";

class CompanyService {
  async create(userId, data) {
    const recruiter =
      await companyRepository.findRecruiterProfile(userId);

    if (!recruiter) {
      throw new ApiError(404, "Recruiter profile not found.");
    }

    if (recruiter.companyId) {
      throw new ApiError(
        409,
        "Recruiter already belongs to a company."
      );
    }

    const existingCompany =
      await companyRepository.findByName(data.name);

    if (existingCompany) {
      throw new ApiError(
        409,
        "Company name already exists."
      );
    }

    return companyRepository.createCompanyAndAssignRecruiter(
      userId,
      data
    );
  }

  async getMyCompany(userId) {
    const recruiter =
      await companyRepository.findRecruiterProfile(userId);

    if (!recruiter) {
      throw new ApiError(404, "Recruiter profile not found.");
    }

    if (!recruiter.companyId) {
      throw new ApiError(404, "No company assigned yet.");
    }

    const company = await companyRepository.findById(
      recruiter.companyId
    );

    if (!company) {
      throw new ApiError(404, "Company not found.");
    }

    return company;
  }

  async updateCompany(userId, companyId, data) {
    const recruiter =
      await companyRepository.findRecruiterProfile(userId);

    if (!recruiter) {
      throw new ApiError(404, "Recruiter profile not found.");
    }

    if (!recruiter.companyId) {
      throw new ApiError(404, "No company assigned yet.");
    }

    if (recruiter.companyId !== companyId) {
      throw new ApiError(
        403,
        "You can only update your own company."
      );
    }

    if (data.name) {
      const existingCompany =
        await companyRepository.findByName(data.name);

      if (existingCompany && existingCompany.id !== companyId) {
        throw new ApiError(
          409,
          "Company name already exists."
        );
      }
    }

    const company = await companyRepository.updateById(
      companyId,
      data
    );

    return company;
  }
}

export default new CompanyService();