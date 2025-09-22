-- Add publicId for public-facing user references
ALTER TABLE "User" ADD COLUMN "publicId" TEXT;

-- Enforce uniqueness when populated
CREATE UNIQUE INDEX "User_publicId_key" ON "User"("publicId");
