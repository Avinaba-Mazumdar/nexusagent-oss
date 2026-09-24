import pytest
from httpx import ASGITransport, AsyncClient

from app.db.neon import neon_db
from app.main import app


@pytest.fixture(autouse=True)
async def setup_db():
    await neon_db.connect()
    yield
    await neon_db.disconnect()


@pytest.mark.asyncio
async def test_get_seeded_documents():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/chat/documents")
        assert response.status_code == 200
        data = response.json()
        assert "documents" in data
        assert len(data["documents"]) == 5
        filenames = [d["filename"] for d in data["documents"]]
        assert "benchlm_evals.md" in filenames
        assert "cursor_bench.md" in filenames
        assert "openrouter_metrics.md" in filenames
        assert "leaks_rumours.md" in filenames
        assert "artificial_analysis.md" in filenames


@pytest.mark.asyncio
async def test_stream_chat_byok():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/chat",
            json={
                "message": "Compare Gemini 2.5 Flash on CursorBench",
                "byok_key": "test-key-mock",
                "byok_provider": "google",
            },
        )
        assert response.status_code == 200
        assert "text/event-stream" in response.headers.get("content-type", "")
        content = response.text
        assert "data: " in content
        assert "ROUTER" in content
        assert "METRICS" in content
