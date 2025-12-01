# Teacher Feedback Migration

## Step 1: Run the Migration

The database schema has been updated to include teacher feedback fields. You need to run the migration:

### On Vercel (Production):
The migration will run automatically on the next deployment, OR you can run it manually:

1. Go to your Vercel project settings
2. Navigate to the "Storage" or "Database" section
3. Run: `npx prisma migrate deploy`

### Locally:
```bash
npx prisma migrate deploy
```

Or if you want to create a new migration:
```bash
npx prisma migrate dev
```

## Step 2: Verify Migration

After running the migration, the `PracticeSession` table should have these new columns:
- `teacherFeedback` (TEXT, nullable)
- `teacherFeedbackAudio` (TEXT, nullable) 
- `teacherFeedbackAt` (TIMESTAMP, nullable)

## What's New

### For Teachers:
- ✅ Can see student notes/descriptions on practice sessions
- ✅ Can provide text feedback
- ✅ Can record audio feedback
- ✅ Can edit existing feedback

### For Students:
- ✅ Can see teacher feedback (text and audio) on their practice sessions
- ✅ Feedback appears in both the session list and analysis modal

## API Endpoint

New endpoint: `POST /api/practice/sessions/[id]/feedback`

Requires:
- Teacher authentication
- Either `feedback` (text) or `audioData` (base64 audio)

Returns:
- Updated session with feedback

