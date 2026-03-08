import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@greenfund/db";
import { GFT_PER_USD, ROYALTY_RATE } from "@greenfund/db";

/**
 * Release funds for a completed milestone.
 * - Updates contract totalReleasedUSD
 * - Computes 1% royalty pool from the released amount
 * - Distributes to all analysts who approved this startup,
 *   weighted by their current reputationScore
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { milestoneTitle, releaseAmountUSD } = await req.json();

  if (!releaseAmountUSD || releaseAmountUSD <= 0) {
    return NextResponse.json({ error: "Invalid release amount" }, { status: 400 });
  }

  const contract = await prisma.investmentContract.findUnique({
    where: { id },
    include: { startup: true },
  });
  if (!contract) return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  if (contract.status === "terminated") {
    return NextResponse.json({ error: "Contract is terminated" }, { status: 422 });
  }

  // Find all approved assessments for this startup with resolved verdict
  const approvedAssessments = await prisma.dVNAssessment.findMany({
    where: {
      startupId: contract.startupId,
      verdict: "approved",
      resolvedAt: { not: null },
      slashed: false,
    },
    include: { expert: true },
  });

  const royaltyPoolUSD  = releaseAmountUSD * ROYALTY_RATE;
  const royaltyPoolGFT  = royaltyPoolUSD * GFT_PER_USD;
  const totalScore      = approvedAssessments.reduce((s, a) => s + a.expert.reputationScore, 0);

  // Compute per-expert share
  const royaltyEntries = totalScore > 0
    ? approvedAssessments.map((a) => ({
        expertId:   a.expert.id,
        contractId: id,
        startupId:  contract.startupId,
        amountGFT:  (a.expert.reputationScore / totalScore) * royaltyPoolGFT,
        reason:     milestoneTitle ?? `Milestone release — ${contract.startup.name}`,
      }))
    : [];

  const newReleased = Number(contract.totalReleasedUSD) + releaseAmountUSD;
  const contractAmount = Number(contract.amountUSD);
  const newStatus = newReleased >= contractAmount ? "completed" : "active";

  // Transactionally: update contract, create royalties, update gftBalance per expert
  await prisma.$transaction([
    prisma.investmentContract.update({
      where: { id },
      data: { totalReleasedUSD: newReleased, status: newStatus },
    }),
    ...royaltyEntries.map((r) =>
      prisma.royaltyPayment.create({ data: r }),
    ),
    ...royaltyEntries.map((r) =>
      prisma.dVNExpert.update({
        where: { id: r.expertId },
        data: { gftBalance: { increment: r.amountGFT } },
      }),
    ),
  ]);

  return NextResponse.json({
    newStatus,
    totalReleasedUSD: newReleased,
    royaltiesPaid: royaltyEntries.length,
    royaltyPoolGFT,
  });
}
