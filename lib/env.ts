import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  GEMINI_API_KEY: z.string().default(""),
  GEMINI_TEXT_MODEL: z.string().default("gemini-2.5-pro"),
  GEMINI_IMAGE_MODEL: z.string().default("gemini-2.5-flash-image"),
  BANANAPRO_BASE_URL: z.string().default(""),
  BANANAPRO_API_KEY: z.string().default(""),
  BANANAPRO_MODEL: z.string().default("nano-banana-pro"),
  APP_URL: z.string().url().default("http://localhost:3000"),
});

let cachedEnv: z.infer<typeof envSchema> | null = null;

export function getEnv() {
  if (cachedEnv) {
    return cachedEnv;
  }

  cachedEnv = envSchema.parse({
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_TEXT_MODEL: process.env.GEMINI_TEXT_MODEL,
    GEMINI_IMAGE_MODEL: process.env.GEMINI_IMAGE_MODEL,
    BANANAPRO_BASE_URL: process.env.BANANAPRO_BASE_URL,
    BANANAPRO_API_KEY: process.env.BANANAPRO_API_KEY,
    BANANAPRO_MODEL: process.env.BANANAPRO_MODEL,
    APP_URL: process.env.APP_URL,
  });

  return cachedEnv;
}

export function requireProviderEnv(name: string, value: string) {
  if (!value) {
    throw new Error(`ENV_MISSING:${name}`);
  }
}

export function resetEnvCache() {
  cachedEnv = null;
}
