import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { errorResponse } from "../lib/api-response";
import { HttpError } from "../lib/http-error";
import { logError } from "../lib/logger";

export function notFoundHandler(_req: Request, res: Response) {
  return res.status(404).json(errorResponse("NOT_FOUND", "Route not found"));
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  logError("Unhandled request error", error);

  if (error instanceof HttpError) {
    return res.status(error.statusCode).json(errorResponse("REQUEST_ERROR", error.message));
  }

  if (error instanceof ZodError) {
    return res.status(400).json(
      errorResponse(
        "VALIDATION_ERROR",
        error.issues.map((issue) => issue.message).join(", "),
      ),
    );
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return res.status(400).json(errorResponse("VALIDATION_ERROR", error.message));
  }

  return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", "Something went wrong"));
}
