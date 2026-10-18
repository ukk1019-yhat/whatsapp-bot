import cors from 'cors';
import express, { Express } from 'express';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { captureRawBody } from './middleware/rawBody.js';
import { analyticsRouter } from './routes/analytics.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { businessRouter } from './routes/business.routes.js';
import { conversationRouter } from './routes/conversation.routes.js';
import { healthRouter } from './routes/health.routes.js';
import { knowledgeRouter } from './routes/knowledge.routes.js';
import { leadRouter } from './routes/lead.routes.js';
import { webhookRouter } from './routes/webhook.routes.js';

export function createApp(): Express {
  const app = express();

  // Security & Cross-Origin
  app.use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Hub-Signature-256', 'x-test-bypass-sig'],
    })
  );

  // Raw body capture for HMAC SHA256 Webhook verification
  app.use(
    express.json({
      verify: captureRawBody,
      limit: '5mb',
    })
  );

  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  // Global Rate Limiter
  app.use(rateLimiter());

  // Mount API Routers
  app.use('/api/webhooks', webhookRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/businesses', businessRouter);
  app.use('/api/conversations', conversationRouter);
  app.use('/api/leads', leadRouter);
  app.use('/api/knowledge', knowledgeRouter);
  app.use('/api/analytics', analyticsRouter);
  app.use('/api/health', healthRouter);

  // Central Error Handler
  app.use(errorHandler);

  return app;
}
