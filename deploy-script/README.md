# Deployment Fix Script

This folder contains scripts to fix the Replit deployment issue.

## How to Use

Before deploying your app on Replit, run:

```bash
node deploy-script/deploy.mjs
```

This will ensure that the static assets are properly copied to the right location for deployment.

## What It Does

The script:
1. Runs the build process (`npm run build`)
2. Copies the built static files from `dist/public` to the correct location in `dist/`
3. This ensures that the server can find the static files when deployed

