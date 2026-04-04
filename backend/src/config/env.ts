import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env"), override: false });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  MONGO_URI: z.string().min(1, "MONGO_URI is required").default("mongodb://127.0.0.1:27017/feedpulse"),
  JWT_SECRET: z.string().min(8, "JWT_SECRET must be at least 8 characters").default("change-me-123"),
  ADMIN_EMAIL: z.email("ADMIN_EMAIL must be a valid email").default("admin@feedpulse.dev"),
  ADMIN_PASSWORD: z.string().min(8, "ADMIN_PASSWORD must be at least 8 characters").default("admin12345"),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.preprocess(
    (value) => {
      if (typeof value === "string" && value.trim() === "") {
        return undefined;
      }

      return value;
    },
    z.string().default("gemini-2.0-flash"),
  ),
  FRONTEND_URL: z.string().default("http://localhost:3000"),
});

export const env = envSchema.parse(process.env);
