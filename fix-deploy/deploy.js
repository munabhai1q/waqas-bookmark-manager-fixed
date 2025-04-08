// This script copies the built static files to the correct location for Replit deployment
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Run the build process
console.log('Building the application...');
execSync('npm run build', { stdio: 'inherit' });

// Create a symbolic link or copy the files
console.log('Copying static assets for deployment...');
const sourceDir = path.resolve(__dirname, '../dist/public');
const targetDir = path.resolve(__dirname, '../dist');

try {
  // Copy index.html to the root dist directory
  fs.copyFileSync(
    path.join(sourceDir, 'index.html'),
    path.join(targetDir, 'index.html')
  );
  
  // Copy assets folder
  const assetsDir = path.join(sourceDir, 'assets');
  const targetAssetsDir = path.join(targetDir, 'assets');
  
  if (!fs.existsSync(targetAssetsDir)) {
    fs.mkdirSync(targetAssetsDir, { recursive: true });
  }
  
  const assetFiles = fs.readdirSync(assetsDir);
  assetFiles.forEach(file => {
    fs.copyFileSync(
      path.join(assetsDir, file),
      path.join(targetAssetsDir, file)
    );
  });
  
  console.log('Assets copied successfully for deployment!');
} catch (error) {
  console.error('Error preparing files for deployment:', error);
  process.exit(1);
}
