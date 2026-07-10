-- CreateEnum
CREATE TYPE "StoryCategory" AS ENUM ('NEWS', 'ANALYSIS', 'ANNOUNCEMENT', 'QUESTIONNAIRE_ADDED');

-- CreateEnum
CREATE TYPE "StoryScope" AS ENUM ('SITE', 'GUIDE', 'RACE');

-- CreateTable
CREATE TABLE "Story" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "blurb" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "category" "StoryCategory" NOT NULL DEFAULT 'NEWS',
    "electionYear" INTEGER NOT NULL,
    "hide" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryPlacement" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "scope" "StoryScope" NOT NULL,
    "guideId" TEXT,
    "raceId" TEXT,

    CONSTRAINT "StoryPlacement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Citation" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "outlet" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "author" TEXT,
    "publishedAt" TIMESTAMP(3),
    "isPrimarySource" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Citation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Story_slug_key" ON "Story"("slug");

-- CreateIndex
CREATE INDEX "Story_electionYear_idx" ON "Story"("electionYear");

-- CreateIndex
CREATE INDEX "Story_date_idx" ON "Story"("date");

-- CreateIndex
CREATE INDEX "StoryPlacement_storyId_idx" ON "StoryPlacement"("storyId");

-- CreateIndex
CREATE INDEX "StoryPlacement_guideId_idx" ON "StoryPlacement"("guideId");

-- CreateIndex
CREATE INDEX "StoryPlacement_raceId_idx" ON "StoryPlacement"("raceId");

-- CreateIndex
CREATE INDEX "Citation_storyId_idx" ON "Citation"("storyId");

-- AddForeignKey
ALTER TABLE "StoryPlacement" ADD CONSTRAINT "StoryPlacement_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryPlacement" ADD CONSTRAINT "StoryPlacement_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "Guide"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryPlacement" ADD CONSTRAINT "StoryPlacement_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Citation" ADD CONSTRAINT "Citation_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

