-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('COMMUNITY', 'CANDIDATE', 'MODERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('CANDIDATE', 'RACE', 'OFFICE', 'ENDORSEMENT', 'CONTRIBUTION');

-- CreateEnum
CREATE TYPE "EditStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'APPLIED', 'SUPERSEDED');

-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "bioWiki" TEXT,
ADD COLUMN     "emailWiki" TEXT,
ADD COLUMN     "facebookWiki" TEXT,
ADD COLUMN     "imageWiki" TEXT,
ADD COLUMN     "instagramWiki" TEXT,
ADD COLUMN     "nameWiki" TEXT,
ADD COLUMN     "phoneWiki" TEXT,
ADD COLUMN     "statementWiki" TEXT,
ADD COLUMN     "twitterWiki" TEXT,
ADD COLUMN     "websiteWiki" TEXT;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'COMMUNITY',
    "candidateId" TEXT,
    "editsAccepted" INTEGER NOT NULL DEFAULT 0,
    "editsRejected" INTEGER NOT NULL DEFAULT 0,
    "editsPending" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Edit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB NOT NULL,
    "rationale" TEXT NOT NULL,
    "status" "EditStatus" NOT NULL DEFAULT 'PENDING',
    "moderatorId" TEXT,
    "moderatorNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "appliedAt" TIMESTAMP(3),

    CONSTRAINT "Edit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_candidateId_key" ON "User"("candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "LoginToken_token_key" ON "LoginToken"("token");

-- CreateIndex
CREATE INDEX "Edit_status_createdAt_idx" ON "Edit"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Edit_userId_status_idx" ON "Edit"("userId", "status");

-- CreateIndex
CREATE INDEX "Edit_entityType_entityId_idx" ON "Edit"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginToken" ADD CONSTRAINT "LoginToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Edit" ADD CONSTRAINT "Edit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Edit" ADD CONSTRAINT "Edit_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
