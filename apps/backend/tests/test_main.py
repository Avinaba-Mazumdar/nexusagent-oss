import pytest
from httpx import ASGITransport, AsyncClient

from app.config import settings
from app.db.neon import neon_db
from app.main import app


@pytest.mark.asyncio
async def test_root_endpoint():
    """Test the root endpoint returns app metadata."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "Welcome to NexusAgent" in data["message"]
        assert data["version"] == settings.VERSION
        assert data["health_check"] == "/health"


@pytest.mark.db
@pytest.mark.asyncio
async def test_health_endpoints():
    """Test both /health and /api/health endpoints with DB status verification."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        for path in ["/health", "/api/health"]:
            response = await client.get(path)
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "healthy"
            assert data["app_name"] == settings.APP_NAME
            assert data["version"] == settings.VERSION
            assert data["environment"] == settings.ENVIRONMENT
            assert data["database"]["status"] == "connected"
            assert "timestamp" in data


@pytest.mark.asyncio
async def test_health_endpoint_unhealthy_when_db_disconnected(monkeypatch):
    """Test /health returns 503 and unhealthy status when pool is disconnected."""
    transport = ASGITransport(app=app)
    monkeypatch.setattr(neon_db, "pool", None)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 503
        data = response.json()
        assert data["status"] == "unhealthy"
        assert data["database"]["status"] == "disconnected"


@pytest.mark.asyncio
async def test_cors_headers():
    """Test that configured CORS origins are accepted in options/get requests."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        headers = {
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        }
        response = await client.options("/health", headers=headers)
        assert response.status_code == 200
        assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"
