"""Seeded knowledge-base listing for the Workspace Document Vault.

The former `POST /api/chat` streaming endpoint was removed: it never called a model,
emitted canned benchmark prose with fabricated latency/token telemetry, and was unreachable
from the UI. All agentic queries now flow through `POST /api/agent/stream` (LangGraph DAG),
which is the single streaming surface the frontend consumes.
"""

from fastapi import APIRouter, Depends

from app.db.neon import NeonDatabase, get_db

router = APIRouter(prefix="/chat", tags=["Seeded Knowledge Base"])


@router.get("/documents")
async def list_seeded_documents(db: NeonDatabase = Depends(get_db)):
    """Return pre-indexed benchmark documents available for RAG."""
    docs = await db.get_seeded_documents()
    return {"documents": docs}
