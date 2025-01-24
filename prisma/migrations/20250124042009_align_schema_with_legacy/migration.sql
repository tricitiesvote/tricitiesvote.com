-- Create new enums
CREATE TYPE "EndorsementType" AS ENUM ('LETTER', 'SOCIAL', 'ORG');
CREATE TYPE "ForAgainst" AS ENUM ('FOR', 'AGAINST');
CREATE TYPE "OfficeType_new" AS ENUM (
  'City Council',
  'School Board',
  'Port Commissioner',
  'County Commissioner',
  'WA Legislator (Senate)',
  'WA Legislator (House)',
  'Superior Court Judge',
  'U.S. House',
  'U.S. Senate',
  'Mayor',
  'Sheriff',
  'Prosecutor'
);

-- First create a temporary text column
ALTER TABLE "Office" ADD COLUMN "type_new" "OfficeType_new";

-- Update the temporary column with mapped values
UPDATE "Office" 
SET "type_new" = CASE 
  WHEN "type"::text = 'EXECUTIVE' THEN 'Mayor'::OfficeType_new
  WHEN "type"::text = 'LEGISLATIVE' THEN 'City Council'::OfficeType_new
  WHEN "type"::text = 'JUDICIAL' THEN 'Superior Court Judge'::OfficeType_new
  WHEN "type"::text = 'ADMINISTRATIVE' THEN 'Sheriff'::OfficeType_new
  WHEN "type"::text = 'EDUCATIONAL' THEN 'School Board'::OfficeType_new
  WHEN "type"::text = 'COMMISSIONER' THEN 'Port Commissioner'::OfficeType_new
  ELSE 'City Council'::OfficeType_new
END;

-- Drop the old type column and rename the new one
ALTER TABLE "Office" DROP COLUMN "type";
ALTER TABLE "Office" RENAME COLUMN "type_new" TO "type";
ALTER TABLE "Office" ALTER COLUMN "type" SET NOT NULL;

-- Drop the old enum
DROP TYPE IF EXISTS "OfficeType";
ALTER TYPE "OfficeType_new" RENAME TO "OfficeType";

-- Add jobTitle as nullable first
ALTER TABLE "Office" ADD COLUMN "jobTitle" TEXT;

-- Set default jobTitles based on type
UPDATE "Office" 
SET "jobTitle" = CASE 
  WHEN "type" = 'City Council' THEN 'Council member'
  WHEN "type" = 'School Board' THEN 'Board member'
  WHEN "type" = 'Port Commissioner' THEN 'Commissioner'
  WHEN "type" = 'County Commissioner' THEN 'Commissioner'
  WHEN "type" = 'WA Legislator (Senate)' THEN 'Senator'
  WHEN "type" = 'WA Legislator (House)' THEN 'Representative'
  WHEN "type" = 'Superior Court Judge' THEN 'Judge'
  WHEN "type" = 'U.S. House' THEN 'Representative'
  WHEN "type" = 'U.S. Senate' THEN 'Senator'
  WHEN "type" = 'Mayor' THEN 'Mayor'
  WHEN "type" = 'Sheriff' THEN 'Sheriff'
  WHEN "type" = 'Prosecutor' THEN 'Prosecutor'
END;

-- Now make jobTitle required
ALTER TABLE "Office" ALTER COLUMN "jobTitle" SET NOT NULL;

-- Add position as Integer (nullable)
ALTER TABLE "Office" ADD COLUMN "position" INTEGER;

-- Extract positions from existing titles where possible
UPDATE "Office"
SET "position" = NULLIF(regexp_replace(title, '^.*Pos(?:ition)?\s*(\d+).*$', '\1'), '')::INTEGER
WHERE title ~ 'Pos(ition)?\s*\d+';

-- Handle Region changes
ALTER TABLE "Region" DROP COLUMN IF EXISTS "type";
ALTER TABLE "Region" DROP COLUMN IF EXISTS "parentId";
ALTER TABLE "Region" ADD CONSTRAINT "Region_name_key" UNIQUE ("name");

-- Drop old tables and types that we're replacing
DROP TABLE IF EXISTS "Contribution";
DROP TABLE IF EXISTS "Election";
DROP TABLE IF EXISTS "StateIDMapping";
DROP TYPE IF EXISTS "ElectionStatus";
DROP TYPE IF EXISTS "RegionType";

