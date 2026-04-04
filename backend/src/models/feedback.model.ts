import mongoose, { Schema } from "mongoose";
import validator from "validator";
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_SENTIMENTS,
  FEEDBACK_STATUSES,
  type FeedbackCategory,
  type FeedbackSentiment,
  type FeedbackStatus,
} from "../types/feedback";

export interface FeedbackDocument extends mongoose.Document {
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
  createdAt: Date;
  updatedAt: Date;
}

const feedbackSchema = new Schema<FeedbackDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 20,
    },
    category: {
      type: String,
      enum: FEEDBACK_CATEGORIES,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: FEEDBACK_STATUSES,
      default: "New",
      index: true,
    },
    submitterName: {
      type: String,
      trim: true,
      maxlength: 80,
    },
    submitterEmail: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator(value: string) {
          return !value || validator.isEmail(value);
        },
        message: "Invalid email address",
      },
    },
    ai_category: {
      type: String,
      enum: FEEDBACK_CATEGORIES,
    },
    ai_sentiment: {
      type: String,
      enum: FEEDBACK_SENTIMENTS,
    },
    ai_priority: {
      type: Number,
      min: 1,
      max: 10,
      index: true,
    },
    ai_summary: {
      type: String,
      trim: true,
      maxlength: 280,
    },
    ai_tags: {
      type: [String],
      default: [],
    },
    ai_processed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

feedbackSchema.index({ createdAt: -1 });

export const FeedbackModel =
  mongoose.models.Feedback ||
  mongoose.model<FeedbackDocument>("Feedback", feedbackSchema);

