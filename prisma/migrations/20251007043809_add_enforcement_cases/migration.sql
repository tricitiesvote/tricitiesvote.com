-- CreateTable
CREATE TABLE "EnforcementCase" (
    "id" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "opened" TIMESTAMP(3) NOT NULL,
    "complainant" TEXT NOT NULL,
    "respondent" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "areasOfLaw" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "candidateId" TEXT,
    "matchConfidence" DOUBLE PRECISION,
    "manuallyReviewed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnforcementCase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EnforcementCase_caseNumber_key" ON "EnforcementCase"("caseNumber");

-- CreateIndex
CREATE INDEX "EnforcementCase_candidateId_idx" ON "EnforcementCase"("candidateId");

-- CreateIndex
CREATE INDEX "EnforcementCase_status_idx" ON "EnforcementCase"("status");

-- AddForeignKey
ALTER TABLE "EnforcementCase" ADD CONSTRAINT "EnforcementCase_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
