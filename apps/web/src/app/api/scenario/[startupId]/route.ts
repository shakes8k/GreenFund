import { NextRequest, NextResponse } from "next/server";
import { runScenario } from "@/lib/ai-client";
import { prisma } from "@greenfund/db";

function localFallback(
  startupId: string,
  scenario: {
    carbon_price_usd: number;
    policy_strictness: number;
    technology_adoption_rate: number;
    extreme_weather_frequency: number;
  },
  baseValuation = 5_000_000
) {
  const { carbon_price_usd, policy_strictness, technology_adoption_rate, extreme_weather_frequency } = scenario;

  // Simple heuristic model
  const policyBoost = (policy_strictness / 100) * 0.4;
  const adoptionBoost = (technology_adoption_rate / 100) * 0.5;
  const carbonBoost = Math.min(carbon_price_usd / 200, 1) * 0.3;
  const weatherPenalty = (extreme_weather_frequency / 100) * 0.25;

  const impactMultiplier = Math.max(0.3, 1 + policyBoost + adoptionBoost + carbonBoost - weatherPenalty);
  const projectedValuation = baseValuation * impactMultiplier;
  const riskScore = Math.min(100, Math.round(20 + extreme_weather_frequency * 0.5 + (100 - technology_adoption_rate) * 0.2));

  const narratives = [
    impactMultiplier > 1.5
      ? "Strong policy tailwinds and high technology adoption accelerate growth significantly beyond baseline projections."
      : impactMultiplier > 1.1
      ? "Moderate improvements across key climate drivers support above-baseline performance."
      : impactMultiplier < 0.8
      ? "High extreme weather exposure and low adoption create headwinds. Portfolio rebalancing recommended."
      : "Conditions roughly in line with baseline scenario. Monitor policy developments closely.",
  ];

  return {
    startup_id: startupId,
    projections: [
      {
        projected_valuation_usd: Math.round(projectedValuation),
        projected_impact_multiplier: parseFloat(impactMultiplier.toFixed(4)),
        confidence_interval_low: parseFloat((impactMultiplier * 0.85).toFixed(4)),
        confidence_interval_high: parseFloat((impactMultiplier * 1.15).toFixed(4)),
        risk_score: riskScore,
        model_version: "local-heuristic-v1",
        narrative: narratives[0],
      },
    ],
    source: "local",
  };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ startupId: string }> }
) {
  const { startupId } = await params;
  const body = await req.json();

  const startup = await prisma.startup.findUnique({
    where: { id: startupId },
    select: { totalFundedUSD: true },
  });
  const baselineValuationUsd = Number(startup?.totalFundedUSD ?? 5_000_000);

  try {
    const result = await runScenario(startupId, body, baselineValuationUsd);
    return NextResponse.json(result);
  } catch {
    // AI service unavailable — fall back to local heuristic model
    const fallback = localFallback(startupId, body, baselineValuationUsd);
    return NextResponse.json(fallback);
  }
}
