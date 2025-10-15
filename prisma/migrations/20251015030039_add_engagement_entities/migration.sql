-- DropForeignKey
ALTER TABLE "CandidateEngagement" DROP CONSTRAINT "CandidateEngagement_candidateId_fkey";

-- DropForeignKey
ALTER TABLE "CandidateEngagement" DROP CONSTRAINT "CandidateEngagement_engagementId_fkey";

-- AddForeignKey
ALTER TABLE "CandidateEngagement" ADD CONSTRAINT "CandidateEngagement_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "Engagement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateEngagement" ADD CONSTRAINT "CandidateEngagement_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
