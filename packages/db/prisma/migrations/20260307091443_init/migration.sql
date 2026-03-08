-- CreateEnum
CREATE TYPE "StartupStage" AS ENUM ('pre_seed', 'seed', 'series_a', 'series_b', 'growth');

-- CreateEnum
CREATE TYPE "ClimateCategory" AS ENUM ('solar', 'wind', 'ocean_tech', 'carbon_capture', 'green_hydrogen', 'sustainable_agriculture', 'ev_mobility', 'energy_storage', 'waste_tech', 'biodiversity');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('pending', 'under_review', 'verified', 'disputed', 'rejected');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('pending', 'in_progress', 'oracle_verifying', 'completed', 'failed', 'disputed');

-- CreateEnum
CREATE TYPE "RiskTier" AS ENUM ('conservative', 'balanced', 'growth', 'speculative');

-- CreateEnum
CREATE TYPE "AssessmentVerdict" AS ENUM ('approved', 'rejected', 'needs_revision');

-- CreateEnum
CREATE TYPE "ExpertDomain" AS ENUM ('climate_science', 'renewable_energy', 'carbon_markets', 'policy_analysis', 'marine_biology', 'sustainable_finance', 'engineering', 'ecology');

-- CreateTable
CREATE TABLE "Startup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "stage" "StartupStage" NOT NULL,
    "category" "ClimateCategory" NOT NULL,
    "foundedYear" INTEGER NOT NULL,
    "teamSize" INTEGER NOT NULL,
    "countryCode" CHAR(2) NOT NULL,
    "websiteUrl" TEXT,
    "totalFundedUSD" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "smartContractAddress" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'pending',
    "riskPoolId" TEXT,
    "co2ReductionTonnesPerYear" DECIMAL(18,4) NOT NULL,
    "jobsCreated" INTEGER NOT NULL DEFAULT 0,
    "sdgGoals" INTEGER[],
    "waterSavedLitresPerYear" DECIMAL(18,4),
    "biodiversityScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Startup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskPool" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tier" "RiskTier" NOT NULL,
    "categories" TEXT[],
    "totalValueLocked" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "minInvestmentUSD" DECIMAL(18,2) NOT NULL,
    "expectedReturnLow" DECIMAL(5,2) NOT NULL,
    "expectedReturnHigh" DECIMAL(5,2) NOT NULL,
    "lastRebalancedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskPool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Milestone" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "fundReleaseUSD" DECIMAL(18,2) NOT NULL,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "status" "MilestoneStatus" NOT NULL DEFAULT 'pending',
    "oracleSources" TEXT[],
    "verificationData" JSONB,
    "completedAt" TIMESTAMP(3),
    "txHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Investor" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "email" TEXT,
    "displayName" TEXT,
    "totalInvested" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Investor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Investment" (
    "id" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "riskPoolId" TEXT,
    "startupId" TEXT,
    "amountUSD" DECIMAL(18,2) NOT NULL,
    "tokensReceived" DECIMAL(28,8) NOT NULL,
    "txHash" TEXT NOT NULL,
    "investedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Investment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DVNExpert" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "domains" "ExpertDomain"[],
    "stakedTokens" DECIMAL(28,8) NOT NULL DEFAULT 0,
    "reputationScore" INTEGER NOT NULL DEFAULT 50,
    "totalAssessments" INTEGER NOT NULL DEFAULT 0,
    "accuracyRate" DECIMAL(5,4) NOT NULL DEFAULT 1,
    "slashedCount" INTEGER NOT NULL DEFAULT 0,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DVNExpert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DVNAssessment" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "expertId" TEXT NOT NULL,
    "verdict" "AssessmentVerdict" NOT NULL,
    "confidenceScore" INTEGER NOT NULL,
    "report" TEXT NOT NULL,
    "stakedAmount" DECIMAL(28,8) NOT NULL,
    "challengePeriodEndsAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "slashed" BOOLEAN NOT NULL DEFAULT false,
    "txHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DVNAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DVNChallenge" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "challengerId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "evidence" TEXT NOT NULL,
    "stakedAmount" DECIMAL(28,8) NOT NULL,
    "resolvedVerdict" "AssessmentVerdict",
    "resolvedAt" TIMESTAMP(3),
    "txHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DVNChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImpactLedgerEntry" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "co2ReducedTonnes" DECIMAL(18,4) NOT NULL,
    "jobsCreated" INTEGER NOT NULL,
    "sdgContributions" INTEGER[],
    "reportingPeriod" TEXT NOT NULL,
    "verifiedOnChain" BOOLEAN NOT NULL DEFAULT false,
    "txHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImpactLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScenarioRun" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "carbonPriceUSD" DECIMAL(10,2) NOT NULL,
    "policyStrictness" INTEGER NOT NULL,
    "technologyAdoptionRate" INTEGER NOT NULL,
    "extremeWeatherFrequency" INTEGER NOT NULL,
    "projectedValuationUSD" DECIMAL(18,2) NOT NULL,
    "projectedImpactMultiplier" DECIMAL(8,4) NOT NULL,
    "confidenceIntervalLow" DECIMAL(8,4) NOT NULL,
    "confidenceIntervalHigh" DECIMAL(8,4) NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScenarioRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Startup_smartContractAddress_key" ON "Startup"("smartContractAddress");

