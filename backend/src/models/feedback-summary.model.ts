import mongoose, { Schema } from "mongoose";

export type FeedbackSummaryThemeDocument = {
  theme: string;
  count: number;
};

export interface FeedbackSummaryDocument extends mongoose.Document {
  key: string;
  periodStart?: Date;
  periodEnd?: Date;
  feedbackCount: number;
  summary?: string;
  themes: FeedbackSummaryThemeDocument[];
  generatedAt?: Date;
  lastFeedbackAt?: Date;
  refreshInProgress: boolean;
  lastRefreshAttemptAt?: Date;
  lastRefreshStatus?: "idle" | "success" | "failed";
  lastRefreshError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const feedbackSummarySchema = new Schema<FeedbackSummaryDocument>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    periodStart: Date,
    periodEnd: Date,
    feedbackCount: {
      type: Number,
      default: 0,
    },
    summary: String,
    themes: {
      type: [
        {
          theme: { type: String, required: true },
          count: { type: Number, required: true },
        },
      ],
      default: [],
    },
    generatedAt: Date,
    lastFeedbackAt: Date,
    refreshInProgress: {
      type: Boolean,
      default: false,
    },
    lastRefreshAttemptAt: Date,
    lastRefreshStatus: {
      type: String,
      enum: ["idle", "success", "failed"],
      default: "idle",
    },
    lastRefreshError: String,
  },
  {
    timestamps: true,
  },
);

export const FeedbackSummaryModel =
  mongoose.models.FeedbackSummary ||
  mongoose.model<FeedbackSummaryDocument>("FeedbackSummary", feedbackSummarySchema);

