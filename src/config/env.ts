import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(8080),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),

  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),

  LOTUS_WEBHOOK_API_KEY: z.string().min(16),
  LOTUS_WEBHOOK_HMAC_SECRET: z.string().min(16),
  LOTUS_WEBHOOK_MAX_SKEW_SECONDS: z.coerce.number().int().positive().default(300),

  EVOLUTION_BASE_URL: z.string().url(),
  EVOLUTION_API_KEY: z.string().min(16),
  EVOLUTION_INSTANCE: z.string().min(1),

  QUEUE_NAME: z.string().min(1).default("whatsapp_dispatch"),
  QUEUE_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),

  ADMIN_API_KEY: z.string().optional().default("")
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`invalid_env ${parsed.error.message}`);
}

export const env = parsed.data;
