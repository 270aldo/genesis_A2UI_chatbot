"""V1 API router — micro-action endpoints."""

from fastapi import APIRouter

from .sessions import router as sessions_router
from .sets import router as sets_router
from .stats import router as stats_router

v1_router = APIRouter(prefix="/api/v1")

v1_router.include_router(sessions_router)
v1_router.include_router(sets_router)
v1_router.include_router(stats_router)
