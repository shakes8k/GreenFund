-- AlterTable
ALTER TABLE "FundraisingRequest" ADD COLUMN     "amountRaisedINR" DECIMAL(18,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "InvestorOffer" (
    "id" TEXT NOT NULL,
    "fundraisingRequestId" TEXT NOT NULL,
    "investorEmail" TEXT NOT NULL,
    "investorName" TEXT NOT NULL,
    "amountINR" DECIMAL(18,2) NOT NULL,
    "counterEquityPercent" DECIMAL(5,2),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sharesPercent" DECIMAL(8,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestorOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InvestorOffer_fundraisingRequestId_idx" ON "InvestorOffer"("fundraisingRequestId");

-- CreateIndex
CREATE INDEX "InvestorOffer_investorEmail_idx" ON "InvestorOffer"("investorEmail");

-- AddForeignKey
ALTER TABLE "InvestorOffer" ADD CONSTRAINT "InvestorOffer_fundraisingRequestId_fkey" FOREIGN KEY ("fundraisingRequestId") REFERENCES "FundraisingRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
