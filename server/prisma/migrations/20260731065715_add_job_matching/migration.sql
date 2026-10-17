-- CreateEnum
CREATE TYPE "public"."AnalysisStatus" AS ENUM ('IDLE', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."MatchRecommendation" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "public"."InterviewType" AS ENUM ('ONLINE', 'ONSITE', 'PHONE');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('APPLICATION', 'INTERVIEW', 'JOB', 'RESUME', 'AI', 'SYSTEM');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."InterviewStatus" ADD VALUE 'NO_SHOW';
ALTER TYPE "public"."InterviewStatus" ADD VALUE 'RESCHEDULED';

-- AlterTable
ALTER TABLE "public"."Interview" ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "durationMinutes" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "feedback" TEXT,
ADD COLUMN     "interviewType" "public"."InterviewType" NOT NULL DEFAULT 'ONLINE',
ADD COLUMN     "score" DOUBLE PRECISION,
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata';

-- AlterTable
ALTER TABLE "public"."Resume" ADD COLUMN     "analysisCompletedAt" TIMESTAMP(3),
ADD COLUMN     "analysisStartedAt" TIMESTAMP(3),
ADD COLUMN     "analysisStatus" "public"."AnalysisStatus" NOT NULL DEFAULT 'IDLE',
ADD COLUMN     "analysisVersion" TEXT DEFAULT '1.0.0',
ADD COLUMN     "atsCompatibility" DOUBLE PRECISION,
ADD COLUMN     "careerLevel" TEXT,
ADD COLUMN     "experienceLevel" TEXT,
ADD COLUMN     "formatScore" DOUBLE PRECISION,
ADD COLUMN     "grammarScore" DOUBLE PRECISION,
ADD COLUMN     "industryFit" TEXT,
ADD COLUMN     "jobReadinessScore" DOUBLE PRECISION,
ADD COLUMN     "keywordScore" DOUBLE PRECISION,
ADD COLUMN     "lastAnalyzedAt" TIMESTAMP(3),
ADD COLUMN     "missingSkills" TEXT[],
ADD COLUMN     "parsedText" TEXT,
ADD COLUMN     "recommendedSkills" TEXT[],
ADD COLUMN     "strengths" TEXT[],
ADD COLUMN     "summary" TEXT,
ADD COLUMN     "weaknesses" TEXT[];

-- CreateTable
CREATE TABLE "public"."JobMatch" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "analysisStatus" "public"."AnalysisStatus" NOT NULL DEFAULT 'QUEUED',
    "overallScore" DOUBLE PRECISION,
    "matchedSkills" TEXT[],
    "missingSkills" TEXT[],
    "strengths" TEXT[],
    "weaknesses" TEXT[],
    "summary" TEXT,
    "recommendation" "public"."MatchRecommendation",
    "analysisStartedAt" TIMESTAMP(3),
    "analysisCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "entityId" TEXT,
    "entityType" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobMatch_candidateId_idx" ON "public"."JobMatch"("candidateId");

-- CreateIndex
CREATE INDEX "JobMatch_jobId_idx" ON "public"."JobMatch"("jobId");

-- CreateIndex
CREATE INDEX "JobMatch_resumeId_idx" ON "public"."JobMatch"("resumeId");

-- CreateIndex
CREATE INDEX "JobMatch_analysisStatus_idx" ON "public"."JobMatch"("analysisStatus");

-- CreateIndex
CREATE INDEX "JobMatch_overallScore_idx" ON "public"."JobMatch"("overallScore");

-- CreateIndex
CREATE INDEX "JobMatch_createdAt_idx" ON "public"."JobMatch"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "JobMatch_resumeId_jobId_key" ON "public"."JobMatch"("resumeId", "jobId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "public"."Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "public"."Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "public"."Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Job_status_employmentType_createdAt_idx" ON "public"."Job"("status", "employmentType", "createdAt");

-- CreateIndex
CREATE INDEX "Job_recruiterId_createdAt_idx" ON "public"."Job"("recruiterId", "createdAt");

-- CreateIndex
CREATE INDEX "Resume_analysisStatus_idx" ON "public"."Resume"("analysisStatus");

-- AddForeignKey
ALTER TABLE "public"."JobMatch" ADD CONSTRAINT "JobMatch_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "public"."CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobMatch" ADD CONSTRAINT "JobMatch_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "public"."Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobMatch" ADD CONSTRAINT "JobMatch_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
