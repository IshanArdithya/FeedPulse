import type { Request, Response } from "express";
import { z } from "zod";
import { successResponse } from "../lib/api-response";
import { asyncHandler } from "../lib/async-handler";
import { loginAdmin } from "../services/auth.service";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export const loginController = asyncHandler(async (req: Request, res: Response) => {
  const payload = loginSchema.parse(req.body);
  const data = loginAdmin(payload.email, payload.password);

  res.status(200).json(successResponse(data, "Login successful"));
});

