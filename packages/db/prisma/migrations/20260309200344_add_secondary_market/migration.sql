-- CreateTable
CREATE TABLE "SecondaryListing" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "sellerEmail" TEXT NOT NULL,
    "sellerName" TEXT NOT NULL,
    "askPriceINR" DECIMAL(18,2) NOT NULL,
    "algorithmicPriceINR" DECIMAL(18,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'listed',
    "buyerEmail" TEXT,
    "buyerName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecondaryListing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SecondaryListing_offerId_key" ON "SecondaryListing"("offerId");

-- AddForeignKey
ALTER TABLE "SecondaryListing" ADD CONSTRAINT "SecondaryListing_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "InvestorOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
