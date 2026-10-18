import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_BASE_URL: z.string().url().default('http://localhost:3000'),
  CORS_ORIGIN: z.string().default('*'),

  // Meta WhatsApp Cloud API credentials
  META_APP_SECRET: z.string().min(1, 'META_APP_SECRET is required'),
  META_VERIFY_TOKEN: z.string().min(1, 'META_VERIFY_TOKEN is required'),
  WHATSAPP_ACCESS_TOKEN: z.string().min(1, 'WHATSAPP_ACCESS_TOKEN is required'),
  WHATSAPP_API_VERSION: z.string().default('v20.0'),

  // Dedicated WhatsApp Phone Number IDs
  WHATSAPP_PHONE_ID_EDU_ALT_TECH: z.string().default('WHATSAPP_PHONE_ID_EDU_ALT_TECH'),
  WHATSAPP_PHONE_ID_SETSUZOKU: z.string().default('WHATSAPP_PHONE_ID_SETSUZOKU'),

  // Supabase / PostgreSQL credentials
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  DATABASE_URL: z.string().optional(),

  // AI Provider configuration
  AI_PROVIDER: z.enum(['mock', 'openai', 'gemini']).default('mock'),
  AI_PROVIDER_API_KEY: z.string().optional(),
  AI_MODEL: z.string().default('gpt-4o-mini'),

  // Admin Auth & Security
  ADMIN_AUTH_SECRET: z.string().min(16, 'ADMIN_AUTH_SECRET must be at least 16 characters'),
  ADMIN_TOKEN_EXPIRY: z.string().default('24h'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

export type EnvConfig = z.infer<typeof envSchema>;

function parseEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment configuration:', JSON.stringify(result.error.format(), null, 2));
    // In test environment, provide fallback to avoid crashing during unit test execution
    if (process.env.NODE_ENV === 'test') {
      return envSchema.parse({
        META_APP_SECRET: 'test_secret_for_unit_tests_12345678',
        META_VERIFY_TOKEN: 'test_verify_token_1234',
        WHATSAPP_ACCESS_TOKEN: 'test_access_token_1234',
        ADMIN_AUTH_SECRET: 'super_secret_test_key_32_characters_long',
        ...process.env,
      });
    }
    throw new Error('Environment validation failed');
  }
  return result.data;
}

export const env = parseEnv();
