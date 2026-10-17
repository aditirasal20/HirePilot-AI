-- AlterTable
ALTER TABLE "User" DROP COLUMN "refreshToken",
ADD COLUMN "refreshTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN "refreshTokenHash" TEXT;
