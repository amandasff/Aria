# Step-by-Step Database Setup Guide

## Step 1: Create Database on Railway

1. Go to https://railway.app in your browser
2. Click "Start a New Project" or "Login" (sign in with GitHub if prompted)
3. Click "New Project"
4. Click "Add Service" or "Provision PostgreSQL" (look for PostgreSQL option)
5. Wait 30-60 seconds for it to create
6. Click on the PostgreSQL service that was created
7. Click on the "Variables" tab
8. Find the line that says `DATABASE_URL` or `POSTGRES_URL`
9. Click the "Copy" button next to it
10. **Save this somewhere** - you'll need it in a minute!

## Step 2: Add Database URL to Vercel

1. Go to https://vercel.com in your browser
2. Click on your project (should be called "Aria" or "music-practice-platform")
3. Click "Settings" (top menu)
4. Click "Environment Variables" (left sidebar)
5. Click "Add New" button
6. In the "Key" field, type: `DATABASE_URL`
7. In the "Value" field, paste the Railway URL you copied (should start with `postgresql://`)
8. Make sure all three checkboxes are checked: Production, Preview, Development
9. Click "Save"

## Step 3: Add Other Environment Variables

Repeat Step 2 for each of these (click "Add New" for each one):

### JWT_SECRET
- Key: `JWT_SECRET`
- Value: `fe7200c747cd09064417338b4c41385eb8449a5c21c2528f8eea78130784dc57`
- Check all three boxes

### ANTHROPIC_API_KEY
- Key: `ANTHROPIC_API_KEY`
- Value: (get this from your .env file - look for the line starting with `ANTHROPIC_API_KEY=`)
- Check all three boxes

### NEXT_PUBLIC_APP_URL
- Key: `NEXT_PUBLIC_APP_URL`
- Value: Your Vercel URL (looks like `https://aria-xxxxx.vercel.app` - you can find this on your Vercel project page)
- Check all three boxes

### AUDIO_STORAGE_PATH
- Key: `AUDIO_STORAGE_PATH`
- Value: `./uploads/audio`
- Check all three boxes

## Step 4: Run Database Migrations

1. Open PowerShell or Command Prompt on your computer
2. Navigate to your project folder:
   ```powershell
   cd C:\Users\amand\music-practice-platform
   ```
3. Run this command (replace YOUR_RAILWAY_URL with the actual URL you copied):
   ```powershell
   $env:DATABASE_URL="YOUR_RAILWAY_URL_HERE"
   npx prisma migrate deploy
   ```
   
   For example, if your Railway URL is `postgresql://postgres:abc123@containers-us-west-123.railway.app:5432/railway`, you would run:
   ```powershell
   $env:DATABASE_URL="postgresql://postgres:abc123@containers-us-west-123.railway.app:5432/railway"
   npx prisma migrate deploy
   ```

4. Wait for it to finish - you should see messages like "Applying migration..." and "All migrations have been successfully applied"

## Step 5: Redeploy on Vercel

1. Go back to https://vercel.com
2. Click on your project
3. Click "Deployments" (top menu)
4. Find the latest deployment
5. Click the "..." (three dots) menu on the right
6. Click "Redeploy"
7. Wait 2-3 minutes for it to finish

## Step 6: Test

1. Go to your Vercel website URL
2. Try to sign up or sign in
3. It should work now!

## Troubleshooting

If you still get errors:

1. **Check Vercel Logs:**
   - Go to Vercel → Your Project → "Functions" tab
   - Try signing in again
   - Look at the logs to see the error message
   - Copy the error and let me know what it says

2. **Verify DATABASE_URL:**
   - Make sure it starts with `postgresql://`
   - Make sure there are no extra spaces
   - Make sure you copied the whole thing

3. **Check Migrations:**
   - Run `npx prisma migrate deploy` again with your DATABASE_URL
   - Make sure it says "All migrations have been successfully applied"

