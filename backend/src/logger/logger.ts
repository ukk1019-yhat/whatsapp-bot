import pino from 'pino';
import { env } from '../config/env.js';

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers["x-hub-signature-256"]',
      'password',
      'password_hash',
      'token',
      'access_token',
      'META_APP_SECRET',
      'WHATSAPP_ACCESS_TOKEN',
      'SUPABASE_SERVICE_ROLE_KEY',
      'AI_PROVIDER_API_KEY',
      '*.password',
      '*.token',
      '*.secret',
    ],
    censor: '[REDACTED]',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
