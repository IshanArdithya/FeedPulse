import rateLimit from "express-rate-limit";
import { errorResponse } from "../lib/api-response";

export const feedbackSubmissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: errorResponse("RATE_LIMITED", "Too many submissions from this IP. Please try again later."),
});

