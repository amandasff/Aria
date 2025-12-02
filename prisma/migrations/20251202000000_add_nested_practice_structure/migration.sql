-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SegmentType" AS ENUM ('PIECE', 'WARMUP', 'TECHNIQUE', 'SIGHTREADING', 'OTHER');

-- CreateEnum
CREATE TYPE "PieceStatus" AS ENUM ('LEARNING', 'PRACTICING', 'PERFORMANCE_READY', 'MASTERED');

-- CreateTable
CREATE TABLE "PracticeSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalDuration" INTEGER NOT NULL DEFAULT 0,
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PracticeSession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PracticeSegment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "pieceId" TEXT,
    "title" TEXT NOT NULL,
    "type" "SegmentType" NOT NULL DEFAULT 'PIECE',
    "notes" TEXT,
    "audioUrl" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "metronomeBPM" INTEGER,
    "referenceVideoUrl" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "teacherFeedbackText" TEXT,
    "teacherFeedbackAudio" TEXT,
    "teacherFeedbackAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PracticeSegment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "PracticeSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PracticeSegment_pieceId_fkey" FOREIGN KEY ("pieceId") REFERENCES "Piece" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Piece" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "composer" TEXT,
    "studentId" TEXT NOT NULL,
    "difficulty" TEXT,
    "dateStarted" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "PieceStatus" NOT NULL DEFAULT 'LEARNING',
    "targetBPM" INTEGER,
    "defaultReferenceVideoUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Piece_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PracticeAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "segmentId" TEXT NOT NULL,
    "overallFeedback" TEXT NOT NULL,
    "piecesIdentified" TEXT,
    "timeBreakdown" TEXT,
    "suggestions" TEXT,
    "strengths" TEXT,
    "areasForImprovement" TEXT,
    "overallScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PracticeAnalysis_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "PracticeSegment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PracticeSession_studentId_idx" ON "PracticeSession"("studentId");

-- CreateIndex
CREATE INDEX "PracticeSession_createdAt_idx" ON "PracticeSession"("createdAt");

-- CreateIndex
CREATE INDEX "PracticeSegment_sessionId_idx" ON "PracticeSegment"("sessionId");

-- CreateIndex
CREATE INDEX "PracticeSegment_pieceId_idx" ON "PracticeSegment"("pieceId");

-- CreateIndex
CREATE INDEX "Piece_studentId_idx" ON "Piece"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "PracticeAnalysis_segmentId_key" ON "PracticeAnalysis"("segmentId");

-- CreateIndex
CREATE INDEX "PracticeAnalysis_segmentId_idx" ON "PracticeAnalysis"("segmentId");

