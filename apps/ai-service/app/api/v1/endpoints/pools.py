from fastapi import APIRouter
from app.models.schemas import PoolRebalanceRequest, PoolRebalanceResponse, StartupAllocation
from app.services.pool_rebalancer import rebalance_pool

router = APIRouter(prefix="/pools", tags=["Risk Pool Rebalancing"])


@router.post("/{pool_id}/rebalance", response_model=PoolRebalanceResponse)
async def rebalance_pool_endpoint(
    pool_id: str, body: PoolRebalanceRequest
) -> PoolRebalanceResponse:
    """
    Compute optimal startup allocation weights for a risk pool.
    If drift vs. current allocations is below threshold and force=False,
    no rebalancing is recommended.
    """
    # TODO: fetch real startup profiles and current allocations from DB
    mock_profiles = [
        {"id": "startup_a", "risk_score": 30, "impact_score": 75, "dvn_confidence": 85, "milestone_recency_days": 14},
        {"id": "startup_b", "risk_score": 60, "impact_score": 90, "dvn_confidence": 70, "milestone_recency_days": 60},
        {"id": "startup_c", "risk_score": 20, "impact_score": 55, "dvn_confidence": 95, "milestone_recency_days": 7},
    ]
    mock_prev = [
        StartupAllocation(startup_id="startup_a", weight=0.40, rationale="Previous allocation"),
        StartupAllocation(startup_id="startup_b", weight=0.35, rationale="Previous allocation"),
        StartupAllocation(startup_id="startup_c", weight=0.25, rationale="Previous allocation"),
    ]

    return await rebalance_pool(
        pool_id=pool_id,
        startup_profiles=mock_profiles,
        previous_allocations=mock_prev,
        force=body.force,
    )
