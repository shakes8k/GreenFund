-- CreateTable
CREATE TABLE "CompanyFinancials" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "fiscalYear" TEXT NOT NULL,
    "periodEndDate" TIMESTAMP(3) NOT NULL,
    "revenueINR" DECIMAL(18,2),
    "grossProfitINR" DECIMAL(18,2),
    "ebitdaINR" DECIMAL(18,2),
    "netProfitINR" DECIMAL(18,2),
    "totalAssetsINR" DECIMAL(18,2),
    "totalLiabilitiesINR" DECIMAL(18,2),
    "cashEquivalentsINR" DECIMAL(18,2),
    "burnRateINR" DECIMAL(18,2),
    "runwayMonths" INTEGER,
    "filingSource" TEXT,
    "notes" TEXT,
    "addedByEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyFinancials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompanyFinancials_startupId_idx" ON "CompanyFinancials"("startupId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyFinancials_startupId_fiscalYear_key" ON "CompanyFinancials"("startupId", "fiscalYear");

-- AddForeignKey
ALTER TABLE "CompanyFinancials" ADD CONSTRAINT "CompanyFinancials_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
