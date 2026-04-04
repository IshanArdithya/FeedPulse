import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_SENTIMENTS,
  type FeedbackCategory,
  type FeedbackSentiment,
} from "../types/feedback";

export function cleanText(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

export function normalizeCategory(value: string | undefined): FeedbackCategory {
  if (!value) {
    return "Other";
  }

  const matched = FEEDBACK_CATEGORIES.find(
    (category) => category.toLowerCase() === value.toLowerCase().trim(),
  );

  return matched ?? "Other";
}

export function normalizeSentiment(value: string | undefined): FeedbackSentiment {
  if (!value) {
    return "Neutral";
  }

  const matched = FEEDBACK_SENTIMENTS.find(
    (sentiment) => sentiment.toLowerCase() === value.toLowerCase().trim(),
  );

  return matched ?? "Neutral";
}

export function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => cleanText(tag))
    .filter(Boolean)
    .slice(0, 8);
}

