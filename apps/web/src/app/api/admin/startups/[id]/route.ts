import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@greenfund/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const startup = await prisma.startup.findUnique({ where: { id } });
  if (!startup) return NextResponse.json({ error: "Startup not found" }, { status: 404 });

  // Delete in dependency order to satisfy FK constraints
  // 1. RoyaltyPayments depend on InvestmentContract
  const contracts = await prisma.investmentContract.findMany({ where: { startupId: id }, select: { id: true } });
  const contractIds = contracts.map((c) => c.id);
  if (contractIds.length > 0) {
    await prisma.royaltyPayment.deleteMany({ where: { contractId: { in: contractIds } } });
  }

  // 2. DVNChallenges depend on DVNAssessment
  const assessments = await prisma.dVNAssessment.findMany({ where: { startupId: id }, select: { id: true } });
  const assessmentIds = assessments.map((a) => a.id);
  if (assessmentIds.length > 0) {
    await prisma.dVNChallenge.deleteMany({ where: { assessmentId: { in: assessmentIds } } });
  }

  // 3. Delete remaining non-cascading relations
  await prisma.dVNAssessment.deleteMany({ where: { startupId: id } });
  await prisma.investment.deleteMany({ where: { startupId: id } });
  await prisma.impactLedgerEntry.deleteMany({ where: { startupId: id } });
  await prisma.scenarioRun.deleteMany({ where: { startupId: id } });
  await prisma.investmentContract.deleteMany({ where: { startupId: id } });
  await prisma.fundraisingRequest.deleteMany({ where: { startupId: id } });

  // 4. Delete startup — cascades the rest (milestones, aiScore, aiAnalysis, news, etc.)
  await prisma.startup.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
