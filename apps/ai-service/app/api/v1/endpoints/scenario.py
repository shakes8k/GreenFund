from fastapi import APIRouter, HTTPException
from app.models.schemas import ScenarioRequest, ScenarioResponse
from app.services.scenario_engine import run_scenario

router = APIRouter(prefix="/scenario", tags=["Scenario Stress-Testing"])


@router.post("/{startup_id}", response_model=ScenarioResponse)
async def run_scenario_endpoint(startup_id: str, body: ScenarioRequest) -> ScenarioResponse:
    """
    Run a single-scenario stress test for a startup.
    Returns projected valuation, impact multiplier, risk score, and an
    AI-generated plain-language narrative.
    """
    if body.startup_id != startup_id:
        raise HTTPException(status_code=422, detail="startup_id mismatch in path and body")

    return await run_scenario(
        startup_id=startup_id,
        scenarios=[body.scenario],
        baseline_valuation_usd=body.baseline_valuation_usd,
    )


@router.post("/{startup_id}/batch", response_model=ScenarioResponse)
async def run_scenario_batch(startup_id: str, body: list[ScenarioRequest]) -> ScenarioResponse:
    """
    Run multiple scenarios at once for the interactive What-If simulator.
    """
    if not body:
        raise HTTPException(status_code=422, detail="At least one scenario required")

    return await run_scenario(
        startup_id=startup_id,
        scenarios=[req.scenario for req in body],
        baseline_valuation_usd=body[0].baseline_valuation_usd,
    )
