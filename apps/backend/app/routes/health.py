from datetime import UTC, datetime

import asyncpg
from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

from app.config import settings
from app.db.neon import neon_db

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("")
async def get_health():
    """Return health check and runtime status information, including Neon DB connectivity."""
    db_connected = False
    if neon_db.pool is not None:
        try:
            async with neon_db.pool.acquire() as conn:
                val = await conn.fetchval("SELECT 1;")
                db_connected = val == 1
        except asyncpg.PostgresError, OSError:
            db_connected = False

    is_healthy = db_connected
    payload = {
        "status": "healthy" if is_healthy else "unhealthy",
        "app_name": settings.APP_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.now(UTC).isoformat(),
        "database": {
            "status": "connected" if db_connected else "disconnected",
            "connected": db_connected,
            "engine": "Neon Serverless PostgreSQL 18.6",
            "extensions": ["pgvector", "pg_trgm", "uuid-ossp"],
        },
    }

    status_code = status.HTTP_200_OK if is_healthy else status.HTTP_503_SERVICE_UNAVAILABLE
    return JSONResponse(status_code=status_code, content=payload)
