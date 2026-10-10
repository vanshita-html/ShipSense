from fastapi import APIRouter
from app.api.v1 import (
    auth,
    shipments,
    risk,
    recommendations,
    decisions,
    simulation,
    monitoring,
    pipeline,
    model_info
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(shipments.router)
api_router.include_router(risk.router)
api_router.include_router(recommendations.router)
api_router.include_router(decisions.router)
api_router.include_router(simulation.router)
api_router.include_router(monitoring.router)
api_router.include_router(pipeline.router)
api_router.include_router(model_info.router)
