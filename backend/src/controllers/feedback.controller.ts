import type { Request, Response } from "express";
import { z } from "zod";
import { successResponse } from "../lib/api-response";
import { asyncHandler } from "../lib/async-handler";
import {
  createFeedback,
  deleteFeedback,
  getFeedbackById,
  getFeedbackSummary,
  listFeedback,
  requestFeedbackSummaryRefresh,
  rerunFeedbackAnalysis,
  updateFeedbackStatus,
} from "../services/feedback.service";
import { FEEDBACK_CATEGORIES, FEEDBACK_STATUSES } from "../types/feedback";

const createFeedbackSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(20),
  category: z.enum(FEEDBACK_CATEGORIES),
  submitterName: z.string().trim().max(80).optional().or(z.literal("")),
  submitterEmail: z.email().optional().or(z.literal("")),
});

const updateStatusSchema = z.object({
  status: z.enum(FEEDBACK_STATUSES),
});

const objectIdSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid feedback id"),
});

export const submitFeedbackController = asyncHandler(async (req: Request, res: Response) => {
  const payload = createFeedbackSchema.parse(req.body);
  const result = await createFeedback({
    ...payload,
    submitterName: payload.submitterName || undefined,
    submitterEmail: payload.submitterEmail || undefined,
  });

  res.status(201).json(
    successResponse(
      result.feedback,
      "Feedback submitted successfully",
    ),
  );
});

export const listFeedbackController = asyncHandler(async (req: Request, res: Response) => {
  const data = await listFeedback(req.query);
  res.status(200).json(successResponse(data, "Feedback fetched successfully"));
});

export const getFeedbackController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = objectIdSchema.parse(req.params);
  const data = await getFeedbackById(id);
  res.status(200).json(successResponse(data, "Feedback fetched successfully"));
});

export const updateFeedbackStatusController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = objectIdSchema.parse(req.params);
  const payload = updateStatusSchema.parse(req.body);
  const data = await updateFeedbackStatus(id, payload.status);
  res.status(200).json(successResponse(data, "Feedback status updated"));
});

export const deleteFeedbackController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = objectIdSchema.parse(req.params);
  const data = await deleteFeedback(id);
  res.status(200).json(successResponse(data, "Feedback deleted"));
});

export const summaryController = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getFeedbackSummary();
  res.status(200).json(successResponse(data, "Summary fetched successfully"));
});

export const rerunAnalysisController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = objectIdSchema.parse(req.params);
  const data = await rerunFeedbackAnalysis(id);
  res.status(200).json(successResponse(data, "Gemini analysis re-run successfully"));
});

export const refreshSummaryController = asyncHandler(async (_req: Request, res: Response) => {
  const data = await requestFeedbackSummaryRefresh();
  res.status(200).json(successResponse(data, data.started ? "Summary refresh started" : "Summary refresh not started"));
});
