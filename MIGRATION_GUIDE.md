# Migration Guide: Nested Practice Sessions

This guide explains how to migrate from the old flat practice session structure to the new nested structure with segments.

## Overview

The new structure introduces:
- **PracticeSession**: Parent container for a practice session (can be ACTIVE or COMPLETED)
- **PracticeSegment**: Individual recordings within a session (piece, warm-up, technique, etc.)
- **Piece**: Reusable pieces that students are working on

## Database Migration Steps

### Step 1: Run Prisma Migration

First, generate the Prisma client with the new schema:

```bash
npx prisma generate
```

Then create and apply the migration:

```bash
npx prisma migrate dev --name nested_practice_sessions
```

This will:
1. Create the new tables (PracticeSession, PracticeSegment, Piece)
2. Create the new enums (SessionStatus, SegmentType, PieceStatus)
3. Rename the old PracticeSession table to LegacyPracticeSession
4. Rename the old PracticeAnalysis table to LegacyPracticeAnalysis

### Step 2: Migrate Existing Data

After the migration, you need to convert existing LegacyPracticeSession records to the new structure.

**Option A: Manual Migration Script**

Create a script `scripts/migrate-sessions.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateSessions() {
  console.log('Starting migration...')
  
  const legacySessions = await prisma.legacyPracticeSession.findMany({
    include: {
      analysis: true,
    },
  })

  console.log(`Found ${legacySessions.length} legacy sessions to migrate`)

  for (const legacy of legacySessions) {
    // Create new PracticeSession
    const newSession = await prisma.practiceSession.create({
      data: {
        studentId: legacy.studentId,
        date: legacy.createdAt,
        totalDuration: legacy.duration,
        status: 'COMPLETED',
      },
    })

    // Create PracticeSegment from legacy session
    const segment = await prisma.practiceSegment.create({
      data: {
        sessionId: newSession.id,
        title: legacy.title,
        type: 'OTHER', // Default type since we don't have this info
        notes: legacy.description || null,
        audioUrl: legacy.audioFilePath,
        duration: legacy.duration,
        recordedAt: legacy.createdAt,
        teacherFeedbackText: legacy.teacherFeedback || null,
        teacherFeedbackAudio: legacy.teacherFeedbackAudio || null,
        teacherFeedbackAt: legacy.teacherFeedbackAt || null,
      },
    })

    // Migrate analysis if it exists
    if (legacy.analysis) {
      await prisma.practiceAnalysis.create({
        data: {
          segmentId: segment.id,
          overallFeedback: legacy.analysis.overallFeedback,
          piecesIdentified: legacy.analysis.piecesIdentified,
          timeBreakdown: legacy.analysis.timeBreakdown,
          suggestions: legacy.analysis.suggestions,
          strengths: legacy.analysis.strengths,
          areasForImprovement: legacy.analysis.areasForImprovement,
          overallScore: legacy.analysis.overallScore,
          createdAt: legacy.analysis.createdAt,
          updatedAt: legacy.analysis.updatedAt,
        },
      })
    }

    console.log(`Migrated session ${legacy.id} -> ${newSession.id}`)
  }

  console.log('Migration complete!')
}

migrateSessions()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

Run it with:
```bash
npx tsx scripts/migrate-sessions.ts
```

**Option B: SQL Migration**

If you prefer SQL, you can run this directly in your database:

```sql
-- Create new sessions from legacy sessions
INSERT INTO "PracticeSession" (id, "studentId", date, "totalDuration", status, "createdAt", "updatedAt")
SELECT 
  gen_random_uuid()::text,
  "studentId",
  "createdAt",
  duration,
  'COMPLETED',
  "createdAt",
  "updatedAt"
FROM "LegacyPracticeSession";

