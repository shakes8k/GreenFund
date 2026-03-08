// ─── Scenario Stress-Test ─────────────────────────────────────────────────────

export interface ClimateScenarioInput {
  carbon_price_usd: number;
  policy_strictness: number;
  technology_adoption_rate: number;
  extreme_weather_frequency: number;
}

export interface AIScenarioProjection {
  scenario?: ClimateScenarioInput;
  projected_valuation_usd: number;
  projected_impact_multiplier: number;
  confidence_interval_low: number;
  confidence_interval_high: number;
  risk_score: number;
  model_version: string;
  narrative?: string | null;
}

export interface ScenarioResponse {
  startup_id: string;
  projections: AIScenarioProjection[];
  baseline_valuation_usd?: number;
  run_id?: string;
  /** Present when using local fallback */
  source?: string;
}

// ─── Impact Prediction ────────────────────────────────────────────────────────

export interface YearlyImpactForecast {
  year: number;
  co2_reduction_tonnes: number;
  jobs_created: number;
  confidence: number;
}

export interface ImpactPredictionResponse {
  startup_id: string;
  forecasts: YearlyImpactForecast[];
  model_version: string;
}

// ─── Risk Pool Rebalancing ────────────────────────────────────────────────────

export interface StartupAllocation {
  startup_id: string;
  weight: number;
  rationale: string;
}

export interface PoolRebalanceResponse {
  pool_id: string;
  previous_allocations: StartupAllocation[];
  new_allocations: StartupAllocation[];
  drift_percentage: number;
  rebalanced: boolean;
  model_version: string;
}
