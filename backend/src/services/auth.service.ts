import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { HttpError } from "../lib/http-error";

export function loginAdmin(email: string, password: string) {
  if (email !== env.ADMIN_EMAIL || password !== env.ADMIN_PASSWORD) {
    throw new HttpError(401, "Invalid admin credentials");
  }

  const token = jwt.sign({ email, role: "admin" }, env.JWT_SECRET, {
    expiresIn: "12h",
  });

  return {
    token,
    admin: {
      email,
      role: "admin",
    },
  };
}

