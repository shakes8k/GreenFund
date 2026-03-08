-- AddEnum: AdminReviewStatus
CREATE TYPE "AdminReviewStatus" AS ENUM ('pending', 'approved', 'rejected');

-- AlterTable: Startup — add companyEmail
ALTER TABLE "Startup" ADD COLUMN "companyEmail" TEXT;

-- CreateIndex on Startup.companyEmail
CREATE INDEX "Startup_companyEmail_idx" ON "Startup"("companyEmail");

-- CreateTable: AdminReview
CREATE TABLE "AdminReview" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "adminEmail" TEXT,
    "status" "AdminReviewStatus" NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminReview_startupId_key" ON "AdminReview"("startupId");
CREATE INDEX "AdminReview_status_idx" ON "AdminReview"("status");

ALTER TABLE "AdminReview" ADD CONSTRAINT "AdminReview_startupId_fkey"
    FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: AICompanyScore
CREATE TABLE "AICompanyScore" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "growthScore" INTEGER NOT NULL,
    "impactScore" INTEGER NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "narrative" TEXT NOT NULL,
    "scoredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AICompanyScore_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AICompanyScore_startupId_key" ON "AICompanyScore"("startupId");

ALTER TABLE "AICompanyScore" ADD CONSTRAINT "AICompanyScore_startupId_fkey"
    FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: AnalystReport
CREATE TABLE "AnalystReport" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "analystEmail" TEXT NOT NULL,
    "analystName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalystReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AnalystReport_startupId_idx" ON "AnalystReport"("startupId");
CREATE INDEX "AnalystReport_analystEmail_idx" ON "AnalystReport"("analystEmail");

ALTER TABLE "AnalystReport" ADD CONSTRAINT "AnalystReport_startupId_fkey"
    FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: CompanyNews
CREATE TABLE "CompanyNews" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyNews_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CompanyNews_startupId_idx" ON "CompanyNews"("startupId");

ALTER TABLE "CompanyNews" ADD CONSTRAINT "CompanyNews_startupId_fkey"
    FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: CompanyMetricUpdate
CREATE TABLE "CompanyMetricUpdate" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "co2ReductionTonnesPerYear" DECIMAL(18,4),
    "jobsCreated" INTEGER,
    "revenue" DECIMAL(18,2),
    "customMetrics" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyMetricUpdate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CompanyMetricUpdate_startupId_idx" ON "CompanyMetricUpdate"("startupId");

ALTER TABLE "CompanyMetricUpdate" ADD CONSTRAINT "CompanyMetricUpdate_startupId_fkey"
    FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: InvestorPreference
