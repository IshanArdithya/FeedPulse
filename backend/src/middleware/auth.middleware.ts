import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { errorResponse } from "../lib/api-response";

export type AuthenticatedRequest = Request & {
  admin?: {
    email: string;
    role: string;
  };
};

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json(errorResponse("UNAUTHORIZED", "Admin token is required"));
  }

  const token = header.replace("Bearer ", "").trim();

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { email: string; role: string };
    req.admin = payload;
    return next();
  } catch {
    return res.status(401).json(errorResponse("UNAUTHORIZED", "Invalid or expired token"));
  }
}