-- CreateIndex
CREATE INDEX "Startup_category_verificationStatus_idx" ON "Startup"("category", "verificationStatus");

-- CreateIndex
CREATE INDEX "Startup_riskPoolId_idx" ON "Startup"("riskPoolId");

-- CreateIndex
CREATE INDEX "RiskPool_tier_idx" ON "RiskPool"("tier");

-- CreateIndex
CREATE INDEX "Milestone_startupId_status_idx" ON "Milestone"("startupId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Investor_walletAddress_key" ON "Investor"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Investor_email_key" ON "Investor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Investment_txHash_key" ON "Investment"("txHash");

-- CreateIndex
CREATE INDEX "Investment_investorId_idx" ON "Investment"("investorId");

-- CreateIndex
CREATE INDEX "Investment_riskPoolId_idx" ON "Investment"("riskPoolId");

-- CreateIndex
CREATE UNIQUE INDEX "DVNExpert_walletAddress_key" ON "DVNExpert"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "DVNAssessment_txHash_key" ON "DVNAssessment"("txHash");

-- CreateIndex
CREATE INDEX "DVNAssessment_startupId_idx" ON "DVNAssessment"("startupId");

-- CreateIndex
CREATE INDEX "DVNAssessment_expertId_idx" ON "DVNAssessment"("expertId");

-- CreateIndex
CREATE UNIQUE INDEX "DVNChallenge_txHash_key" ON "DVNChallenge"("txHash");

-- CreateIndex
CREATE INDEX "DVNChallenge_assessmentId_idx" ON "DVNChallenge"("assessmentId");

-- CreateIndex
CREATE INDEX "ImpactLedgerEntry_reportingPeriod_idx" ON "ImpactLedgerEntry"("reportingPeriod");

-- CreateIndex
CREATE UNIQUE INDEX "ImpactLedgerEntry_startupId_reportingPeriod_key" ON "ImpactLedgerEntry"("startupId", "reportingPeriod");

-- CreateIndex
CREATE INDEX "ScenarioRun_startupId_idx" ON "ScenarioRun"("startupId");

-- AddForeignKey
ALTER TABLE "Startup" ADD CONSTRAINT "Startup_riskPoolId_fkey" FOREIGN KEY ("riskPoolId") REFERENCES "RiskPool"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "Investor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_riskPoolId_fkey" FOREIGN KEY ("riskPoolId") REFERENCES "RiskPool"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DVNAssessment" ADD CONSTRAINT "DVNAssessment_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DVNAssessment" ADD CONSTRAINT "DVNAssessment_expertId_fkey" FOREIGN KEY ("expertId") REFERENCES "DVNExpert"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DVNChallenge" ADD CONSTRAINT "DVNChallenge_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "DVNAssessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DVNChallenge" ADD CONSTRAINT "DVNChallenge_challengerId_fkey" FOREIGN KEY ("challengerId") REFERENCES "DVNExpert"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpactLedgerEntry" ADD CONSTRAINT "ImpactLedgerEntry_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioRun" ADD CONSTRAINT "ScenarioRun_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