CREATE TABLE "InvestorPreference" (
    "id" TEXT NOT NULL,
    "investorEmail" TEXT NOT NULL,
    "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "stages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "minScore" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestorPreference_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InvestorPreference_investorEmail_key" ON "InvestorPreference"("investorEmail");
CREATE INDEX "InvestorPreference_investorEmail_idx" ON "InvestorPreference"("investorEmail");

-- AddEnum: ContractStatus
CREATE TYPE "ContractStatus" AS ENUM ('pending_acceptance', 'active', 'completed', 'terminated', 'transferred');

-- AddEnum: UserRole
CREATE TYPE "UserRole" AS ENUM ('investor', 'company', 'analyst', 'admin');

-- CreateTable: User
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "investorType" TEXT,
    "riskAppetite" TEXT,
    "investmentRange" TEXT,
    "companyName" TEXT,
    "category" TEXT,
    "stage" TEXT,
    "countryCode" TEXT,
    "teamSize" TEXT,
    "fundingGoal" TEXT,
    "companyDescription" TEXT,
    "domain" TEXT,
    "experience" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_role_idx" ON "User"("role");

-- AlterTable: DVNExpert — make walletAddress nullable, add email + gftBalance columns
ALTER TABLE "DVNExpert" ALTER COLUMN "walletAddress" DROP NOT NULL;
ALTER TABLE "DVNExpert" ADD COLUMN IF NOT EXISTS "email" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "DVNExpert_email_key" ON "DVNExpert"("email");
ALTER TABLE "DVNExpert" ADD COLUMN IF NOT EXISTS "gftBalance" DECIMAL(28,8) NOT NULL DEFAULT 0;

-- AlterTable: DVNAssessment — make txHash nullable (schema no longer exposes it)
ALTER TABLE "DVNAssessment" ALTER COLUMN "txHash" DROP NOT NULL;

-- AlterTable: DVNChallenge — make txHash and stakedAmount nullable
ALTER TABLE "DVNChallenge" ALTER COLUMN "txHash" DROP NOT NULL;
ALTER TABLE "DVNChallenge" ALTER COLUMN "stakedAmount" DROP NOT NULL;

-- AlterTable: Investor — make walletAddress nullable
ALTER TABLE "Investor" ALTER COLUMN "walletAddress" DROP NOT NULL;

-- AlterTable: Investment — rename tokensReceived → sharesIssued, add default; make txHash nullable
ALTER TABLE "Investment" RENAME COLUMN "tokensReceived" TO "sharesIssued";
ALTER TABLE "Investment" ALTER COLUMN "sharesIssued" SET DEFAULT 0;
ALTER TABLE "Investment" ALTER COLUMN "txHash" DROP NOT NULL;

-- CreateTable: InvestmentContract
CREATE TABLE "InvestmentContract" (
    "id" TEXT NOT NULL,
    "investorEmail" TEXT NOT NULL,
    "investorName" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "amountUSD" DECIMAL(18,2) NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'pending_acceptance',
    "totalReleasedUSD" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "terms" JSONB NOT NULL,
    "lockInPeriodDays" INTEGER NOT NULL DEFAULT 365,
    "isTransferable" BOOLEAN NOT NULL DEFAULT false,
    "transferredToEmail" TEXT,
    "transferredAt" TIMESTAMP(3),
    "lockInExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestmentContract_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InvestmentContract_investorEmail_idx" ON "InvestmentContract"("investorEmail");
CREATE INDEX "InvestmentContract_startupId_idx" ON "InvestmentContract"("startupId");

ALTER TABLE "InvestmentContract" ADD CONSTRAINT "InvestmentContract_startupId_fkey"
    FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable: RoyaltyPayment
CREATE TABLE "RoyaltyPayment" (
    "id" TEXT NOT NULL,
    "expertId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "amountGFT" DECIMAL(28,8) NOT NULL,
    "reason" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoyaltyPayment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RoyaltyPayment_expertId_idx" ON "RoyaltyPayment"("expertId");
CREATE INDEX "RoyaltyPayment_contractId_idx" ON "RoyaltyPayment"("contractId");

ALTER TABLE "RoyaltyPayment" ADD CONSTRAINT "RoyaltyPayment_expertId_fkey"
    FOREIGN KEY ("expertId") REFERENCES "DVNExpert"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RoyaltyPayment" ADD CONSTRAINT "RoyaltyPayment_contractId_fkey"
    FOREIGN KEY ("contractId") REFERENCES "InvestmentContract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable: ChatRoom
CREATE TABLE "ChatRoom" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "investorEmail" TEXT NOT NULL,
    "companyEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatRoom_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ChatRoom_startupId_investorEmail_key" ON "ChatRoom"("startupId", "investorEmail");
CREATE INDEX "ChatRoom_investorEmail_idx" ON "ChatRoom"("investorEmail");
CREATE INDEX "ChatRoom_companyEmail_idx" ON "ChatRoom"("companyEmail");

ALTER TABLE "ChatRoom" ADD CONSTRAINT "ChatRoom_startupId_fkey"
    FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: Message
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "senderEmail" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "senderRole" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Message_roomId_idx" ON "Message"("roomId");

ALTER TABLE "Message" ADD CONSTRAINT "Message_roomId_fkey"
    FOREIGN KEY ("roomId") REFERENCES "ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
