import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@greenfund/db";
import { scoreStartup } from "@/lib/ai-client";

export async function POST(req: NextRequest) {
  const { startupId } = await req.json();
  if (!startupId) return NextResponse.json({ error: "startupId required" }, { status: 400 });

  const startup = await prisma.startup.findUnique({ where: { id: startupId } });
  if (!startup) return NextResponse.json({ error: "Startup not found" }, { status: 404 });

  try {
    const score = await scoreStartup(startupId, {
      name: startup.name,
      description: startup.description,
      category: startup.category,
      stage: startup.stage,
      co2ReductionTonnesPerYear: Number(startup.co2ReductionTonnesPerYear),
      jobsCreated: startup.jobsCreated,
    });

    const saved = await prisma.aICompanyScore.upsert({
      where: { startupId },
      update: {
        overallScore: score.overall_score,
        growthScore: score.growth_score,
        impactScore: score.impact_score,
        riskScore: score.risk_score,
        narrative: score.narrative,
        scoredAt: new Date(),
      },
      create: {
        startupId,
        overallScore: score.overall_score,
        growthScore: score.growth_score,
        impactScore: score.impact_score,
        riskScore: score.risk_score,
        narrative: score.narrative,
      },
    });
    return NextResponse.json(saved);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
