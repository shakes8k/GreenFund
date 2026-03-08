import { NextResponse } from "next/server";
import { prisma } from "@greenfund/db";
import { computeReputationScore, updateAccuracyRate } from "@greenfund/db";

/**
 * Processes all assessments whose 7-day challenge window has expired
 * and have no outstanding challenges. Marks them resolved, updates expert
 * accuracyRate and reputationScore. Safe to call on a cron or manually.
 */
export async function POST() {
  const now = new Date();

  // Find assessments: challenge period ended, not yet resolved, not slashed
  const expired = await prisma.dVNAssessment.findMany({
    where: {
      challengePeriodEndsAt: { lt: now },
      resolvedAt: null,
      slashed: false,
    },
    include: {
      expert: true,
      challenges: { where: { resolvedAt: null } }, // open challenges
    },
  });

  // Only process those with no open challenges
  const toResolve = expired.filter((a) => a.challenges.length === 0);

  let resolved = 0;

  for (const assessment of toResolve) {
    const expert = assessment.expert;
    const newTotal = expert.totalAssessments; // already incremented on submission

    // Unchallenged = correct assessment
    const newAccuracy = updateAccuracyRate(expert.accuracyRate, newTotal, true);
    const newScore = computeReputationScore({
      totalAssessments: newTotal,
      accuracyRate: newAccuracy,
      slashedCount: expert.slashedCount,
      stakedTokens: expert.stakedTokens,
    });

    await prisma.$transaction([
      prisma.dVNAssessment.update({
        where: { id: assessment.id },
        data: { resolvedAt: now },
      }),
      prisma.dVNExpert.update({
        where: { id: expert.id },
        data: { accuracyRate: newAccuracy, reputationScore: newScore },
      }),
    ]);

    resolved++;
  }

  return NextResponse.json({ resolved, skipped: expired.length - resolved });
}
