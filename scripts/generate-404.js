import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, '../dist');
const indexHtml = path.join(distDir, 'index.html');
const notFoundHtml = path.join(distDir, '404.html');

console.log('🔄 Generating 404.html for GitHub Pages...');

try {
    if (fs.existsSync(indexHtml)) {
        fs.copyFileSync(indexHtml, notFoundHtml);
        console.log('✅ Success: index.html copied to 404.html');
    } else {
        console.error('❌ Error: dist/index.html not found! Make sure to build the project first.');
        process.exit(1);
    }
} catch (error) {
    console.error('❌ Failed to create 404.html:', error);
    process.exit(1);
}
