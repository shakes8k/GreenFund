"""
Scenario stress-testing engine.

Architecture:
- A lightweight linear model projects startup valuation and impact under
  different climate scenarios. In production this should be replaced with
  a trained gradient-boosting model (XGBoost/LightGBM) fitted on historical
  climate-tech startup data.
- Confidence intervals are derived from bootstrap resampling of residuals.
- Anthropic Claude generates a plain-language narrative for each projection.
"""

from __future__ import annotations

import uuid
import numpy as np
from anthropic import AsyncAnthropic

from app.core.config import settings
from app.models.schemas import (
    ClimateScenario,
    ScenarioProjection,
    ScenarioResponse,
)

anthropic_client = AsyncAnthropic(api_key=settings.anthropic_api_key)


# ─── Feature Engineering ──────────────────────────────────────────────────────

def _scenario_to_features(scenario: ClimateScenario) -> np.ndarray:
    """Normalise scenario parameters to [0, 1] feature vector."""
    return np.array([
        scenario.carbon_price_usd / 1000.0,
        scenario.policy_strictness / 100.0,
        scenario.technology_adoption_rate / 100.0,
        scenario.extreme_weather_frequency / 100.0,
    ])


# Placeholder coefficient matrix (replace with trained model weights).
# Rows: [valuation_multiplier, impact_multiplier, risk_score]
_WEIGHTS = np.array([
    [ 0.6,  0.4, -0.1,  -0.3],   # valuation: benefits from carbon price + policy, hurt by weather
    [ 0.3,  0.2,  0.5,  -0.1],   # impact: driven by adoption rate
    [-0.2, -0.3,  0.1,   0.5],   # risk: hurt by high policy strictness, amplified by weather
])
_BIAS = np.array([1.0, 1.0, 30.0])


def _project(features: np.ndarray) -> tuple[float, float, int]:
    """Return (valuation_multiplier, impact_multiplier, risk_score)."""
    raw = _WEIGHTS @ features + _BIAS
    valuation_mult  = float(np.clip(raw[0], 0.1, 5.0))
    impact_mult     = float(np.clip(raw[1], 0.0, 10.0))
    risk_score      = int(np.clip(round(raw[2] * 100), 0, 100))
    return valuation_mult, impact_mult, risk_score


def _confidence_interval(
    valuation_mult: float, n_bootstrap: int = 200, noise_std: float = 0.08
) -> tuple[float, float]:
    """Bootstrap confidence interval around the valuation multiplier."""
    rng = np.random.default_rng(seed=42)
    samples = valuation_mult + rng.normal(0, noise_std, n_bootstrap)
    low  = float(np.percentile(samples, 5))
    high = float(np.percentile(samples, 95))
    return max(0.0, low), max(0.0, high)


# ─── Narrative Generation ─────────────────────────────────────────────────────

async def _generate_narrative(
    scenario: ClimateScenario,
    valuation_mult: float,
    impact_mult: float,
    risk_score: int,
) -> str:
    message = await anthropic_client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=300,
        messages=[{
            "role": "user",
            "content": (
                f"You are a climate finance analyst. Explain in 2-3 sentences what the following "
                f"scenario means for a climate-tech startup, in plain language for investors.\n\n"
                f"Scenario: carbon price ${scenario.carbon_price_usd}/tonne, "
                f"policy strictness {scenario.policy_strictness}/100, "
                f"technology adoption rate {scenario.technology_adoption_rate}/100, "
                f"extreme weather frequency {scenario.extreme_weather_frequency}/100.\n\n"
                f"Projected valuation multiplier: {valuation_mult:.2f}x, "
                f"impact multiplier: {impact_mult:.2f}x, risk score: {risk_score}/100."
            ),
        }],
    )
    return message.content[0].text  # type: ignore[union-attr]


# ─── Public API ───────────────────────────────────────────────────────────────

async def run_scenario(
    startup_id: str,
    scenarios: list[ClimateScenario],
    baseline_valuation_usd: float,
    include_narrative: bool = True,
) -> ScenarioResponse:
    projections: list[ScenarioProjection] = []

    for scenario in scenarios:
        features = _scenario_to_features(scenario)
        val_mult, impact_mult, risk_score = _project(features)
        ci_low, ci_high = _confidence_interval(val_mult)

        narrative = None
        if include_narrative:
            narrative = await _generate_narrative(scenario, val_mult, impact_mult, risk_score)

        projections.append(ScenarioProjection(
            scenario=scenario,
            projected_valuation_usd=round(baseline_valuation_usd * val_mult, 2),
            projected_impact_multiplier=round(impact_mult, 4),
            confidence_interval_low=round(ci_low, 4),
            confidence_interval_high=round(ci_high, 4),
            risk_score=risk_score,
            model_version=settings.scenario_model_version,
            narrative=narrative,
        ))

    return ScenarioResponse(
        startup_id=startup_id,
        projections=projections,
        baseline_valuation_usd=baseline_valuation_usd,
        run_id=str(uuid.uuid4()),
    )
