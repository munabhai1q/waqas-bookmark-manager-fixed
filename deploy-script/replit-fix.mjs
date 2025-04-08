// This script fixes the static file locations for Replit deployment
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// First, build the application
console.log('Building the application...');
execSync('npm run build', { stdio: 'inherit' });

// Make sure dist and dist/public exist
const distDir = path.resolve(__dirname, '../dist');
const publicDir = path.resolve(distDir, 'public');

console.log('Fixing static file structure for deployment...');

// Create a simple express server that will serve static files correctly
const expressServerContent = `
// This file is auto-generated to fix Replit deployment
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the main server
import('./index.js').catch(err => {
  console.error('Failed to import main server:', err);
});

// This express app serves static files as a fallback
const app = express();

// Serve static assets from the correct locations
app.use(express.static(path.resolve(__dirname, 'public')));
app.use(express.static(__dirname));

// Serve index.html for any non-API routes (SPA)
app.get('*', (req, res, next) => {
  // Skip API requests
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  // Try to send from public/index.html first
  const publicIndexPath = path.resolve(__dirname, 'public', 'index.html');
  if (fs.existsSync(publicIndexPath)) {
    return res.sendFile(publicIndexPath);
  }
  
  // Fall back to root index.html
  res.sendFile(path.resolve(__dirname, 'index.html'));
});

// Listen on a different port as backup
const PORT = 5050;
app.listen(PORT, () => {
  console.log(\`Static file server listening on port \${PORT}\`);
});
`;

// Write the express server to the dist directory
fs.writeFileSync(path.resolve(distDir, 'static-server.js'), expressServerContent);

// Copy all files from dist/public to dist/
if (fs.existsSync(publicDir)) {
  // Copy index.html
  fs.copyFileSync(
    path.resolve(publicDir, 'index.html'),
    path.resolve(distDir, 'index.html')
  );
  
  // Create assets directory if it doesn't exist
  const assetsDir = path.resolve(publicDir, 'assets');
  const distAssetsDir = path.resolve(distDir, 'assets');
  if (fs.existsSync(assetsDir)) {
    if (!fs.existsSync(distAssetsDir)) {
      fs.mkdirSync(distAssetsDir, { recursive: true });
    }
    
    // Copy all files from assets
    const assetFiles = fs.readdirSync(assetsDir);
    for (const file of assetFiles) {
      fs.copyFileSync(
        path.resolve(assetsDir, file),
        path.resolve(distAssetsDir, file)
      );
    }
  }
}

// Create a startup script to ensure our file server runs
const startupScript = `
// This is a startup script that makes sure our static file server runs
// to ensure proper deployment

// Import the main server
import('./index.js');

// Also import our static file server
import('./static-server.js');
`;

fs.writeFileSync(path.resolve(distDir, 'start.js'), startupScript);

// Update the package.json start script (for deployment)
console.log('Updating package.json start script...');
try {
  const packageJsonPath = path.resolve(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Store the original start script
  const originalStart = packageJson.scripts.start;
  
  // Update package.json start script to use our start.js wrapper
  packageJson.scripts.start = 'NODE_ENV=production node dist/start.js';
  
  // Write the updated package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  
  console.log('Deployment fix completed successfully!');
  console.log('IMPORTANT: Please click DEPLOY in Replit now!');
  
  // Schedule a rollback of the package.json after 1 minute to avoid affecting development
  setTimeout(() => {
    try {
      const pj = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      pj.scripts.start = originalStart;
      fs.writeFileSync(packageJsonPath, JSON.stringify(pj, null, 2));
      console.log('Package.json has been restored to original state for development.');
    } catch (err) {
      console.error('Failed to restore package.json:', err);
    }
  }, 60000);
  
} catch (error) {
  console.error('Error updating package.json:', error);
}
