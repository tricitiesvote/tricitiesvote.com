-- CreateEnum
CREATE TYPE "ReportedEndorserCategory" AS ENUM ('CURRENT_OFFICIAL', 'FORMER_OFFICIAL', 'ORGANIZATION', 'INDIVIDUAL');

-- CreateTable
CREATE TABLE "ReportedEndorsement" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "endorser" TEXT NOT NULL,
    "category" "ReportedEndorserCategory" NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "sourceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportedEndorsement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReportedEndorsement_candidateId_idx" ON "ReportedEndorsement"("candidateId");

-- AddForeignKey
ALTER TABLE "ReportedEndorsement" ADD CONSTRAINT "ReportedEndorsement_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
