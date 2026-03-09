import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@greenfund/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; offerId: string }> },
) {
  const { id, offerId } = await params;
  const { action } = await req.json();

  if (action !== "accept" && action !== "reject") {
    return NextResponse.json({ error: "action must be accept or reject" }, { status: 400 });
  }

  const offer = await prisma.investorOffer.findUnique({
    where: { id: offerId },
  });
  if (!offer || offer.fundraisingRequestId !== id) {
    return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  }

  const request = await prisma.fundraisingRequest.findUnique({
    where: { id },
  });
  if (!request) {
    return NextResponse.json({ error: "Fundraising round not found" }, { status: 404 });
  }

  if (action === "reject") {
    const updated = await prisma.investorOffer.update({
      where: { id: offerId },
      data: { status: "rejected" },
    });
    return NextResponse.json(updated);
  }

  // action === "accept"
  const amountRaising = Number(request.amountRaisingINR);
  const equityPct = Number(request.equityPercent);
  const offerAmount = Number(offer.amountINR);

  // sharesPercent = (offerAmount / amountRaising) * equityPercent
  const sharesPercent = amountRaising > 0
    ? (offerAmount / amountRaising) * equityPct
    : 0;

  const newAmountRaised = Number(request.amountRaisedINR) + offerAmount;
  const newStatus = newAmountRaised >= amountRaising ? "completed" : request.status;

  const [updatedOffer] = await prisma.$transaction([
    prisma.investorOffer.update({
      where: { id: offerId },
      data: { status: "accepted", sharesPercent },
    }),
    prisma.fundraisingRequest.update({
      where: { id },
      data: { amountRaisedINR: newAmountRaised, status: newStatus },
    }),
    prisma.startup.update({
      where: { id: request.startupId },
      data: { totalFundedUSD: { increment: offerAmount } },
    }),
  ]);

  return NextResponse.json(updatedOffer);
}
