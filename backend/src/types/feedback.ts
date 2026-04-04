export const FEEDBACK_CATEGORIES = [
  "Bug",
  "Feature Request",
  "Improvement",
  "Other",
] as const;

export const FEEDBACK_STATUSES = [
  "New",
  "In Review",
  "Resolved",
] as const;

export const FEEDBACK_SENTIMENTS = [
  "Positive",
  "Neutral",
  "Negative",
] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];
export type FeedbackSentiment = (typeof FEEDBACK_SENTIMENTS)[number];

export type FeedbackSummaryTheme = {
  theme: string;
  count: number;
};

