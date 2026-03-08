from fastapi import APIRouter
from app.api.v1.endpoints import scenario, impact, pools, score

router = APIRouter()
router.include_router(scenario.router)
router.include_router(impact.router)
router.include_router(pools.router)
router.include_router(score.router)
