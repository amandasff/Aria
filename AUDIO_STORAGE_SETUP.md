# Audio Storage Setup Guide

## Problem
Vercel's serverless functions don't support persistent file storage. The current code tries to write files to the local filesystem, which doesn't work in production on Vercel.

## Solution: Vercel Blob Storage

Vercel Blob Storage is the recommended solution for storing files on Vercel. Here's how to set it up:

### Step 1: Install Vercel Blob

```bash
npm install @vercel/blob
```

### Step 2: Get Your Blob Store Token

1. Go to your Vercel dashboard
2. Navigate to your project settings
3. Go to the "Storage" tab
4. Create a new Blob store (or use an existing one)
5. Copy the `BLOB_READ_WRITE_TOKEN` from the environment variables

### Step 3: Add Environment Variable

Add this to your Vercel environment variables:
- `BLOB_READ_WRITE_TOKEN` - Your Vercel Blob token

### Step 4: Update Code

The code has been updated to use Vercel Blob Storage. The API route at `src/app/api/practice/sessions/route.ts` now:
- Uploads audio files to Vercel Blob Storage
- Stores the blob URL in the database
- Retrieves audio from Blob Storage when needed

### Alternative Solutions

If you prefer not to use Vercel Blob Storage, you can use:

1. **AWS S3** - More control, pay-as-you-go
2. **Cloudinary** - Good for media files, has free tier
3. **Supabase Storage** - If you're already using Supabase
4. **Google Cloud Storage** - Enterprise solution

### Local Development

For local development, the code will still try to use the filesystem. Make sure you have write permissions in the `uploads/audio` directory.

### Migration

If you have existing sessions with local file paths, you'll need to:
1. Upload existing files to Blob Storage
2. Update the database records with new blob URLs
3. Or create a migration script

