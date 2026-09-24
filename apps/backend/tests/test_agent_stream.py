import json

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
async def test_agent_sse_streaming_endpoint():
    """Verify POST /api/agent/stream emits full sequence of structured SSE events."""
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Obtain guest token
        guest_resp = await client.post("/api/auth/guest")
        assert guest_resp.status_code == 200
        token = guest_resp.json()["tokens"]["accessToken"]

        # Call streaming endpoint
        response = await client.post(
            "/api/agent/stream",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "query": "Synthesize quorum requirements and write throughput for Raft consensus",
            },
        )

        assert response.status_code == 200
        assert "text/event-stream" in response.headers.get("content-type", "")

        raw_stream = response.text
        assert "event: start" in raw_stream
        assert "event: plan" in raw_stream
        assert "event: node_start" in raw_stream
        assert "event: critic" in raw_stream
        assert "event: done" in raw_stream

        # Parse SSE done event block
        blocks = raw_stream.split("\n\n")
        done_block = next((b for b in blocks if "event: done" in b), None)
        assert done_block is not None

        data_line = next((l for l in done_block.split("\n") if l.startswith("data:")), None)
        assert data_line is not None

        done_data = json.loads(data_line[5:].strip())
        assert done_data["isComplete"] is True
        assert "## Architectural Analysis" in done_data["response"]
        assert len(done_data["plan"]) >= 2
        assert len(done_data["nodeHistory"]) >= 3
        assert done_data["reflectionScore"] > 0.0
