export type FeedbackCategory = "Bug" | "Feature Request" | "Improvement" | "Other";
export type FeedbackStatus = "New" | "In Review" | "Resolved";
export type FeedbackSentiment = "Positive" | "Neutral" | "Negative";

export type FeedbackItem = {
  _id: string;
  title: string;
  description: string;
  category: FeedbackCategory;
  status: FeedbackStatus;
  submitterName?: string;
  submitterEmail?: string;
  ai_category?: FeedbackCategory;
  ai_sentiment?: FeedbackSentiment;
  ai_priority?: number;
  ai_summary?: string;
  ai_tags: string[];
  ai_processed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FeedbackListResponse = {
  items: FeedbackItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    totalFeedback: number;
    openItems: number;
    averagePriority: number;
    mostCommonTag: string;
  };
};

export type FeedbackSummaryResponse = {
  summary: string;
  themes: Array<{ theme: string; count: number }>;
  feedbackCount: number;
  periodStart: string;
  periodEnd: string;
};

export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  error: string | null;
  message: string;
};

