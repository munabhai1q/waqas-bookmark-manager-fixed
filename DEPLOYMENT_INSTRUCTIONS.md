# How to Deploy This Project Correctly

Follow these steps exactly to properly deploy this application on Replit:

## Step 1: Run the deployment preparation script

```bash
node deploy-script/deploy.mjs
```

This script:
1. Builds the application
2. Copies static files to the correct location

## Step 2: Create a Custom Domain (Optional but recommended)

1. Go to your Replit project settings
2. Under the "Domains" section, add a custom domain
3. This allows your app to be accessible via a clean URL

## Step 3: Deploy

1. Click the "Deploy" button in Replit
2. Wait for the deployment process to complete
3. The deployment will work because the static files have been properly copied

## Troubleshooting

If you see source code instead of the actual website:
1. Make sure you ran `node deploy-script/deploy.mjs` before deploying
2. Try clearing your browser cache or opening in incognito/private mode
3. Check that the build was successful (no errors in the console)

