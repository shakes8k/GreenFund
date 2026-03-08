import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@greenfund/db";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("investor");
  const startupId = req.nextUrl.searchParams.get("startup");

  const contracts = await prisma.investmentContract.findMany({
    where: {
      ...(email ? { investorEmail: email } : {}),
      ...(startupId ? { startupId } : {}),
    },
    include: {
      startup: { select: { id: true, name: true, category: true, verificationStatus: true } },
      royalties: { select: { id: true, amountGFT: true, reason: true, paidAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(contracts);
}

export async function POST(req: NextRequest) {
  const { investorEmail, investorName, startupId, amountUSD, terms } = await req.json();

  if (!investorEmail || !investorName || !startupId || !amountUSD) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Verify startup exists and is verified
  const startup = await prisma.startup.findUnique({ where: { id: startupId } });
  if (!startup) return NextResponse.json({ error: "Startup not found" }, { status: 404 });
  if (startup.verificationStatus !== "verified") {
    return NextResponse.json(
      { error: "Startup must be fully verified before accepting investments" },
      { status: 422 },
    );
  }

  const contract = await prisma.investmentContract.create({
    data: {
      investorEmail,
      investorName,
      startupId,
      amountUSD,
      status: "pending_acceptance",
      terms: terms ?? { milestoneSchedule: [] },
    },
    include: {
      startup: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(contract, { status: 201 });
}
