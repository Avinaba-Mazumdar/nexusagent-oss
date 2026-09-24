from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.auth import create_access_token
from app.db.models import User
from app.db.neon import neon_db
from app.main import app
from app.rag.parser import (
    compute_line_positions,
    default_markdown_parser,
)

SAMPLE_RFC_MARKDOWN = """# RFC-104: Raft Consensus vs Multi-Paxos for High-Throughput Write Pipelines

Category: Distributed Systems Consensus
Status: Draft
Author: Systems Architecture Working Group

---

## 1. Abstract and Core Tradeoffs

Distributed consensus protocols under write-heavy workloads face severe bottlenecks when leader election is contested.
In this specification, we contrast Raft linearizable log replication against Multi-Paxos pipelining.
Key design criteria include:
- Commit latency under partition
- Heartbeat traffic overhead
- Out-of-order log application

## 2. Invariants & Guarantees

Every leader must uphold monotonic sequence numbering.
If a partition occurs across three availability zones, quorums require `floor(N/2) + 1` nodes to acknowledge state transitions before client ACK is returned.
Under high concurrency, batched write windows achieve 14,000 IOPS with a 99th percentile commit latency bounded by 4.2ms.

### 2.1 State Machine Safety

If server S1 has applied an entry at a given index, no other server can ever apply a different log entry for the same index.

```rust
pub struct ConsensusNode {
    pub current_term: u64,
    pub voted_for: Option<NodeId>,
    pub commit_index: u64,
}
```

## 3. Performance & Throughput Limits

Benchmark results across AWS us-east-1 and eu-central-1 demonstrate significant divergence in tail latency during network flapping events.
"""


def test_compute_line_positions():
    text = "Line 1\nLine 2\nLine 3\nLine 4\nLine 5"
    sub = "Line 2\nLine 3"
    start, end = compute_line_positions(text, sub)
    assert start == 2
    assert end == 3


def test_markdown_hierarchical_parser_chunks_and_metadata():
    doc_id = uuid4()
    chunks = default_markdown_parser.parse_markdown(
        markdown_text=SAMPLE_RFC_MARKDOWN,
        document_id=doc_id,
        extra_metadata={"filename": "rfc-104.md"},
    )

    assert len(chunks) >= 3
    for chunk in chunks:
        assert chunk.document_id == doc_id
        assert chunk.content
        assert "startLine" in chunk.metadata
        assert "endLine" in chunk.metadata
        assert chunk.metadata["startLine"] >= 1
        assert chunk.metadata["endLine"] >= chunk.metadata["startLine"]
        assert "sha256" in chunk.metadata
        assert chunk.metadata["filename"] == "rfc-104.md"

    # Check header hierarchy extraction
    header_paths = [c.metadata.get("headerPath") for c in chunks]
    has_sub_header = any("2.1 State Machine Safety" in " ".join(h) for h in header_paths if h)
    assert has_sub_header, (
        f"Expected at least one chunk to capture sub-header '2.1 State Machine Safety', got {header_paths}"
    )


@pytest.fixture(autouse=True)
async def setup_db():
    await neon_db.connect()
    yield
    await neon_db.disconnect()


@pytest.mark.asyncio
async def test_upload_and_list_documents():
    transport = ASGITransport(app=app)
    user_id = uuid4()
    token, _ = create_access_token({"sub": str(user_id), "role": "user", "is_guest": False})

    # Pre-seed user in database if neon is connected
    test_user = User(
        id=user_id,
        name="RFC Architect",
        email=f"architect-{user_id.hex[:6]}@nexusagent.test",
        is_guest=False,
    )
    if neon_db.pool:
        await neon_db.create_user(test_user)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Upload sample RFC
        files = {
            "file": (
                "rfc-104-raft.md",
                SAMPLE_RFC_MARKDOWN.encode("utf-8"),
                "text/markdown",
            )
        }
        headers = {"Authorization": f"Bearer {token}"}
        response = await client.post("/api/documents/upload", files=files, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "document" in data
        assert data["document"]["filename"] == "rfc-104-raft.md"
        assert data["chunksCount"] >= 3
        assert len(data["previewChunks"]) > 0

        doc_id = data["document"]["id"]

        # 2. Fetch document chunks
        chunk_response = await client.get(f"/api/documents/{doc_id}/chunks", headers=headers)
        assert chunk_response.status_code == 200
        chunk_data = chunk_response.json()
        assert "chunks" in chunk_data
        assert len(chunk_data["chunks"]) == data["chunksCount"]
        first_chunk = chunk_data["chunks"][0]
        assert "startLine" in first_chunk["metadata"]
        assert "endLine" in first_chunk["metadata"]

        # 3. List documents for user
        list_response = await client.get("/api/documents", headers=headers)
        assert list_response.status_code == 200
        docs_list = list_response.json()["documents"]
        filenames = [d["filename"] for d in docs_list]
        assert "rfc-104-raft.md" in filenames

        # 4. Upload duplicate file (test deduplication response)
        files_dup = {
            "file": (
                "rfc-104-raft.md",
                SAMPLE_RFC_MARKDOWN.encode("utf-8"),
                "text/markdown",
            )
        }
        dup_response = await client.post("/api/documents/upload", files=files_dup, headers=headers)
        assert dup_response.status_code == 200
        dup_data = dup_response.json()
        assert dup_data["document"]["id"] == doc_id
