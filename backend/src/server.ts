import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './logger/logger.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`=======================================================`);
  logger.info(`🚀 Multi-Brand WhatsApp Automation Platform Online`);
  logger.info(`🌐 Listening on: ${env.API_BASE_URL} (Port ${env.PORT})`);
  logger.info(`🏢 Managed Brands:`);
  logger.info(`   - Edu Alt Tech (Phone ID: ${env.WHATSAPP_PHONE_ID_EDU_ALT_TECH})`);
  logger.info(`   - Setsuzoku    (Phone ID: ${env.WHATSAPP_PHONE_ID_SETSUZOKU})`);
  logger.info(`🔒 Webhook Endpoint: POST /api/webhooks/whatsapp`);
  logger.info(`🧪 Interactive Simulator: POST /api/health/simulator`);
  logger.info(`⚙️  Environment: ${env.NODE_ENV}`);
  logger.info(`=======================================================`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed successfully.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed successfully.');
    process.exit(0);
  });
});
