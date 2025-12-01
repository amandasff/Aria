# Fix Vercel Database URL - Step by Step

## The Problem
Vercel is trying to use `postgres.railway.internal:5432` which only works inside Railway's network, not from Vercel.

## The Solution
Update Vercel to use the **public** Railway URL instead.

## Step-by-Step Fix

### Step 1: Get Your Public Database URL
You already have this! It's:
```
postgresql://postgres:iAHgbuEDFnnRwSiiXsLpYJxhhWXLrDor@switchback.proxy.rlwy.net:54384/railway
```

### Step 2: Update Vercel (IMPORTANT!)

1. **Go to Vercel:**
   - Open https://vercel.com
   - Click on your project (should be "Aria")

2. **Go to Environment Variables:**
   - Click **"Settings"** (top menu)
   - Click **"Environment Variables"** (left sidebar)

3. **Find and Edit DATABASE_URL:**
   - Look for the row that says **`DATABASE_URL`**
   - Click on it (or click the **"..."** menu on the right and select "Edit")

4. **Replace the Value:**
   - **DELETE** the old value (the one with `railway.internal`)
   - **PASTE** this new value:
     ```
     postgresql://postgres:iAHgbuEDFnnRwSiiXsLpYJxhhWXLrDor@switchback.proxy.rlwy.net:54384/railway
     ```

5. **Check the Boxes:**
   - Make sure all three are checked:
     - ☑ Production
     - ☑ Preview  
     - ☑ Development

6. **Save:**
   - Click **"Save"** button

### Step 3: Redeploy

After saving, Vercel should automatically redeploy. If not:

1. Go to **"Deployments"** tab
2. Click **"..."** on the latest deployment
3. Click **"Redeploy"**
4. Wait 2-3 minutes

### Step 4: Test

1. Go to your Vercel website
2. Try signing in
3. It should work now! ✅

## Quick Checklist

- [ ] Found DATABASE_URL in Vercel Environment Variables
- [ ] Replaced value with public URL (switchback.proxy.rlwy.net)
- [ ] Checked all three environment boxes
- [ ] Saved the changes
- [ ] Redeployed (or waited for auto-redeploy)
- [ ] Tested sign in

## Still Not Working?

If it still doesn't work after updating:

1. **Double-check the URL:**
   - Make sure it starts with `postgresql://`
   - Make sure it ends with `railway` (not `railway.internal`)
   - Make sure there are no extra spaces

2. **Check Vercel Logs:**
   - Go to Vercel → Your Project → "Functions" tab
   - Try signing in
   - Look at the logs - it should show the DATABASE_URL being used
   - If it still shows `railway.internal`, the environment variable didn't update

3. **Try deleting and re-adding:**
   - Delete the DATABASE_URL variable
   - Add it again with the public URL
   - Redeploy

