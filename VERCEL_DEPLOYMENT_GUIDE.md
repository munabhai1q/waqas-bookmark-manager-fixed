# Vercel Deployment Guide

This guide explains how to properly deploy this application on Vercel.

## Prerequisites

1. A Vercel account
2. The Vercel CLI installed (optional but recommended)
3. The GitHub repository connected to Vercel

## Deployment Steps

### Step 1: Setup Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure the project settings:
   - Framework Preset: Other
   - Root Directory: ./
   - Build Command: `node vercel-deploy.js && cd client && npm run build`
   - Output Directory: client/public

### Step 2: Configure Environment Variables

Make sure to add these environment variables in the Vercel project settings:

- `DATABASE_URL`: Your PostgreSQL database connection string
- `OPENAI_API_KEY`: Your OpenAI API key (if using OpenAI features)
- `ANTHROPIC_API_KEY`: Your Anthropic API key (if using Claude)
- Any other API keys or secrets your app uses

### Step 3: Deploy

Click "Deploy" in the Vercel interface.

## Troubleshooting

If you see source code instead of your application:

1. Check the build logs for any errors
2. Make sure the `vercel.json` file is at the root of your repository
3. Ensure your build command is set correctly to `node vercel-deploy.js && cd client && npm run build`
4. Verify the output directory is set to `client/public`

## Alternative Deployment Options

For a simpler deployment experience, consider:

1. **Replit Deployment**: Follow the instructions in FIXED_DEPLOYMENT_INSTRUCTIONS.md
2. **Netlify**: Similar to Vercel but may require different configuration
3. **Railway.app**: Good for full-stack apps with databases

## Questions?

If you have trouble deploying, you can:
- Check Vercel documentation
- Look at build logs in the Vercel dashboard
- Review the error messages in the deployment process