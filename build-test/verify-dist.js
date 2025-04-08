/**
 * This script checks if the build output directory has all required files
 * Run this after a build and before deploying to verify the output is correct
 */

const fs = require('fs');
const path = require('path');

// Function to check if a file exists
function checkFileExists(filePath, description) {
  if (fs.existsSync(filePath)) {
    console.log(`✓ Found ${description} at ${filePath}`);
    return true;
  } else {
    console.error(`✗ ERROR: Missing ${description} at ${filePath}`);
    return false;
  }
}

// Start verification
console.log('\n=== Verifying Build Output ===\n');

// Check if dist directory exists
const distDir = path.join(__dirname, '..', 'dist');
if (!checkFileExists(distDir, 'dist directory')) {
  console.log('\nRun "npm run build" first to create the dist directory');
  process.exit(1);
}

// Check server files
console.log('\n--- Server Files ---');
const serverFile = path.join(distDir, 'index.js');
checkFileExists(serverFile, 'server entry point');

// Check client files
console.log('\n--- Client Files ---');
const publicDir = path.join(distDir, 'public');
checkFileExists(publicDir, 'public directory');

if (fs.existsSync(publicDir)) {
  const indexHtml = path.join(publicDir, 'index.html');
  const assetsDir = path.join(publicDir, 'assets');
  
  checkFileExists(indexHtml, 'index.html');
  checkFileExists(assetsDir, 'assets directory');
  
  // If assets directory exists, check if it has files
  if (fs.existsSync(assetsDir)) {
    const assetFiles = fs.readdirSync(assetsDir);
    if (assetFiles.length > 0) {
      console.log(`✓ Found ${assetFiles.length} files in assets directory`);
      
      // Print up to 5 asset files as examples
      const filesToShow = assetFiles.slice(0, 5);
      console.log('  Sample assets:');
      filesToShow.forEach(file => {
        console.log(`  - ${file}`);
      });
      
      if (assetFiles.length > 5) {
        console.log(`  ... and ${assetFiles.length - 5} more files`);
      }
    } else {
      console.error('✗ WARNING: Assets directory is empty');
    }
  }
}

// Check vercel.json
console.log('\n--- Deployment Configuration ---');
const vercelJson = path.join(__dirname, '..', 'vercel.json');
checkFileExists(vercelJson, 'vercel.json configuration');

if (fs.existsSync(vercelJson)) {
  try {
    const vercelConfig = JSON.parse(fs.readFileSync(vercelJson, 'utf8'));
    console.log('✓ vercel.json is valid JSON');
    
    // Check if vercel.json has the expected configuration
    if (vercelConfig.routes && vercelConfig.routes.length > 0) {
      console.log(`✓ vercel.json has ${vercelConfig.routes.length} route configuration(s)`);
    } else {
      console.error('✗ WARNING: vercel.json missing routes configuration');
    }
    
    if (vercelConfig.builds && vercelConfig.builds.length > 0) {
      console.log(`✓ vercel.json has ${vercelConfig.builds.length} build configuration(s)`);
    } else {
      console.error('✗ WARNING: vercel.json missing builds configuration');
    }
  } catch (error) {
    console.error('✗ ERROR: vercel.json is not valid JSON:', error.message);
  }
}

// Summary
console.log('\n=== Verification Complete ===\n');
console.log('If all checks passed, your build should be ready for Vercel deployment.');
console.log('Make sure to set up all required environment variables in your Vercel project:');
console.log('- DATABASE_URL: Your PostgreSQL database connection string');
console.log('- OPENAI_API_KEY: Your OpenAI API key');
console.log('- ANTHROPIC_API_KEY: Your Anthropic API key (if using Claude)');
console.log('- And any other secrets your application requires');