-- CreateTable
CREATE TABLE "CompanyOnboarding" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "incorporationDate" TIMESTAMP(3) NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "registeredAddress" TEXT NOT NULL,
    "operatingAddress" TEXT NOT NULL,
    "website" TEXT,
    "logoUrl" TEXT,
    "keyPeople" JSONB NOT NULL DEFAULT '[]',
    "legalDocUrls" TEXT[],
    "kycDocUrls" TEXT[],
    "financialDocUrls" TEXT[],
    "patentDocUrls" TEXT[],
    "esgCertUrls" TEXT[],
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyOnboarding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FundraisingRequest" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "fundingRound" TEXT NOT NULL,
    "amountRaisingINR" DECIMAL(18,2) NOT NULL,
    "minInvestmentINR" DECIMAL(18,2) NOT NULL,
    "valuationINR" DECIMAL(18,2) NOT NULL,
    "equityPercent" DECIMAL(5,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FundraisingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompanyOnboarding_startupId_key" ON "CompanyOnboarding"("startupId");

-- AddForeignKey
ALTER TABLE "CompanyOnboarding" ADD CONSTRAINT "CompanyOnboarding_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundraisingRequest" ADD CONSTRAINT "FundraisingRequest_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
