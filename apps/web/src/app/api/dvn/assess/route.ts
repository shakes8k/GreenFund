import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@greenfund/db";
import { computeReputationScore } from "@greenfund/db";

export async function POST(req: NextRequest) {
  const { startupId, analystEmail, verdict, confidenceScore, notes } = await req.json();

  if (!startupId || !analystEmail || !verdict || confidenceScore == null || !notes) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Find or create DVNExpert by email
  let expert = await prisma.dVNExpert.findUnique({ where: { email: analystEmail } });
  if (!expert) {
    return NextResponse.json(
      { error: "Analyst not registered in DVN. Complete registration first." },
      { status: 404 },
    );
  }

  // Check: one assessment per expert per startup
  const existing = await prisma.dVNAssessment.findFirst({
    where: { startupId, expertId: expert.id },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You have already assessed this startup." },
      { status: 409 },
    );
  }

  const challengePeriodEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Create assessment
  const assessment = await prisma.dVNAssessment.create({
    data: {
      startupId,
      expertId: expert.id,
      verdict,
      confidenceScore,
      report: notes,
      stakedAmount: expert.stakedTokens,
      challengePeriodEndsAt,
    },
  });

  // Update expert: increment totalAssessments, recalculate score
  const newTotal = expert.totalAssessments + 1;
  const newScore = computeReputationScore({
    totalAssessments: newTotal,
    accuracyRate: expert.accuracyRate,
    slashedCount: expert.slashedCount,
    stakedTokens: expert.stakedTokens,
  });

  const updatedExpert = await prisma.dVNExpert.update({
    where: { id: expert.id },
    data: { totalAssessments: newTotal, reputationScore: newScore },
  });

  // If verdict is "approved", update startup to under_review if still pending
  if (verdict === "approved") {
    await prisma.startup.updateMany({
      where: { id: startupId, verificationStatus: "pending" },
      data: { verificationStatus: "under_review" },
    });
  }

  return NextResponse.json({ assessment, expert: updatedExpert });
}
