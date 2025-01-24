-- CreateEnum
CREATE TYPE "RegionType" AS ENUM ('STATE', 'CONGRESSIONAL_DISTRICT', 'LEGISLATIVE_DISTRICT', 'COUNTY', 'CITY', 'PORT', 'SCHOOL_DISTRICT');

-- CreateEnum
CREATE TYPE "ElectionType" AS ENUM ('PRIMARY', 'GENERAL', 'SPECIAL');

-- CreateEnum
CREATE TYPE "OfficeType" AS ENUM ('EXECUTIVE', 'LEGISLATIVE', 'JUDICIAL', 'ADMINISTRATIVE', 'EDUCATIONAL', 'COMMISSIONER');

-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "type" "RegionType" NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "parentId" TEXT,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Office" (
    "id" TEXT NOT NULL,
    "type" "OfficeType" NOT NULL,
    "title" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "termLength" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "Office_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Election" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "type" "ElectionType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Election_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Race" (
    "id" TEXT NOT NULL,
    "electionId" TEXT NOT NULL,
    "officeId" TEXT NOT NULL,

    CONSTRAINT "Race_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stateId" TEXT,
    "email" TEXT,
    "website" TEXT,
    "facebook" TEXT,
    "twitter" TEXT,
    "instagram" TEXT,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateRace" (
    "candidateId" TEXT NOT NULL,
    "raceId" TEXT NOT NULL,
    "incumbent" BOOLEAN NOT NULL DEFAULT false,
    "party" TEXT,
    "elected" BOOLEAN,
    "voteCount" INTEGER,
    "votePercent" DOUBLE PRECISION,

    CONSTRAINT "CandidateRace_pkey" PRIMARY KEY ("candidateId","raceId")
);

-- CreateTable
CREATE TABLE "StateIDMapping" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3),

    CONSTRAINT "StateIDMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contribution" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "donor" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "employer" TEXT,
    "occupation" TEXT,
    "description" TEXT,
    "reportedDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contribution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Region_type_name_code_key" ON "Region"("type", "name", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Office_regionId_title_key" ON "Office"("regionId", "title");

-- CreateIndex
CREATE UNIQUE INDEX "Election_year_type_key" ON "Election"("year", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Race_electionId_officeId_key" ON "Race"("electionId", "officeId");

-- CreateIndex
CREATE UNIQUE INDEX "StateIDMapping_candidateId_year_key" ON "StateIDMapping"("candidateId", "year");

-- AddForeignKey
ALTER TABLE "Region" ADD CONSTRAINT "Region_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Office" ADD CONSTRAINT "Office_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Race" ADD CONSTRAINT "Race_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Race" ADD CONSTRAINT "Race_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateRace" ADD CONSTRAINT "CandidateRace_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateRace" ADD CONSTRAINT "CandidateRace_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StateIDMapping" ADD CONSTRAINT "StateIDMapping_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
