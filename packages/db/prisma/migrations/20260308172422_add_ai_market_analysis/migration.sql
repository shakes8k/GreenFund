/*
  Warnings:

  - You are about to drop the column `txHash` on the `DVNAssessment` table. All the data in the column will be lost.
  - You are about to drop the column `stakedAmount` on the `DVNChallenge` table. All the data in the column will be lost.
  - You are about to drop the column `smartContractAddress` on the `Startup` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "DVNAssessment_txHash_key";

-- DropIndex
DROP INDEX "Startup_smartContractAddress_key";

-- AlterTable
ALTER TABLE "DVNAssessment" DROP COLUMN "txHash",
ALTER COLUMN "stakedAmount" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "DVNChallenge" DROP COLUMN "stakedAmount";

-- AlterTable
ALTER TABLE "InvestorPreference" ALTER COLUMN "categories" DROP DEFAULT,
ALTER COLUMN "stages" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Startup" DROP COLUMN "smartContractAddress";

-- CreateTable
CREATE TABLE "AIMarketAnalysis" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "webSummary" TEXT NOT NULL,
    "marketAdoptionScore" INTEGER NOT NULL,
    "financialSustainabilityScore" INTEGER NOT NULL,
    "technologyScore" INTEGER NOT NULL,
    "consistencyScore" INTEGER NOT NULL,
    "potentialScore" INTEGER NOT NULL,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIMarketAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AIMarketAnalysis_startupId_key" ON "AIMarketAnalysis"("startupId");

-- AddForeignKey
ALTER TABLE "AIMarketAnalysis" ADD CONSTRAINT "AIMarketAnalysis_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
