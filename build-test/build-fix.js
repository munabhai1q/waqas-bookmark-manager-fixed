/**
 * This script can be run before deploying to Vercel to ensure the build output is properly structured
 * It fixes common issues with Vercel deployments of full-stack applications
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Build the application first
console.log('Building the application...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('Build completed successfully');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}

// Ensure the dist directory exists and has the expected structure
const distDir = path.join(__dirname, '..', 'dist');
const distPublicDir = path.join(distDir, 'public');

if (!fs.existsSync(distDir)) {
  console.error('Error: dist directory does not exist after build!');
  process.exit(1);
}

if (!fs.existsSync(distPublicDir)) {
  console.error('Error: dist/public directory does not exist!');
  process.exit(1);
}

// Check if dist/index.js exists (server entry point)
if (!fs.existsSync(path.join(distDir, 'index.js'))) {
  console.error('Error: dist/index.js (server entry point) does not exist!');
  process.exit(1);
}

// Check if dist/public/index.html exists (client entry point)
if (!fs.existsSync(path.join(distPublicDir, 'index.html'))) {
  console.error('Error: dist/public/index.html (client entry point) does not exist!');
  process.exit(1);
}

// Create or modify the vercel.js entry point to ensure it properly loads the server
const vercelEntryPoint = path.join(__dirname, '..', 'vercel.js');
const vercelEntryContent = `// Entry point for Vercel deployment
import('./dist/index.js').catch(err => {
  console.error('Failed to load server:', err);
  process.exit(1);
});
`;

fs.writeFileSync(vercelEntryPoint, vercelEntryContent);
console.log('Created Vercel entry point at vercel.js');

// Log success
console.log('Build verification completed successfully.');
console.log('Your build output is ready for deployment to Vercel.');
console.log('Make sure your vercel.json points to the correct files:');
console.log('- API routes: dist/index.js');
console.log('- Static content: dist/public/*');