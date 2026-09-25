import json

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.rag.hybrid_search import HybridSearchEngine


@pytest.mark.asyncio
async def test_offline_hybrid_search_rfc104_and_neon():
    """Verify offline search reads bundled RFC-104 and Neon architecture files without DB pool."""
    engine = HybridSearchEngine(db=None)

    # Search for Raft consensus invariants
    raft_results = await engine._search_offline_knowledge_base(
        query="Raft leader election randomized election timer and majority quorum",
        limit=5,
    )
    assert len(raft_results) > 0
    assert any("rfc_104_consensus.md" == r.filename for r in raft_results)
    assert any("Raft" in r.content or "quorum" in r.content.lower() for r in raft_results)

    # Search for Neon storage architecture
    neon_results = await engine._search_offline_knowledge_base(
        query="Neon Pageserver LSM tree Safekeeper WAL replication",
        limit=5,
    )
    assert len(neon_results) > 0
    assert any("neon_storage_architecture.md" == r.filename for r in neon_results)
    assert any("Pageserver" in r.content or "Safekeeper" in r.content for r in neon_results)


@pytest.mark.db
@pytest.mark.asyncio
async def test_agent_stream_showcase_raft_diagram():
    """Verify agent stream produces Raft diagram and citations for RFC-104 query."""
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Obtain guest token
        guest_resp = await client.post("/api/auth/guest")
        assert guest_resp.status_code == 200
        token = guest_resp.json()["tokens"]["accessToken"]

        # Call streaming endpoint with RFC-104 prompt
        response = await client.post(
            "/api/agent/stream",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "query": "Compare Raft vs Multi-Paxos quorum invariants (RFC-104)",
            },
        )
        assert response.status_code == 200
        raw_stream = response.text

        blocks = raw_stream.split("\n\n")
        done_block = next((b for b in blocks if "event: done" in b), None)
        assert done_block is not None

        data_line = next(
            (line for line in done_block.split("\n") if line.startswith("data:")), None
        )
        assert data_line is not None

        done_data = json.loads(data_line[5:].strip())
        assert done_data["isComplete"] is True
        # Check that Raft consensus diagram is generated
        assert "```mermaid" in done_data["response"]
        assert "Raft Leader Node" in done_data["response"] or "Follower" in done_data["response"]
        assert len(done_data["citations"]) > 0


@pytest.mark.db
@pytest.mark.asyncio
async def test_agent_stream_showcase_neon_diagram():
    """Verify agent stream produces Neon Safekeeper/Pageserver diagram for Neon query."""
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        guest_resp = await client.post("/api/auth/guest")
        assert guest_resp.status_code == 200
        token = guest_resp.json()["tokens"]["accessToken"]

        response = await client.post(
            "/api/agent/stream",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "query": "Analyze Neon serverless storage architecture, Safekeepers, and Pageserver LSM tree",
            },
        )
        assert response.status_code == 200
        raw_stream = response.text

        blocks = raw_stream.split("\n\n")
        done_block = next((b for b in blocks if "event: done" in b), None)
        assert done_block is not None

        data_line = next(
            (line for line in done_block.split("\n") if line.startswith("data:")), None
        )
        assert data_line is not None

        done_data = json.loads(data_line[5:].strip())
        assert done_data["isComplete"] is True
        assert "```mermaid" in done_data["response"]
        assert "Safekeeper" in done_data["response"] and "Pageserver" in done_data["response"]
        assert len(done_data["citations"]) > 0