-- Create segments from legacy sessions
INSERT INTO "PracticeSegment" (
  id, "sessionId", title, type, notes, "audioUrl", duration, "recordedAt",
  "teacherFeedbackText", "teacherFeedbackAudio", "teacherFeedbackAt", "createdAt", "updatedAt"
)
SELECT 
  gen_random_uuid()::text,
  ps.id,
  lps.title,
  'OTHER',
  lps.description,
  lps."audioFilePath",
  lps.duration,
  lps."createdAt",
  lps."teacherFeedback",
  lps."teacherFeedbackAudio",
  lps."teacherFeedbackAt",
  lps."createdAt",
  lps."updatedAt"
FROM "LegacyPracticeSession" lps
JOIN "PracticeSession" ps ON ps."studentId" = lps."studentId" AND ps.date = lps."createdAt";

-- Migrate analyses
INSERT INTO "PracticeAnalysis" (
  id, "segmentId", "overallFeedback", "piecesIdentified", "timeBreakdown",
  suggestions, strengths, "areasForImprovement", "overallScore", "createdAt", "updatedAt"
)
SELECT 
  gen_random_uuid()::text,
  ps.id,
  lpa."overallFeedback",
  lpa."piecesIdentified",
  lpa."timeBreakdown",
  lpa.suggestions,
  lpa.strengths,
  lpa."areasForImprovement",
  lpa."overallScore",
  lpa."createdAt",
  lpa."updatedAt"
FROM "LegacyPracticeAnalysis" lpa
JOIN "LegacyPracticeSession" lps ON lps.id = lpa."sessionId"
JOIN "PracticeSession" ps2 ON ps2."studentId" = lps."studentId" AND ps2.date = lps."createdAt"
JOIN "PracticeSegment" ps ON ps."sessionId" = ps2.id AND ps."recordedAt" = lps."createdAt";
```

### Step 3: Verify Migration

Check that all data was migrated correctly:

```typescript
// Count legacy vs new
const legacyCount = await prisma.legacyPracticeSession.count()
const newSessionCount = await prisma.practiceSession.count()
const segmentCount = await prisma.practiceSegment.count()

console.log(`Legacy sessions: ${legacyCount}`)
console.log(`New sessions: ${newSessionCount}`)
console.log(`Segments: ${segmentCount}`)
```

### Step 4: Update Application Code

After migration, update your application to:
1. Use the new API endpoints (`/api/practice/session/start`, etc.)
2. Update UI components to show nested structure
3. Remove references to LegacyPracticeSession

### Step 5: Clean Up (Optional)

Once you've verified everything works, you can optionally drop the legacy tables:

```sql
DROP TABLE IF EXISTS "LegacyPracticeAnalysis";
DROP TABLE IF EXISTS "LegacyPracticeSession";
```

Or keep them for reference and add a note in your codebase.

## API Changes

### Old Endpoints (Deprecated)
- `POST /api/practice/sessions` - Create single session
- `GET /api/practice/sessions` - List sessions
- `GET /api/practice/sessions/[id]` - Get single session

### New Endpoints
- `POST /api/practice/session/start` - Start new active session
- `GET /api/practice/session/[sessionId]` - Get session with segments
- `POST /api/practice/session/[sessionId]/segment` - Add segment to session
- `PATCH /api/practice/session/[sessionId]/end` - End session
- `GET /api/pieces` - List pieces
- `POST /api/pieces` - Create piece
- `PATCH /api/pieces?id=[pieceId]` - Update piece
- `DELETE /api/pieces?id=[pieceId]` - Delete piece

## Breaking Changes

1. **PracticeSession structure**: Now contains multiple segments instead of single audio
2. **Analysis location**: Analysis now links to PracticeSegment instead of PracticeSession
3. **Audio storage**: Each segment has its own audio file
4. **Session status**: Sessions can be ACTIVE (in progress) or COMPLETED

## Rollback Plan

If you need to rollback:
1. Keep LegacyPracticeSession tables
2. Revert Prisma schema changes
3. Restore old API endpoints
4. Revert UI changes

The legacy data remains intact, so you can always migrate again.

