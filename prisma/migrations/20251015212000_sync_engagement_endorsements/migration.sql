-- Ensure engagement link enum exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EngagementLinkType') THEN
    CREATE TYPE "EngagementLinkType" AS ENUM ('SHARED', 'PER_CANDIDATE');
  END IF;
END $$;

-- Add linkType column with default
ALTER TABLE "Engagement"
  ADD COLUMN IF NOT EXISTS "linkType" "EngagementLinkType";

ALTER TABLE "Engagement"
  ALTER COLUMN "linkType" SET DEFAULT 'SHARED';

UPDATE "Engagement"
SET "linkType" = 'SHARED'
WHERE "linkType" IS NULL;

ALTER TABLE "Engagement"
  ALTER COLUMN "linkType" SET NOT NULL;

-- Add optional per-candidate link column
ALTER TABLE "CandidateEngagement"
  ADD COLUMN IF NOT EXISTS "link" TEXT;

-- Endorsement uploads & metadata
ALTER TABLE "Endorsement"
  ALTER COLUMN "url" DROP NOT NULL;

ALTER TABLE "Endorsement"
  ADD COLUMN IF NOT EXISTS "filePath" TEXT,
  ADD COLUMN IF NOT EXISTS "sourceTitle" TEXT,
  ADD COLUMN IF NOT EXISTS "notes" TEXT,
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3);

UPDATE "Endorsement"
SET "createdAt" = COALESCE("createdAt", NOW());

ALTER TABLE "Endorsement"
  ALTER COLUMN "createdAt" SET NOT NULL,
  ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;
