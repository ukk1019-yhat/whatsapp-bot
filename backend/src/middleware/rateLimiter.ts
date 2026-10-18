import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const ipRecords = new Map<string, RateLimitRecord>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipRecords.entries()) {
    if (record.resetTime <= now) {
      ipRecords.delete(ip);
    }
  }
}, 300000);

export function rateLimiter(options?: { windowMs?: number; maxRequests?: number }) {
  const windowMs = options?.windowMs || env.RATE_LIMIT_WINDOW_MS;
  const maxRequests = options?.maxRequests || env.RATE_LIMIT_MAX_REQUESTS;

  return (req: Request, res: Response, next: NextFunction): void => {
    // In unit testing, allow skipping rate limits
    if (process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit']) {
      next();
      return;
    }

    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    let record = ipRecords.get(clientIp);
    if (!record || record.resetTime <= now) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      ipRecords.set(clientIp, record);
    } else {
      record.count++;
    }

    const remaining = Math.max(0, maxRequests - record.count);
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > maxRequests) {
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please wait before making further requests.',
        retryAfterSeconds: Math.ceil((record.resetTime - now) / 1000),
      });
      return;
    }

    next();
  };
}
