import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>WhatsApp Bot API</title>
  <style>body{font-family:sans-serif;padding:40px;text-align:center;background:#f8fafc;}</style>
</head>
<body>
  <h2>🚀 Multi-Brand WhatsApp Automation Platform Online</h2>
  <p>Status: Healthy | Managed Brands: Edu Alt Tech & Setsuzoku</p>
  <p>Check health at: <a href="/api/health">/api/health</a></p>
</body>
</html>`;

fs.writeFileSync(path.join(distDir, 'index.html'), htmlContent);
console.log('✓ Generated dist/index.html fallback for static hosts');
