import fs from 'fs';
import path from 'path';

const srcDir = path.resolve('frontend/dist');
const destDir = path.resolve('dist');

if (fs.existsSync(srcDir)) {
  fs.cpSync(srcDir, destDir, { recursive: true });
  console.log('✓ Successfully copied frontend/dist to root dist');
} else {
  console.warn('⚠️ Source directory frontend/dist does not exist yet');
}
