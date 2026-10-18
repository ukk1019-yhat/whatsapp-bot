import { createApp } from '../backend/src/app.js';

const app = createApp();

export default function handler(req: any, res: any) {
  // Ensure req.url retains /api prefix if Vercel serverless gateway strips it
  if (req.url && !req.url.startsWith('/api') && !req.url.startsWith('/?')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  return app(req, res);
}
