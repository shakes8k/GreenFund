from __future__ import annotations

from pydantic import BaseModel, Field


# ─── Scenario Stress-Test ─────────────────────────────────────────────────────

class ClimateScenario(BaseModel):
    carbon_price_usd: float = Field(..., ge=0, le=1000, description="Carbon price per tonne (USD)")
    policy_strictness: int = Field(..., ge=0, le=100)
    technology_adoption_rate: int = Field(..., ge=0, le=100)
    extreme_weather_frequency: int = Field(..., ge=0, le=100)


class ScenarioRequest(BaseModel):
    startup_id: str
    scenario: ClimateScenario
    baseline_valuation_usd: float = 5_000_000.0


class ScenarioProjection(BaseModel):
    scenario: ClimateScenario
    projected_valuation_usd: float
    projected_impact_multiplier: float
    confidence_interval_low: float
    confidence_interval_high: float
    risk_score: int = Field(..., ge=0, le=100)
    model_version: str
    narrative: str | None = None  # AI-generated plain-language explanation


class ScenarioResponse(BaseModel):
    startup_id: str
    projections: list[ScenarioProjection]
    baseline_valuation_usd: float
    run_id: str


# ─── Impact Prediction ────────────────────────────────────────────────────────

class ImpactPredictionRequest(BaseModel):
    startup_id: str
    forecast_years: int = Field(default=5, ge=1, le=20)
    base_co2_tonnes_per_year: float = 1_200.0
    base_jobs: int = 45


class YearlyImpactForecast(BaseModel):
    year: int
    co2_reduction_tonnes: float
    jobs_created: int
    confidence: float = Field(..., ge=0, le=1)


class ImpactPredictionResponse(BaseModel):
    startup_id: str
    forecasts: list[YearlyImpactForecast]
    model_version: str


# ─── Risk Pool Rebalancing ────────────────────────────────────────────────────

class PoolRebalanceRequest(BaseModel):
    pool_id: str
    force: bool = False  # bypass drift threshold check


class StartupAllocation(BaseModel):
    startup_id: str
    weight: float = Field(..., ge=0, le=1)
    rationale: str


class PoolRebalanceResponse(BaseModel):
    pool_id: str
    previous_allocations: list[StartupAllocation]
    new_allocations: list[StartupAllocation]
    drift_percentage: float
    rebalanced: bool
    model_version: str
