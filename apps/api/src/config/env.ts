import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

// Load .env from current working directory
dotenv.config();

// Also attempt loading .env from monorepo root if running from workspace directory
const monorepoRootEnv = path.resolve(process.cwd(), "../../.env");
if (fs.existsSync(monorepoRootEnv)) {
  dotenv.config({ path: monorepoRootEnv });
}

const envSchema = z.object({
  PORT: z
    .string()
    .default("5000")
    .transform((v) => parseInt(v, 10)),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  REDIS_KEY_PREFIX: z.string().default("galaph:"),
  JWT_SECRET: z
    .string()
    .default("galaph_development_jwt_secret_min_32_characters_long_12345"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment configuration:", parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
