-- AlterTable
ALTER TABLE "Questionnaire" ADD COLUMN     "hidden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "scale" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "sourceName" TEXT,
ADD COLUMN     "sourceUrl" TEXT;

