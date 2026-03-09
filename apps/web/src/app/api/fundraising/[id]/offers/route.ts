import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@greenfund/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const offers = await prisma.investorOffer.findMany({
    where: { fundraisingRequestId: id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(offers);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { investorEmail, investorName, amountINR, counterEquityPercent } =
    await req.json();

  if (!investorEmail || !investorName || !amountINR) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const fundraisingRequest = await prisma.fundraisingRequest.findUnique({
    where: { id },
  });
  if (!fundraisingRequest) {
    return NextResponse.json({ error: "Fundraising round not found" }, { status: 404 });
  }

  if (Number(amountINR) < Number(fundraisingRequest.minInvestmentINR)) {
    return NextResponse.json(
      {
        error: `Minimum investment is ₹${Number(fundraisingRequest.minInvestmentINR).toLocaleString("en-IN")}`,
      },
      { status: 400 },
    );
  }

  const offer = await prisma.investorOffer.create({
    data: {
      fundraisingRequestId: id,
      investorEmail,
      investorName,
      amountINR,
      counterEquityPercent: counterEquityPercent ?? null,
      status: "pending",
    },
  });

  return NextResponse.json(offer, { status: 201 });
}
