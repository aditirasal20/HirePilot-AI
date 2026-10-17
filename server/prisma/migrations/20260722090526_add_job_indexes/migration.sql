-- CreateIndex
CREATE INDEX "Application_candidateId_idx" ON "public"."Application"("candidateId");

-- CreateIndex
CREATE INDEX "Application_jobId_idx" ON "public"."Application"("jobId");

-- CreateIndex
CREATE INDEX "Application_resumeId_idx" ON "public"."Application"("resumeId");

-- CreateIndex
CREATE INDEX "Application_appliedAt_idx" ON "public"."Application"("appliedAt");

-- CreateIndex
CREATE INDEX "Job_status_idx" ON "public"."Job"("status");

-- CreateIndex
CREATE INDEX "Job_employmentType_idx" ON "public"."Job"("employmentType");

-- CreateIndex
CREATE INDEX "Job_location_idx" ON "public"."Job"("location");

-- CreateIndex
CREATE INDEX "Job_createdAt_idx" ON "public"."Job"("createdAt");

-- CreateIndex
CREATE INDEX "Job_status_createdAt_idx" ON "public"."Job"("status", "createdAt");
