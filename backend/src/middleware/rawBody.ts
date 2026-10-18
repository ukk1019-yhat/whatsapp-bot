import { NextFunction, Request, Response } from 'express';

// Extend Express Request type to include rawBody
declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}

export function captureRawBody(req: Request, res: Response, buf: Buffer, encoding: BufferEncoding): void {
  if (buf && buf.length) {
    req.rawBody = Buffer.from(buf);
  }
}
