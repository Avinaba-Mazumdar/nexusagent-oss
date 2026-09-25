import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.db
@pytest.mark.asyncio
async def test_get_seeded_documents():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/chat/documents")
        assert response.status_code == 200
        data = response.json()
        assert "documents" in data
        assert len(data["documents"]) >= 5
        filenames = [d["filename"] for d in data["documents"]]
        assert "benchlm_evals.md" in filenames
        assert "cursor_bench.md" in filenames
        assert "openrouter_metrics.md" in filenames
        assert "leaks_rumours.md" in filenames
        assert "artificial_analysis.md" in filenames
        assert "rfc_104_consensus.md" in filenames
        assert "neon_storage_architecture.md" in filenames
