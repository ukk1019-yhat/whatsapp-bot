import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { logger } from '../logger/logger.js';

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  // If response has already sent headers, delegate to default express error handler
  if (res.headersSent) {
    return next(err);
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    logger.warn({ path: req.path, issues: err.issues }, 'Request validation failed');
    res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid request data',
      details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
    return;
  }

  const errorObj = err instanceof Error ? err : new Error(String(err));
  logger.error(
    {
      path: req.path,
      method: req.method,
      errorMessage: errorObj.message,
      stack: env.NODE_ENV === 'production' ? undefined : errorObj.stack,
    },
    'Unhandled server error'
  );

  res.status(500).json({
    error: 'Internal Server Error',
    message: env.NODE_ENV === 'production' ? 'An unexpected error occurred' : errorObj.message,
  });
}
