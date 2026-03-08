"""
Predictive impact intelligence service.

Projects a startup's environmental impact (CO2 reduction, jobs) over a
multi-year forecast horizon using time-series extrapolation with uncertainty.

Production upgrade path:
  Replace the linear trend model with a fine-tuned transformer or LSTM
  trained on climate-tech startup impact trajectories.
"""

from __future__ import annotations

import numpy as np
from app.core.config import settings
from app.models.schemas import ImpactPredictionResponse, YearlyImpactForecast


def _growth_curve(base: float, year: int, growth_rate: float, saturation: float) -> float:
    """Logistic growth model. Prevents unrealistic exponential explosion."""
    return saturation / (1 + ((saturation - base) / base) * np.exp(-growth_rate * year))


async def predict_impact(
    startup_id: str,
    base_co2_tonnes_per_year: float,
    base_jobs: int,
    forecast_years: int,
    growth_rate: float = 0.35,       # 35% annual growth (placeholder)
    co2_saturation_mult: float = 20.0,
) -> ImpactPredictionResponse:
    co2_saturation = base_co2_tonnes_per_year * co2_saturation_mult
    rng = np.random.default_rng(seed=hash(startup_id) % (2**32))

    forecasts: list[YearlyImpactForecast] = []
    for year in range(1, forecast_years + 1):
        co2 = _growth_curve(base_co2_tonnes_per_year, year, growth_rate, co2_saturation)
        # Add stochastic noise that increases with forecast distance
        noise_std = co2 * 0.05 * year
        co2_sample = float(np.clip(co2 + rng.normal(0, noise_std), 0, co2_saturation))

        jobs = int(base_jobs * (1 + growth_rate) ** year)
        confidence = max(0.3, 1.0 - (year * 0.08))  # degrades with time

        forecasts.append(YearlyImpactForecast(
            year=year,
            co2_reduction_tonnes=round(co2_sample, 2),
            jobs_created=jobs,
            confidence=round(confidence, 3),
        ))

    return ImpactPredictionResponse(
        startup_id=startup_id,
        forecasts=forecasts,
        model_version=settings.impact_model_version,
    )
