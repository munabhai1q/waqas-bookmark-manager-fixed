/**
 * IMPORTANT: This is an extremely simplified Vercel deployment script
 * Use this when other deployment methods are failing
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Starting simplified Vercel deployment preparation...');

// Build the app
console.log('\n1. Building the application...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✓ Build completed');
} catch (error) {
  console.error('✗ Build failed:', error);
  process.exit(1);
}

// Create or ensure the 'public' directory exists
console.log('\n2. Setting up public directory...');
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
  console.log('✓ Created public directory');
} else {
  console.log('✓ Public directory already exists');
}

// Copy built files to public
console.log('\n3. Copying build files to public directory...');
const distPublicDir = path.join(__dirname, '..', 'dist', 'public');

if (fs.existsSync(distPublicDir)) {
  // List files in dist/public
  const files = fs.readdirSync(distPublicDir);
  console.log(`Found ${files.length} files in dist/public`);
  
  // Copy each file to public
  files.forEach(file => {
    const srcPath = path.join(distPublicDir, file);
    const destPath = path.join(publicDir, file);
    
    if (fs.lstatSync(srcPath).isDirectory()) {
      // Copy directory recursively
      const copyDir = (src, dest) => {
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true });
        }
        
        const entries = fs.readdirSync(src);
        for (const entry of entries) {
          const srcEntry = path.join(src, entry);
          const destEntry = path.join(dest, entry);
          
          if (fs.lstatSync(srcEntry).isDirectory()) {
            copyDir(srcEntry, destEntry);
          } else {
            fs.copyFileSync(srcEntry, destEntry);
          }
        }
      };
      
      copyDir(srcPath, destPath);
      console.log(`✓ Copied directory: ${file}`);
    } else {
      // Copy file
      fs.copyFileSync(srcPath, destPath);
      console.log(`✓ Copied file: ${file}`);
    }
  });
} else {
  console.error('✗ ERROR: dist/public directory not found!');
  console.log('Creating a minimal index.html as fallback...');
  
  // Create a basic index.html as fallback
  const fallbackHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WAQAS BOOKMARK</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background-color: #f5f5f5;
      flex-direction: column;
    }
    .container {
      text-align: center;
      padding: 2rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      max-width: 500px;
    }
    h1 {
      color: #6366f1;
    }
    p {
      color: #4b5563;
      margin-bottom: 1.5rem;
    }
    .button {
      background-color: #6366f1;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      text-decoration: none;
      display: inline-block;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>WAQAS BOOKMARK</h1>
    <p>Your bookmark manager is getting set up.</p>
    <p>This is a temporary placeholder page.</p>
    <a href="/" class="button">Refresh</a>
  </div>
</body>
</html>
  `;
  
  fs.writeFileSync(path.join(publicDir, 'index.html'), fallbackHtml);
  console.log('✓ Created fallback index.html');
}

// Copy the Vercel configuration
console.log('\n4. Setting up Vercel configuration...');
fs.copyFileSync(
  path.join(__dirname, 'vercel.json'),
  path.join(__dirname, '..', 'vercel.json')
);
console.log('✓ Copied vercel.json to root directory');

// Copy the server file
console.log('\n5. Setting up server file...');
fs.copyFileSync(
  path.join(__dirname, 'index.js'),
  path.join(__dirname, '..', 'index.js')
);
console.log('✓ Copied server index.js to root directory');

console.log('\n=== Simplified Vercel Deployment Preparation Complete ===');
console.log('\nDirections:');
console.log('1. Push these changes to your GitHub repository');
console.log('2. Import the repository in Vercel');
console.log('3. Make sure to add any required environment variables');
console.log('4. Deploy!');
