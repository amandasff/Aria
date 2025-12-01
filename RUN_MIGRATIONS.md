# How to Run Database Migrations

## Step 1: Get Your Railway Database URL

1. Go to https://railway.app
2. Click on your project
3. Click on the **PostgreSQL** service
4. Click on the **"Variables"** tab
5. Find the variable called **`DATABASE_PUBLIC_URL`** (NOT `DATABASE_URL`)
6. Click the **eye icon** 👁️ to reveal the hidden value
7. Click the **copy icon** 📋 to copy the full URL
8. It should look like: `postgresql://postgres:password@containers-us-west-123.railway.app:5432/railway`

## Step 2: Run Migrations

### Option A: Using PowerShell (Windows)

1. Open PowerShell
2. Navigate to your project:
   ```powershell
   cd C:\Users\amand\music-practice-platform
   ```

3. Set the DATABASE_URL and run migrations (replace YOUR_URL with the actual URL you copied):
   ```powershell
   $env:DATABASE_URL="postgresql://postgres:password@containers-us-west-123.railway.app:5432/railway"
   npx prisma migrate deploy
   ```

   **Important:** Replace the URL above with your actual Railway URL!

### Option B: One-Line Command

You can also do it in one line:
```powershell
$env:DATABASE_URL="YOUR_RAILWAY_URL_HERE"; npx prisma migrate deploy
```

## Step 3: What You Should See

If it works, you'll see output like:
```
Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma
Datasource "db": PostgreSQL database

Applying migration `20241130032017_init`
✔ Applied migration `20241130032017_init` in 234ms

✔ All migrations have been successfully applied.
```

## Step 4: Verify It Worked

After migrations complete, try signing up on your Vercel site again. It should work now!

## Troubleshooting

**Error: "Can't reach database server"**
- Make sure you're using `DATABASE_PUBLIC_URL` (not `DATABASE_URL`)
- Make sure the URL starts with `postgresql://`
- Make sure there are no extra spaces

**Error: "Migration already applied"**
- That's okay! It means the tables already exist
- You can proceed to test your site

**Error: "No migrations found"**
- Run this first: `npx prisma migrate dev --name init`
- Then run: `npx prisma migrate deploy`

