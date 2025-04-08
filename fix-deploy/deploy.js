/**
 * This script prepares the project for deployment to Vercel
 * Run this script before deploying to Vercel
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Starting Vercel deployment preparation...');

// Build the project
console.log('\n1. Building the project...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✓ Build completed successfully');
} catch (error) {
  console.error('✗ Build failed:', error);
  process.exit(1);
}

// Create a specialized Vercel entry point
console.log('\n2. Creating Vercel entry point...');
const vercelEntry = `
import path from 'path';
import express from 'express';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// First, try to import the main server
import('./dist/index.js').catch(err => {
  console.error('Failed to import main server, using fallback:', err);
  
  // Fallback server in case the main server fails to import
  const app = express();
  
  // Serve static files from dist/public
  const publicDir = path.join(__dirname, 'dist', 'public');
  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));
    
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        return res.status(500).json({ error: 'API server failed to start' });
      }
      
      res.sendFile(path.join(publicDir, 'index.html'));
    });
    
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(\`Fallback server listening on port \${port}\`);
    });
  } else {
    console.error('Could not find dist/public directory');
    process.exit(1);
  }
});
`;

fs.writeFileSync(path.join(__dirname, '..', 'vercel-entry.js'), vercelEntry);
console.log('✓ Created vercel-entry.js');

// Create or update vercel.json
console.log('\n3. Updating vercel.json...');
const vercelConfig = {
  "version": 2,
  "builds": [
    {
      "src": "vercel-entry.js",
      "use": "@vercel/node"
    },
    {
      "src": "dist/public/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/vercel-entry.js"
    },
    {
      "src": "/assets/(.*)",
      "dest": "/dist/public/assets/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/dist/public/$1"
    }
  ]
};

fs.writeFileSync(
  path.join(__dirname, '..', 'vercel.json'),
  JSON.stringify(vercelConfig, null, 2)
);
console.log('✓ Updated vercel.json configuration');

// Set up ESM compatibility
console.log('\n4. Setting up ESM compatibility...');
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Make sure package.json has the correct "type": "module"
if (packageJson.type !== 'module') {
  packageJson.type = 'module';
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✓ Set "type": "module" in package.json');
} else {
  console.log('✓ package.json already has "type": "module"');
}

// Check for tsconfig.json and update it if needed
const tsconfigPath = path.join(__dirname, '..', 'tsconfig.json');
if (fs.existsSync(tsconfigPath)) {
  try {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    let updated = false;
    
    if (!tsconfig.compilerOptions) {
      tsconfig.compilerOptions = {};
      updated = true;
    }
    
    if (tsconfig.compilerOptions.module !== 'ESNext') {
      tsconfig.compilerOptions.module = 'ESNext';
      updated = true;
    }
    
    if (updated) {
      fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
      console.log('✓ Updated tsconfig.json for ESM compatibility');
    } else {
      console.log('✓ tsconfig.json already configured correctly');
    }
  } catch (error) {
    console.error('✗ Error processing tsconfig.json:', error);
  }
}

// Final summary
console.log('\n=== Vercel Deployment Preparation Complete ===');
console.log('\nYour project is now ready to be deployed to Vercel!');
console.log('\nRemember to set these environment variables in your Vercel project:');
console.log('- DATABASE_URL: Your PostgreSQL database connection string');
console.log('- OPENAI_API_KEY: Your OpenAI API key (if needed)');
console.log('- ANTHROPIC_API_KEY: Your Anthropic API key (if needed)');
console.log('- Other API keys and secrets as required by your application');
console.log('\nNext steps:');
console.log('1. Push these changes to your GitHub repository');
console.log('2. Connect the repository to Vercel');
console.log('3. Deploy your project!\n');