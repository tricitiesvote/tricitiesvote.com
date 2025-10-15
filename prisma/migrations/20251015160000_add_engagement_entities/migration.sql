-- CreateTable
CREATE TABLE "Engagement" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3),
    "primaryLink" TEXT,
    "secondaryLink" TEXT,
    "secondaryLinkTitle" TEXT,
    "notes" TEXT,
    "raceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Engagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateEngagement" (
    "engagementId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "participated" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateEngagement_pkey" PRIMARY KEY ("engagementId","candidateId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Engagement_slug_key" ON "Engagement"("slug");

-- CreateIndex
CREATE INDEX "Engagement_raceId_idx" ON "Engagement"("raceId");

-- CreateIndex
CREATE INDEX "Engagement_date_idx" ON "Engagement"("date");

-- CreateIndex
CREATE INDEX "CandidateEngagement_candidateId_idx" ON "CandidateEngagement"("candidateId");

-- AddForeignKey
ALTER TABLE "Engagement" ADD CONSTRAINT "Engagement_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateEngagement" ADD CONSTRAINT "CandidateEngagement_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "Engagement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateEngagement" ADD CONSTRAINT "CandidateEngagement_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
