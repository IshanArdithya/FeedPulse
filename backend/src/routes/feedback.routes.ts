import { Router } from "express";
import {
  deleteFeedbackController,
  refreshSummaryController,
  getFeedbackController,
  listFeedbackController,
  rerunAnalysisController,
  submitFeedbackController,
  summaryController,
  updateFeedbackStatusController,
} from "../controllers/feedback.controller";
import { requireAdmin } from "../middleware/auth.middleware";
import { feedbackSubmissionLimiter } from "../middleware/rate-limit.middleware";

export const feedbackRouter = Router();

feedbackRouter.post("/", feedbackSubmissionLimiter, submitFeedbackController);
feedbackRouter.get("/", requireAdmin, listFeedbackController);
feedbackRouter.get("/summary", requireAdmin, summaryController);
feedbackRouter.post("/summary/refresh", requireAdmin, refreshSummaryController);
feedbackRouter.get("/:id", requireAdmin, getFeedbackController);
feedbackRouter.patch("/:id", requireAdmin, updateFeedbackStatusController);
feedbackRouter.post("/:id/reanalyze", requireAdmin, rerunAnalysisController);
feedbackRouter.delete("/:id", requireAdmin, deleteFeedbackController);
