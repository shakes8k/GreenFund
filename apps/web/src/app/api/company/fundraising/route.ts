import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@greenfund/db";

export async function POST(req: NextRequest) {
  const { startupId, fundingRound, amountRaisingINR, minInvestmentINR, valuationINR, equityPercent } =
    await req.json();
  if (!startupId || !fundingRound || !amountRaisingINR) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const request = await prisma.fundraisingRequest.create({
    data: { startupId, fundingRound, amountRaisingINR, minInvestmentINR, valuationINR, equityPercent },
  });
  return NextResponse.json(request, { status: 201 });
}

export async function GET(req: NextRequest) {
  const startupId = req.nextUrl.searchParams.get("startupId");
  if (!startupId) return NextResponse.json({ error: "startupId required" }, { status: 400 });
  const requests = await prisma.fundraisingRequest.findMany({
    where: { startupId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(requests);
}
