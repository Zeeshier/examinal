"""
Health Check Endpoint
Provides a simple endpoint to verify API availability.
"""

from fastapi import APIRouter
from app.schemas.schemas import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """
    Health check endpoint.
    Returns the current status of the API.
    """
    return HealthResponse(
        status="healthy",
        message="Examinal API is running"
    )
