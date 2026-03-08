"""
AI-driven risk pool rebalancer.

Computes optimal allocation weights for startups within a pool based on:
  - DVN verification status and reputation-weighted confidence scores
  - Predicted impact per dollar invested
  - Risk scores from the scenario engine
  - Recency of milestones completed

The rebalancer is called on a schedule (see config.rebalance_interval_hours)
and also on-demand via the API. Weights are pushed on-chain via
RiskPoolManager.rebalance() by the backend after the AI recommends them.
"""

from __future__ import annotations

import numpy as np
from app.core.config import settings
from app.models.schemas import PoolRebalanceResponse, StartupAllocation


def _softmax(scores: np.ndarray) -> np.ndarray:
    exp = np.exp(scores - scores.max())
    return exp / exp.sum()


async def rebalance_pool(
    pool_id: str,
    startup_profiles: list[dict],  # each: {id, risk_score, impact_score, dvn_confidence, milestone_recency_days}
    previous_allocations: list[StartupAllocation],
    force: bool = False,
) -> PoolRebalanceResponse:
    if not startup_profiles:
        return PoolRebalanceResponse(
            pool_id=pool_id,
            previous_allocations=previous_allocations,
            new_allocations=[],
            drift_percentage=0.0,
            rebalanced=False,
            model_version=settings.risk_pool_model_version,
        )

    # Compute composite score for each startup
    # Higher is better: high impact, high DVN confidence, recent milestones, low risk
    scores = np.array([
        (
            0.35 * p["impact_score"] / 100
            + 0.30 * p["dvn_confidence"] / 100
            + 0.20 * max(0, (365 - p["milestone_recency_days"]) / 365)
            - 0.15 * p["risk_score"] / 100
        )
        for p in startup_profiles
    ])

    weights = _softmax(scores)

    new_allocations = [
        StartupAllocation(
            startup_id=p["id"],
            weight=round(float(w), 6),
            rationale=(
                f"Impact score {p['impact_score']}, DVN confidence {p['dvn_confidence']}, "
                f"risk {p['risk_score']}, last milestone {p['milestone_recency_days']}d ago."
            ),
        )
        for p, w in zip(startup_profiles, weights)
    ]

    # Calculate max allocation drift vs previous
    prev_map = {a.startup_id: a.weight for a in previous_allocations}
    drift = max(
        abs(a.weight - prev_map.get(a.startup_id, 0.0)) for a in new_allocations
    ) * 100  # as percentage

    should_rebalance = force or drift >= settings.min_rebalance_drift_pct

    return PoolRebalanceResponse(
        pool_id=pool_id,
        previous_allocations=previous_allocations,
        new_allocations=new_allocations if should_rebalance else previous_allocations,
        drift_percentage=round(drift, 2),
        rebalanced=should_rebalance,
        model_version=settings.risk_pool_model_version,
    )
