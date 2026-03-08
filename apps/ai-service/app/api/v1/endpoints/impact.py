from fastapi import APIRouter, Query
from app.models.schemas import ImpactPredictionRequest, ImpactPredictionResponse
from app.services.impact_predictor import predict_impact

router = APIRouter(prefix="/impact", tags=["Impact Prediction"])


@router.post("/{startup_id}/forecast", response_model=ImpactPredictionResponse)
async def forecast_impact(
    startup_id: str,
    body: ImpactPredictionRequest,
    forecast_years: int = Query(default=5, ge=1, le=20),
) -> ImpactPredictionResponse:
    """
    Generate a multi-year probabilistic impact forecast for a startup.
    Returns yearly CO2 reduction and jobs-created projections with confidence scores.
    """
    return await predict_impact(
        startup_id=startup_id,
        base_co2_tonnes_per_year=body.base_co2_tonnes_per_year,
        base_jobs=body.base_jobs,
        forecast_years=forecast_years,
    )
