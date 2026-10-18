import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { env } from '../config/env.js';
import { logger } from '../logger/logger.js';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  const dbUrl = env.DATABASE_URL;

  if (!dbUrl) {
    logger.warn('DATABASE_URL is not set. Migrations skipped (In-memory repository mode active).');
    process.exit(0);
  }

  logger.info({ dbUrl: dbUrl.replace(/:[^:@]+@/, ':***@') }, 'Running database migrations against PostgreSQL...');

  const pool = new Pool({ connectionString: dbUrl });
  const client = await pool.connect();

  try {
    const migrationsDir = path.resolve(__dirname, '../../migrations');
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    logger.info({ files }, `Found ${files.length} SQL migration files`);

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      logger.info(`Executing migration: ${file}...`);
      await client.query(sql);
      logger.info(`Successfully applied migration: ${file}`);
    }

    logger.info('All database migrations applied successfully!');
  } catch (err) {
    logger.error({ err }, 'Error executing database migrations');
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
