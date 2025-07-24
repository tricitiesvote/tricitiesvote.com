-- CreateTable
CREATE TABLE "Contribution" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "electionYear" INTEGER NOT NULL,
    "donorName" TEXT NOT NULL,
    "donorCity" TEXT,
    "donorState" TEXT,
    "donorZip" TEXT,
    "donorEmployer" TEXT,
    "donorOccupation" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "cashOrInKind" TEXT,

    CONSTRAINT "Contribution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Contribution_candidateId_idx" ON "Contribution"("candidateId");

-- CreateIndex
CREATE INDEX "Contribution_electionYear_idx" ON "Contribution"("electionYear");

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
