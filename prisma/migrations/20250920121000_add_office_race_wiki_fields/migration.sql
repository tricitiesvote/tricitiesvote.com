-- AlterTable
ALTER TABLE "Office"
ADD COLUMN     "description" TEXT,
ADD COLUMN     "titleWiki" TEXT,
ADD COLUMN     "jobTitleWiki" TEXT,
ADD COLUMN     "descriptionWiki" TEXT;

-- AlterTable
ALTER TABLE "Race"
ADD COLUMN     "introWiki" TEXT,
ADD COLUMN     "bodyWiki" TEXT;
