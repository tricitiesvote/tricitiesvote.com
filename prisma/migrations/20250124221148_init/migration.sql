-- CreateEnum
CREATE TYPE "OfficeType" AS ENUM ('CITY_COUNCIL', 'SCHOOL_BOARD', 'PORT_COMMISSIONER', 'COUNTY_COMMISSIONER', 'STATE_SENATOR', 'STATE_REPRESENTATIVE', 'SUPERIOR_COURT_JUDGE', 'US_HOUSE', 'US_SENATE', 'MAYOR', 'SHERIFF', 'PROSECUTOR');

-- CreateEnum
CREATE TYPE "EndorsementType" AS ENUM ('LETTER', 'SOCIAL', 'ORG');

-- CreateEnum
CREATE TYPE "ForAgainst" AS ENUM ('FOR', 'AGAINST');

-- CreateEnum
CREATE TYPE "ElectionType" AS ENUM ('PRIMARY', 'GENERAL', 'SPECIAL');

-- CreateTable
CREATE TABLE "Office" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "OfficeType" NOT NULL,
    "regionId" TEXT NOT NULL,
    "position" INTEGER,
    "jobTitle" TEXT NOT NULL,

    CONSTRAINT "Office_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stateId" TEXT,
    "electionYear" INTEGER NOT NULL,
    "officeId" TEXT NOT NULL,
    "incumbent" BOOLEAN NOT NULL DEFAULT false,
    "yearsInOffice" INTEGER,
    "image" TEXT,
    "bio" TEXT,
    "party" TEXT,
    "email" TEXT,
    "statement" TEXT,
    "website" TEXT,
    "facebook" TEXT,
    "twitter" TEXT,
    "instagram" TEXT,
    "youtube" TEXT,
    "pdc" TEXT,
    "donors" TEXT,
    "lettersYes" TEXT,
    "lettersNo" TEXT,
    "articles" TEXT,
    "engagement" TEXT,
    "hide" BOOLEAN NOT NULL DEFAULT false,
    "minifiler" BOOLEAN NOT NULL DEFAULT false,

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
    "termLength" INTEGER,
    "shortTerm" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CandidateRace_pkey" PRIMARY KEY ("candidateId","raceId")
);

-- CreateTable
CREATE TABLE "Race" (
    "id" TEXT NOT NULL,
    "electionYear" INTEGER NOT NULL,
    "officeId" TEXT NOT NULL,
    "type" "ElectionType" NOT NULL,
    "intro" TEXT,
    "body" TEXT,
    "hide" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Race_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guide" (
    "id" TEXT NOT NULL,
    "electionYear" INTEGER NOT NULL,
    "regionId" TEXT NOT NULL,
    "type" "ElectionType" NOT NULL,

    CONSTRAINT "Guide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Endorsement" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "endorser" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "EndorsementType" NOT NULL,
    "forAgainst" "ForAgainst" NOT NULL,

    CONSTRAINT "Endorsement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_GuideRaces" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_GuideRaces_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Office_regionId_title_key" ON "Office"("regionId", "title");

-- CreateIndex
CREATE UNIQUE INDEX "Region_name_key" ON "Region"("name");

-- CreateIndex
CREATE INDEX "_GuideRaces_B_index" ON "_GuideRaces"("B");

-- AddForeignKey
ALTER TABLE "Office" ADD CONSTRAINT "Office_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateRace" ADD CONSTRAINT "CandidateRace_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateRace" ADD CONSTRAINT "CandidateRace_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Race" ADD CONSTRAINT "Race_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guide" ADD CONSTRAINT "Guide_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Endorsement" ADD CONSTRAINT "Endorsement_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GuideRaces" ADD CONSTRAINT "_GuideRaces_A_fkey" FOREIGN KEY ("A") REFERENCES "Guide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GuideRaces" ADD CONSTRAINT "_GuideRaces_B_fkey" FOREIGN KEY ("B") REFERENCES "Race"("id") ON DELETE CASCADE ON UPDATE CASCADE;
