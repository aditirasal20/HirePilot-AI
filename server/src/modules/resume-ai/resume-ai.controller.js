/**
 * @file resume-ai.controller.js
 */
import resumeAiService from "./resume-ai.service.js";

class ResumeAiController {
  async startAnalysis(req, res, next) {
    try {
      const result = await resumeAiService.startAnalysis(req.params.resumeId, req.user.id);
      res.status(202).json({ success: true, data: result, message: result.message });
    } catch (error) {
      next(error);
    }
  }

  async getAnalysis(req, res, next) {
    try {
      const result = await resumeAiService.getAnalysis(req.params.resumeId, req.user.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export default new ResumeAiController();
