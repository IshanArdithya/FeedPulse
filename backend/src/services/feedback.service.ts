import { HttpError } from "../lib/http-error";
import { logError } from "../lib/logger";
import { FeedbackModel } from "../models/feedback.model";
import { FeedbackSummaryModel } from "../models/feedback-summary.model";
import type {
  FeedbackCategory,
  FeedbackStatus,
  FeedbackSummaryStatus,
} from "../types/feedback";
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

const WEEKLY_SUMMARY_KEY = "last-7-days";
const SUMMARY_STALE_AFTER_MS = 15 * 60 * 1000;
const SUMMARY_REFRESH_COOLDOWN_MS = 60 * 1000;
const SUMMARY_REFRESH_TIMEOUT_MS = 5 * 60 * 1000;

type SummaryWindow = {
  periodStart: Date;
  periodEnd: Date;
};

type RecentFeedbackSnapshot = {
  items: Awaited<ReturnType<typeof getRecentFeedbackForSummary>>;
  latestFeedbackAt: Date | null;
  feedbackCount: number;
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

function getRollingWindow(): SummaryWindow {
  const periodEnd = new Date();
  const periodStart = new Date(periodEnd);
  periodStart.setDate(periodStart.getDate() - 7);

  return { periodStart, periodEnd };
}

async function getRecentFeedbackForSummary(window = getRollingWindow()) {
  return FeedbackModel.find({
    createdAt: { $gte: window.periodStart },
  })
    .sort({ createdAt: -1 })
    .lean();
}

function isSameWindow(
  storedStart?: Date | null,
  storedEnd?: Date | null,
  currentWindow?: SummaryWindow,
) {
  if (!storedStart || !storedEnd || !currentWindow) {
    return false;
  }

  return (
    storedStart.getUTCFullYear() === currentWindow.periodStart.getUTCFullYear() &&
    storedStart.getUTCMonth() === currentWindow.periodStart.getUTCMonth() &&
    storedStart.getUTCDate() === currentWindow.periodStart.getUTCDate() &&
    storedEnd.getUTCFullYear() === currentWindow.periodEnd.getUTCFullYear() &&
    storedEnd.getUTCMonth() === currentWindow.periodEnd.getUTCMonth() &&
    storedEnd.getUTCDate() === currentWindow.periodEnd.getUTCDate()
  );
}

function isSummaryFresh({
  generatedAt,
  lastFeedbackAt,
  summaryPeriodStart,
  summaryPeriodEnd,
  currentWindow,
  latestFeedbackAt,
}: {
  generatedAt?: Date | null;
  lastFeedbackAt?: Date | null;
  summaryPeriodStart?: Date | null;
  summaryPeriodEnd?: Date | null;
  currentWindow: SummaryWindow;
  latestFeedbackAt: Date | null;
}) {
  if (!generatedAt) {
    return false;
  }

  if (!isSameWindow(summaryPeriodStart, summaryPeriodEnd, currentWindow)) {
    return false;
  }

  if (Date.now() - generatedAt.getTime() > SUMMARY_STALE_AFTER_MS) {
    return false;
  }

  if (!latestFeedbackAt) {
    return true;
  }

  if (!lastFeedbackAt) {
    return false;
  }

  return lastFeedbackAt.getTime() >= latestFeedbackAt.getTime();
}

function mapRefreshStatus(status?: FeedbackSummaryStatus) {
  return status ?? "idle";
}

async function tryStartSummaryRefresh(force = false) {
  const now = new Date();

  const existing = await FeedbackSummaryModel.findOne({ key: WEEKLY_SUMMARY_KEY }).lean();

  const hasTimedOutRefresh =
    Boolean(existing?.refreshInProgress) &&
    Boolean(existing?.lastRefreshAttemptAt) &&
    now.getTime() - existing.lastRefreshAttemptAt.getTime() > SUMMARY_REFRESH_TIMEOUT_MS;

  if (hasTimedOutRefresh) {
    await FeedbackSummaryModel.findOneAndUpdate(
      { key: WEEKLY_SUMMARY_KEY },
      {
        $set: {
          refreshInProgress: false,
          lastRefreshStatus: "failed",
          lastRefreshError: "Summary refresh timed out.",
        },
      },
    );
  }

  const effectiveExisting =
    hasTimedOutRefresh && existing
      ? {
          ...existing,
          refreshInProgress: false,
          lastRefreshStatus: "failed" as const,
          lastRefreshError: "Summary refresh timed out.",
        }
      : existing;

  if (
    effectiveExisting?.refreshInProgress
  ) {
    return {
      started: false,
      alreadyRefreshing: true,
      cooldownUntil: effectiveExisting.lastRefreshAttemptAt
        ? new Date(effectiveExisting.lastRefreshAttemptAt.getTime() + SUMMARY_REFRESH_COOLDOWN_MS)
        : undefined,
    };
  }

  if (
    !force &&
    effectiveExisting?.lastRefreshAttemptAt &&
    now.getTime() - effectiveExisting.lastRefreshAttemptAt.getTime() < SUMMARY_REFRESH_COOLDOWN_MS
  ) {
    return {
      started: false,
      alreadyRefreshing: false,
      cooldownUntil: new Date(
        effectiveExisting.lastRefreshAttemptAt.getTime() + SUMMARY_REFRESH_COOLDOWN_MS,
      ),
    };
  }

  const lock = await FeedbackSummaryModel.findOneAndUpdate(
    {
      key: WEEKLY_SUMMARY_KEY,
      refreshInProgress: { $ne: true },
      ...(force
        ? {}
        : {
            $or: [
              { lastRefreshAttemptAt: { $exists: false } },
              {
                lastRefreshAttemptAt: {
                  $lte: new Date(now.getTime() - SUMMARY_REFRESH_COOLDOWN_MS),
                },
              },
            ],
          }),
    },
    {
      $setOnInsert: { key: WEEKLY_SUMMARY_KEY },
      $set: {
        refreshInProgress: true,
        lastRefreshAttemptAt: now,
      },
    },
    {
      upsert: true,
      returnDocument: "after",
    },
  ).lean();

  if (!lock?.refreshInProgress) {
    return {
      started: false,
      alreadyRefreshing: Boolean(effectiveExisting?.refreshInProgress),
      cooldownUntil: effectiveExisting?.lastRefreshAttemptAt
        ? new Date(effectiveExisting.lastRefreshAttemptAt.getTime() + SUMMARY_REFRESH_COOLDOWN_MS)
        : undefined,
    };
  }

  return {
    started: true,
    alreadyRefreshing: false,
    cooldownUntil: undefined,
  };
}

async function performSummaryRefresh() {
  const window = getRollingWindow();
  const recentItems = await getRecentFeedbackForSummary(window);
  const latestFeedbackAt = recentItems[0]?.createdAt ?? null;

  try {
    const generated = await generateWeeklySummary(recentItems);

    await FeedbackSummaryModel.findOneAndUpdate(
      { key: WEEKLY_SUMMARY_KEY },
      {
        $set: {
          key: WEEKLY_SUMMARY_KEY,
          periodStart: window.periodStart,
          periodEnd: window.periodEnd,
          feedbackCount: recentItems.length,
          summary: generated.summary,
          themes: generated.themes,
          generatedAt: new Date(),
          lastFeedbackAt: latestFeedbackAt,
          refreshInProgress: false,
          lastRefreshStatus: "success",
          lastRefreshError: null,
        },
      },
      {
        upsert: true,
      },
    );
  } catch (error) {
    logError("Weekly summary refresh failed", error);

    await FeedbackSummaryModel.findOneAndUpdate(
      { key: WEEKLY_SUMMARY_KEY },
      {
        $set: {
          refreshInProgress: false,
          lastRefreshStatus: "failed",
          lastRefreshError: error instanceof Error ? error.message : "Unknown summary refresh error",
        },
      },
      { upsert: true },
    );
  }
}

async function getSummarySnapshot(): Promise<RecentFeedbackSnapshot> {
  const window = getRollingWindow();
  const items = await getRecentFeedbackForSummary(window);

  return {
    items,
    latestFeedbackAt: items[0]?.createdAt ?? null,
    feedbackCount: items.length,
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
  const currentWindow = getRollingWindow();
  const [storedSummary, snapshot] = await Promise.all([
    FeedbackSummaryModel.findOne({ key: WEEKLY_SUMMARY_KEY }).lean(),
    getSummarySnapshot(),
  ]);

  const generatedAt = storedSummary?.generatedAt ? new Date(storedSummary.generatedAt) : null;
  const lastFeedbackAt = storedSummary?.lastFeedbackAt
    ? new Date(storedSummary.lastFeedbackAt)
    : null;
  const periodStart = storedSummary?.periodStart ? new Date(storedSummary.periodStart) : null;
  const periodEnd = storedSummary?.periodEnd ? new Date(storedSummary.periodEnd) : null;

  const isMissing = !storedSummary?.summary;
  const isFresh = isSummaryFresh({
    generatedAt,
    lastFeedbackAt,
    summaryPeriodStart: periodStart,
    summaryPeriodEnd: periodEnd,
    currentWindow,
    latestFeedbackAt: snapshot.latestFeedbackAt,
  });
  const isStale = !isMissing && !isFresh;
  const refreshTimedOut =
    Boolean(storedSummary?.refreshInProgress) &&
    Boolean(storedSummary?.lastRefreshAttemptAt) &&
    Date.now() - storedSummary.lastRefreshAttemptAt.getTime() > SUMMARY_REFRESH_TIMEOUT_MS;
  const isRefreshing = Boolean(storedSummary?.refreshInProgress) && !refreshTimedOut;
  const refreshRecommended = isMissing || isStale;

  const cooldownUntil = storedSummary?.lastRefreshAttemptAt
    ? new Date(storedSummary.lastRefreshAttemptAt.getTime() + SUMMARY_REFRESH_COOLDOWN_MS)
    : null;
  const withinCooldown =
    cooldownUntil !== null && cooldownUntil.getTime() > Date.now();

  return {
    summary: storedSummary?.summary ?? "",
    themes: storedSummary?.themes ?? [],
    feedbackCount: storedSummary?.feedbackCount ?? snapshot.feedbackCount,
    periodStart: storedSummary?.periodStart ?? currentWindow.periodStart,
    periodEnd: storedSummary?.periodEnd ?? currentWindow.periodEnd,
    generatedAt: storedSummary?.generatedAt ?? null,
    lastFeedbackAt: storedSummary?.lastFeedbackAt ?? snapshot.latestFeedbackAt,
    isMissing,
    isStale,
    isRefreshing,
    refreshRecommended,
    lastRefreshStatus: refreshTimedOut
      ? "failed"
      : mapRefreshStatus(storedSummary?.lastRefreshStatus),
    lastRefreshError: refreshTimedOut
      ? "Summary refresh timed out."
      : storedSummary?.lastRefreshError ?? null,
    cooldownUntil: withinCooldown ? cooldownUntil : null,
  };
}

export async function requestFeedbackSummaryRefresh() {
  const result = await tryStartSummaryRefresh(true);

  if (result.started && process.env.NODE_ENV !== "test") {
    void performSummaryRefresh();
  }

  return result;
}
