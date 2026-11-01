import { z } from "zod";

/**
 * Variáveis de ambiente validadas via Zod (executa uma vez no boot).
 * Falha rápido se algo crítico estiver faltando.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_BASE_URL: z.string().url().default("http://localhost:3000"),
  PLAYER_BASE_URL: z.string().url().default("http://localhost:3000"),
  MARKETING_BASE_URL: z.string().url().default("http://localhost:3000"),
  LOCALE_DEFAULT: z.enum(["pt-BR", "en"]).default("pt-BR"),
  LOCALE_SUPPORTED: z.string().default("pt-BR,en"),

  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),
  DATABASE_POOL_SIZE: z.coerce.number().int().positive().default(10),

  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SIGNING_SECRET: z.string().min(1),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),

  R2_ACCOUNT_ID: z.string().min(1).optional(),
  R2_ACCESS_KEY_ID: z.string().min(1).optional(),
  R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  R2_BUCKET_PUBLIC: z.string().default("demo-public"),
  R2_BUCKET_PRIVATE: z.string().default("demo-private"),
  R2_PUBLIC_BASE_URL: z.string().url().optional(),

  ASAAS_API_KEY: z.string().min(1).optional(),
  ASAAS_ENVIRONMENT: z.enum(["sandbox", "production"]).default("sandbox"),
  ASAAS_WEBHOOK_SECRET: z.string().min(1).optional(),

  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().default("EasyDemo <noreply@easydemo.io>"),
  EMAIL_DPO: z.string().email().default("dpo@easydemo.io"),

  SENTRY_DSN: z.string().url().optional(),

  ENCRYPTION_KEY: z.string().min(1).optional(),
  PII_HASH_SALT: z.string().min(1).optional(),

  VISITOR_COOKIE_NAME: z.string().default("_pk_id"),
  VISITOR_COOKIE_TTL_DAYS: z.coerce.number().int().positive().default(30),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function env(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("❌ Invalid environment variables:", parsed.error.flatten());
    throw new Error("Invalid environment variables");
  }
  cached = parsed.data;
  return cached;
}
