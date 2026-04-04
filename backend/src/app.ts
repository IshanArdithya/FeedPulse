import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { successResponse } from "./lib/api-response";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { authRouter } from "./routes/auth.routes";
import { feedbackRouter } from "./routes/feedback.routes";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.FRONTEND_URL,
    }),
  );
  app.use(helmet());
  app.use(morgan("dev"));
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => {
    res.status(200).json(successResponse({ status: "ok" }, "FeedPulse API is running"));
  });

  app.use("/api/auth", authRouter);
  app.use("/api/feedback", feedbackRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

