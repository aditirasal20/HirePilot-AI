-- DropForeignKey
ALTER TABLE "public"."Application" DROP CONSTRAINT "Application_candidateId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Application" DROP CONSTRAINT "Application_jobId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Interview" DROP CONSTRAINT "Interview_applicationId_fkey";

-- DropIndex
DROP INDEX "public"."User_email_idx";

-- CreateTable
CREATE TABLE "public"."CoverLetter" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "public"."AnalysisStatus" NOT NULL DEFAULT 'QUEUED',
    "generatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoverLetter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoverLetter_candidateId_idx" ON "public"."CoverLetter"("candidateId");

-- CreateIndex
CREATE INDEX "CoverLetter_status_idx" ON "public"."CoverLetter"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CoverLetter_resumeId_jobId_key" ON "public"."CoverLetter"("resumeId", "jobId");

-- CreateIndex
CREATE INDEX "Application_jobId_status_idx" ON "public"."Application"("jobId", "status");

-- CreateIndex
CREATE INDEX "Application_candidateId_appliedAt_idx" ON "public"."Application"("candidateId", "appliedAt");

-- CreateIndex
CREATE INDEX "Application_jobId_appliedAt_idx" ON "public"."Application"("jobId", "appliedAt");

-- CreateIndex
CREATE INDEX "Interview_status_idx" ON "public"."Interview"("status");

-- CreateIndex
CREATE INDEX "Interview_scheduledAt_idx" ON "public"."Interview"("scheduledAt");

-- CreateIndex
CREATE INDEX "Interview_status_scheduledAt_idx" ON "public"."Interview"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "Resume_candidateProfileId_idx" ON "public"."Resume"("candidateProfileId");

-- AddForeignKey
ALTER TABLE "public"."Application" ADD CONSTRAINT "Application_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "public"."CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Application" ADD CONSTRAINT "Application_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Interview" ADD CONSTRAINT "Interview_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CoverLetter" ADD CONSTRAINT "CoverLetter_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "public"."CandidateProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CoverLetter" ADD CONSTRAINT "CoverLetter_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "public"."Resume"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CoverLetter" ADD CONSTRAINT "CoverLetter_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
