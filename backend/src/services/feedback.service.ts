import { HttpError } from "../lib/http-error";
import { logError } from "../lib/logger";
import { FeedbackModel } from "../models/feedback.model";
import type { FeedbackCategory, FeedbackStatus } from "../types/feedback";
import { cleanText, normalizeCategory } from "../utils/normalizers";
import { parsePositiveInt } from "../utils/query";
import { analyzeFeedback, generateWeeklySummary } from "./gemini.service";

type CreateFeedbackInput = {
  title: string;
  description: string;
  category: FeedbackCategory;
  submitterName?: string;
  submitterEmail?: string;
};

export async function createFeedback(input: CreateFeedbackInput) {
  const feedback = await FeedbackModel.create({
    title: cleanText(input.title),
    description: cleanText(input.description),
    category: normalizeCategory(input.category),
    submitterName: input.submitterName ? cleanText(input.submitterName) : undefined,
    submitterEmail: input.submitterEmail ? cleanText(input.submitterEmail).toLowerCase() : undefined,
  });

  try {
    const aiResult = await analyzeFeedback(feedback.title, feedback.description);

    feedback.ai_category = aiResult.category;
    feedback.ai_sentiment = aiResult.sentiment;
    feedback.ai_priority = aiResult.priority_score;
    feedback.ai_summary = aiResult.summary;
    feedback.ai_tags = aiResult.tags;
    feedback.ai_processed = true;
    await feedback.save();

    return { feedback, aiFailed: false };
  } catch (error) {
    logError("Gemini analysis failed during feedback submission", {
      feedbackId: feedback.id,
      error,
    });
    feedback.ai_processed = false;
    await feedback.save();

    return { feedback, aiFailed: true };
  }
}

type FeedbackQuery = {
  page?: unknown;
  limit?: unknown;
  category?: unknown;
  status?: unknown;
  search?: unknown;
  sortBy?: unknown;
  sortOrder?: unknown;
};

export async function listFeedback(query: FeedbackQuery) {
  const page = parsePositiveInt(query.page, 1);
  const limit = Math.min(parsePositiveInt(query.limit, 10), 50);
  const search = typeof query.search === "string" ? cleanText(query.search) : "";
  const category = typeof query.category === "string" ? query.category : "";
  const status = typeof query.status === "string" ? query.status : "";
  const sortBy = typeof query.sortBy === "string" ? query.sortBy : "date";
  const sortOrder = query.sortOrder === "asc" ? 1 : -1;

  const filter: Record<string, unknown> = {};

  if (category && category !== "All") {
    filter.category = normalizeCategory(category);
  }

  if (status && status !== "All") {
    filter.status = status;
  }

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { ai_summary: { $regex: search, $options: "i" } },
    ];
  }

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    date: { createdAt: sortOrder as 1 | -1 },
    priority: { ai_priority: sortOrder as 1 | -1, createdAt: -1 },
    sentiment: { ai_sentiment: sortOrder as 1 | -1, createdAt: -1 },
  };

  const [items, total, statsSource] = await Promise.all([
    FeedbackModel.find(filter)
      .sort(sortMap[sortBy] ?? sortMap.date)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    FeedbackModel.countDocuments(filter),
    FeedbackModel.find().lean(),
  ]);

  const openItems = statsSource.filter((item) => item.status !== "Resolved").length;
  const priorities = statsSource
    .map((item) => item.ai_priority)
    .filter((value): value is number => typeof value === "number");
  const averagePriority = priorities.length
    ? Number((priorities.reduce((acc, value) => acc + value, 0) / priorities.length).toFixed(1))
    : 0;
  const tagCounts = statsSource.flatMap((item) => item.ai_tags ?? []).reduce<Map<string, number>>(
    (acc, tag) => {
      acc.set(tag, (acc.get(tag) ?? 0) + 1);
      return acc;
    },
    new Map(),
  );
  const mostCommonTag =
    [...tagCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "None yet";

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
    stats: {
      totalFeedback: statsSource.length,
      openItems,
      averagePriority,
      mostCommonTag,
    },
  };
}

export async function getFeedbackById(id: string) {
  const feedback = await FeedbackModel.findById(id).lean();

  if (!feedback) {
    throw new HttpError(404, "Feedback not found");
  }

  return feedback;
}

export async function updateFeedbackStatus(id: string, status: FeedbackStatus) {
  const feedback = await FeedbackModel.findByIdAndUpdate(
    id,
    { status },
    { returnDocument: "after", runValidators: true },
  ).lean();

  if (!feedback) {
    throw new HttpError(404, "Feedback not found");
  }

  return feedback;
}

export async function deleteFeedback(id: string) {
  const feedback = await FeedbackModel.findByIdAndDelete(id).lean();

  if (!feedback) {
    throw new HttpError(404, "Feedback not found");
  }

  return feedback;
}

export async function rerunFeedbackAnalysis(id: string) {
  const feedback = await FeedbackModel.findById(id);

  if (!feedback) {
    throw new HttpError(404, "Feedback not found");
  }

  try {
    const aiResult = await analyzeFeedback(feedback.title, feedback.description);

    feedback.ai_category = aiResult.category;
    feedback.ai_sentiment = aiResult.sentiment;
    feedback.ai_priority = aiResult.priority_score;
    feedback.ai_summary = aiResult.summary;
    feedback.ai_tags = aiResult.tags;
    feedback.ai_processed = true;
    await feedback.save();

    return feedback;
  } catch (error) {
    logError("Gemini re-analysis failed", {
      feedbackId: feedback.id,
      error,
    });
    throw new HttpError(502, "Gemini analysis failed");
  }
}

export async function getFeedbackSummary() {
  const since = new Date();
  since.setDate(since.getDate() - 7);

  const recentItems = await FeedbackModel.find({
    createdAt: { $gte: since },
  })
    .sort({ createdAt: -1 })
    .lean();

  const summary = await generateWeeklySummary(recentItems);

  return {
    periodStart: since,
    periodEnd: new Date(),
    feedbackCount: recentItems.length,
    ...summary,
  };
}
