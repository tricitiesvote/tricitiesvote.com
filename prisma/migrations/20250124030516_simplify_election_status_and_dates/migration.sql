-- CreateEnum
CREATE TYPE "ElectionStatus" AS ENUM ('PRIMARY', 'GENERAL', 'UNOFFICIAL', 'FINALIZED');

-- AlterTable
ALTER TABLE "CandidateRace" ADD COLUMN "order" INTEGER;

-- First add the new columns as nullable
ALTER TABLE "Election" 
    ADD COLUMN "primaryDate" TIMESTAMP(3),
    ADD COLUMN "generalDate" TIMESTAMP(3),
    ADD COLUMN "finalizedDate" TIMESTAMP(3),
    ADD COLUMN "status" "ElectionStatus" DEFAULT 'PRIMARY';

-- Update existing records with default dates
-- For 2023 election, set primary to Aug 1 and general to Nov 7
UPDATE "Election"
SET "primaryDate" = '2023-08-01 00:00:00'::timestamp,
    "generalDate" = '2023-11-07 00:00:00'::timestamp
WHERE "year" = 2023;

-- Now we can safely make the columns required
ALTER TABLE "Election"
    ALTER COLUMN "primaryDate" SET NOT NULL,
    ALTER COLUMN "generalDate" SET NOT NULL,
    ALTER COLUMN "status" SET NOT NULL;

-- Clean up old columns
ALTER TABLE "Election" 
    DROP COLUMN IF EXISTS "startDate",
    DROP COLUMN IF EXISTS "endDate";

-- Add new columns to Race table
ALTER TABLE "Race" 
    ADD COLUMN "notes" TEXT,
    ADD COLUMN "shortTerm" BOOLEAN DEFAULT false,
    ADD COLUMN "termLength" INTEGER;

-- Set default term length based on office type
UPDATE "Race" r
SET "termLength" = 
    CASE 
        WHEN (SELECT o."type" FROM "Office" o WHERE o.id = r."officeId") = 'COMMISSIONER' THEN 6
        ELSE 4
    END;

-- Now make required fields required
ALTER TABLE "Race"
    ALTER COLUMN "shortTerm" SET NOT NULL,
    ALTER COLUMN "termLength" SET NOT NULL;