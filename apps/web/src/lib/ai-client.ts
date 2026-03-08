/**
 * Typed client for the GreenFund AI Service (FastAPI).
 * All AI features (scenario stress-testing, impact forecasting, pool rebalancing)
 * go through this client from Next.js server components / API routes.
 */

import type {
  ScenarioResponse,
  ImpactPredictionResponse,
  PoolRebalanceResponse,
} from "@greenfund/shared";

const AI_SERVICE_URL = process.env["AI_SERVICE_URL"] ?? "http://localhost:8000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${AI_SERVICE_URL}/api/v1${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AI service error ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export async function runScenario(
  startupId: string,
  scenario: {
    carbon_price_usd: number;
    policy_strictness: number;
    technology_adoption_rate: number;
    extreme_weather_frequency: number;
  },
  baselineValuationUsd?: number
): Promise<ScenarioResponse> {
  return apiFetch<ScenarioResponse>(`/scenario/${startupId}`, {
    method: "POST",
    body: JSON.stringify({
      startup_id: startupId,
      scenario,
      ...(baselineValuationUsd != null ? { baseline_valuation_usd: baselineValuationUsd } : {}),
    }),
  });
}

export async function forecastImpact(
  startupId: string,
  forecastYears = 5,
  baseCo2TonnesPerYear?: number,
  baseJobs?: number
): Promise<ImpactPredictionResponse> {
  return apiFetch<ImpactPredictionResponse>(
    `/impact/${startupId}/forecast?forecast_years=${forecastYears}`,
    {
      method: "POST",
      body: JSON.stringify({
        startup_id: startupId,
        forecast_years: forecastYears,
        ...(baseCo2TonnesPerYear != null ? { base_co2_tonnes_per_year: baseCo2TonnesPerYear } : {}),
        ...(baseJobs != null ? { base_jobs: baseJobs } : {}),
      }),
    }
  );
}

export async function rebalancePool(
  poolId: string,
  force = false
): Promise<PoolRebalanceResponse> {
  return apiFetch<PoolRebalanceResponse>(`/pools/${poolId}/rebalance`, {
    method: "POST",
    body: JSON.stringify({ pool_id: poolId, force }),
  });
}

export async function scoreStartup(
  startupId: string,
  profile: {
    name: string;
    description: string;
    category: string;
    stage: string;
    co2ReductionTonnesPerYear: number;
    jobsCreated: number;
  }
): Promise<{
  overall_score: number;
  growth_score: number;
  impact_score: number;
  risk_score: number;
  narrative: string;
}> {
  return apiFetch(`/score/${startupId}`, {
    method: "POST",
    body: JSON.stringify({ startup_id: startupId, profile }),
  });
}
