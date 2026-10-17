/**
 * @file job-matching.controller.js
 */
import jobMatchingService from "./job-matching.service.js";

class JobMatchingController {
  async analyzeJob(req, res, next) {
    try {
      const { jobId } = req.params;
      const { resumeId, refresh } = req.body;

      const result = await jobMatchingService.queueJobMatching(jobId, resumeId, req.user.id, { refresh });

      return res.status(202).json({
        success: true,
        message: "Job matching has been queued successfully.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getReport(req, res, next) {
    try {
      const { jobId } = req.params;
      const { resumeId } = req.query;

      const report = await jobMatchingService.getJobMatchReport(jobId, resumeId, req.user.id);

      return res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyMatches(req, res, next) {
    try {
      const matches = await jobMatchingService.getMyMatches(req.user.id);

      return res.status(200).json({
        success: true,
        count: matches.length,
        data: matches,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteMatch(req, res, next) {
    try {
      const { matchId } = req.params;

      const result = await jobMatchingService.deleteJobMatch(matchId, req.user.id);

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new JobMatchingController();