-- Add new columns to Candidate
ALTER TABLE "Candidate" 
  ADD COLUMN IF NOT EXISTS "articles" TEXT,
  ADD COLUMN IF NOT EXISTS "bio" TEXT,
  ADD COLUMN IF NOT EXISTS "donors" TEXT,
  ADD COLUMN IF NOT EXISTS "electionYear" INTEGER,
  ADD COLUMN IF NOT EXISTS "engagement" TEXT,
  ADD COLUMN IF NOT EXISTS "hide" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "image" TEXT,
  ADD COLUMN IF NOT EXISTS "incumbent" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "lettersNo" TEXT,
  ADD COLUMN IF NOT EXISTS "lettersYes" TEXT,
  ADD COLUMN IF NOT EXISTS "minifiler" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "officeId" TEXT,
  ADD COLUMN IF NOT EXISTS "party" TEXT,
  ADD COLUMN IF NOT EXISTS "pdc" TEXT,
  ADD COLUMN IF NOT EXISTS "statement" TEXT,
  ADD COLUMN IF NOT EXISTS "yearsInOffice" INTEGER,
  ADD COLUMN IF NOT EXISTS "youtube" TEXT;

-- Set default election year for existing candidates
UPDATE "Candidate" SET "electionYear" = 2023 WHERE "electionYear" IS NULL;
ALTER TABLE "Candidate" ALTER COLUMN "electionYear" SET NOT NULL;

-- Add termLength and shortTerm to CandidateRace
ALTER TABLE "CandidateRace" ADD COLUMN IF NOT EXISTS "termLength" INTEGER;
ALTER TABLE "CandidateRace" ADD COLUMN IF NOT EXISTS "shortTerm" BOOLEAN DEFAULT false;

-- Modify Race table
ALTER TABLE "Race" DROP COLUMN IF EXISTS "electionId";
ALTER TABLE "Race" ADD COLUMN IF NOT EXISTS "electionYear" INTEGER DEFAULT 2023;
ALTER TABLE "Race" ADD COLUMN IF NOT EXISTS "type" "ElectionType" DEFAULT 'GENERAL'::"ElectionType";
ALTER TABLE "Race" ADD COLUMN IF NOT EXISTS "intro" TEXT;
ALTER TABLE "Race" ADD COLUMN IF NOT EXISTS "body" TEXT;
ALTER TABLE "Race" ADD COLUMN IF NOT EXISTS "hide" BOOLEAN DEFAULT false;

ALTER TABLE "Race" ALTER COLUMN "electionYear" SET NOT NULL;
ALTER TABLE "Race" ALTER COLUMN "type" SET NOT NULL;

-- Create Guide table and relationships
CREATE TABLE IF NOT EXISTS "Guide" (
  "id" TEXT NOT NULL,
  "electionYear" INTEGER NOT NULL,
  "regionId" TEXT NOT NULL,
  "type" "ElectionType" NOT NULL,
  CONSTRAINT "Guide_pkey" PRIMARY KEY ("id")
);

-- Create Endorsement table
CREATE TABLE IF NOT EXISTS "Endorsement" (
  "id" TEXT NOT NULL,
  "candidateId" TEXT NOT NULL,
  "endorser" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "type" "EndorsementType" NOT NULL,
  "forAgainst" "ForAgainst" NOT NULL,
  CONSTRAINT "Endorsement_pkey" PRIMARY KEY ("id")
);

-- Create joining table for Guide-Race many-to-many
CREATE TABLE IF NOT EXISTS "_GuideRaces" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL,
  CONSTRAINT "_GuideRaces_AB_pkey" PRIMARY KEY ("A","B")
);

-- Add necessary indexes
CREATE INDEX IF NOT EXISTS "_GuideRaces_B_index" ON "_GuideRaces"("B");

-- Add foreign key constraints
ALTER TABLE "Guide" ADD CONSTRAINT "Guide_regionId_fkey" 
  FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Endorsement" ADD CONSTRAINT "Endorsement_candidateId_fkey" 
  FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "_GuideRaces" ADD CONSTRAINT "_GuideRaces_A_fkey" 
  FOREIGN KEY ("A") REFERENCES "Guide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_GuideRaces" ADD CONSTRAINT "_GuideRaces_B_fkey" 
  FOREIGN KEY ("B") REFERENCES "Race"("id") ON DELETE CASCADE ON UPDATE CASCADE;