const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Output some useful information
console.log('Starting Vercel deployment preparation...');
console.log('Current directory:', process.cwd());
console.log('Files in current directory:', fs.readdirSync('.'));

// Create a special build for Vercel
try {
  // Build the client application
  console.log('Building client application...');
  execSync('cd client && npm run build', { stdio: 'inherit' });
  
  // If the build directory is different from what Vercel expects, copy files
  console.log('Setting up files for Vercel deployment...');
  
  // Make sure the public directory exists in the client directory
  if (!fs.existsSync('./client/public')) {
    fs.mkdirSync('./client/public', { recursive: true });
  }
  
  // Copy the built files to the client/public directory
  if (fs.existsSync('./dist/public')) {
    console.log('Copying from dist/public to client/public...');
    copyRecursive('./dist/public', './client/public');
  }
  
  console.log('Vercel deployment preparation complete!');
} catch (error) {
  console.error('Error during build:', error);
  process.exit(1);
}

// Helper function to copy files recursively
function copyRecursive(src, dest) {
  if (fs.statSync(src).isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      const srcPath = path.join(src, entry);
      const destPath = path.join(dest, entry);
      copyRecursive(srcPath, destPath);
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}