import asyncio
import json
import logging
from collections.abc import AsyncIterator
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.agent.graph import AgentGraph, default_agent_graph
from app.agent.state import AgentState
from app.config import settings
from app.core.auth import get_client_ip, get_current_user
from app.db.models import User
from app.db.neon import NeonDatabase, get_db

logger = logging.getLogger("nexusagent.routes.agent")

router = APIRouter(prefix="/agent", tags=["Agent Autonomous Orchestration & SSE Streaming"])


class AgentStreamRequestWire(BaseModel):
    query: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="Natural language prompt or architectural inquiry for autonomous agent",
    )
    documentId: str | None = Field(
        None,
        description="Optional document UUID filter to scope retrieval to a specific RFC/document",
    )
    sessionId: str | None = Field(
        None,
        description="Optional existing session ID for conversation continuity",
    )


def format_sse(event_type: str, data: dict) -> str:
    """Format structured payload into valid Server-Sent Event frame."""
    json_str = json.dumps(data, default=str)
    return f"event: {event_type}\ndata: {json_str}\n\n"


async def generate_agent_stream(
    query: str,
    user_id: UUID | None,
    document_id: UUID | None,
    session_id: str,
    graph: AgentGraph,
) -> AsyncIterator[str]:
    """
    Asynchronously run AgentGraph pipeline and yield SSE event chunks:
    plan -> node_start -> tool_call -> tool_result -> critic -> token -> done.
    """
    initial_state = AgentState(
        session_id=session_id,
        user_id=user_id,
        query=query,
        document_id=document_id,
    )

    yield format_sse(
        "start",
        {
            "sessionId": session_id,
            "query": query,
            "timestamp": initial_state.created_at.isoformat(),
        },
    )

    try:
        final_state = initial_state
        async for node_name, step_state in graph.stream_steps(initial_state):
            final_state = step_state

            # 1. Yield node_start event
            yield format_sse(
                "node_start",
                {
                    "node": node_name,
                    "sessionId": session_id,
                    "iteration": step_state.iteration_count,
                },
            )

            # 2. Yield node-specific events
            if node_name == "planner":
                yield format_sse(
                    "plan",
                    {
                        "sessionId": session_id,
                        "plan": [
                            {
                                "stepNumber": s.step_number,
                                "description": s.description,
                                "status": s.status,
                                "tool": s.tool,
                            }
                            for s in step_state.plan
                        ],
                    },
                )

            elif node_name == "retriever":
                yield format_sse(
                    "tool_result",
                    {
                        "tool": "hybrid_rag_search",
                        "chunksRetrieved": len(step_state.retrieved_chunks),
                        "citations": [
                            {
                                "id": c.id,
                                "chunkId": c.chunk_id,
                                "documentId": c.document_id,
                                "filename": c.filename,
                                "startLine": c.start_line,
                                "endLine": c.end_line,
                                "headerPath": c.header_path,
                                "preview": c.preview,
                            }
                            for c in step_state.citations
                        ],
                    },
                )

            elif node_name == "sandbox":
                for call, res in zip(step_state.tool_calls, step_state.tool_results):
                    yield format_sse(
                        "tool_call",
                        {
                            "tool": "python_sandbox",
                            "code": call.get("code"),
                        },
                    )
                    yield format_sse(
                        "tool_result",
                        {
                            "tool": "python_sandbox",
                            "success": res.get("success"),
                            "stdout": res.get("stdout"),
                            "stderr": res.get("stderr"),
                            "durationMs": res.get("duration_ms"),
                        },
                    )

            elif node_name == "critic":
                yield format_sse(
                    "critic",
                    {
                        "sessionId": session_id,
                        "reflectionScore": step_state.reflection_score,
                        "isGrounded": step_state.is_grounded,
                        "needsReplan": step_state.needs_replan,
                        "feedback": step_state.reflection_feedback,
                        "iteration": step_state.iteration_count,
                    },
                )

            elif node_name == "synthesizer":
                # Progressive rendering: the deterministic synthesizer produces the full markdown
                # answer in one step, so it is re-chunked here for incremental SSE delivery.
                # No model token stream is being simulated or claimed.
                response_text = step_state.response
                words = response_text.split(" ")
                for i in range(0, len(words), 3):
                    chunk = " ".join(words[i : i + 3]) + " "
                    yield format_sse(
                        "token",
                        {
                            "sessionId": session_id,
                            "token": chunk,
                        },
                    )
                    await asyncio.sleep(0.01)

        # 3. Final completion event
        yield format_sse(
            "done",
            {
                "sessionId": session_id,
                "query": query,
                "response": final_state.response,
                "nodeHistory": final_state.node_history,
                "plan": [
                    {
                        "stepNumber": s.step_number,
                        "description": s.description,
                        "status": s.status,
                        "tool": s.tool,
                    }
                    for s in final_state.plan
                ],
                "citations": [
                    {
                        "id": c.id,
                        "chunkId": c.chunk_id,
                        "documentId": c.document_id,
                        "filename": c.filename,
                        "startLine": c.start_line,
                        "endLine": c.end_line,
                        "headerPath": c.header_path,
                        "preview": c.preview,
                    }
                    for c in final_state.citations
                ],
                "mermaidDiagrams": final_state.mermaid_diagrams,
                "reflectionScore": final_state.reflection_score,
                "isGrounded": final_state.is_grounded,
                "iterationCount": final_state.iteration_count,
                "isComplete": True,
                "completedAt": final_state.completed_at.isoformat()
                if final_state.completed_at
                else None,
            },
        )

    except Exception as e:
        logger.exception("Error during agent SSE streaming")
        yield format_sse("error", {"error": str(e), "sessionId": session_id})


@router.post("/stream")
async def stream_agent_execution(
    payload: AgentStreamRequestWire,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: NeonDatabase = Depends(get_db),
    byok_key: str | None = Header(None, alias="X-User-API-Key"),
    graph: AgentGraph = Depends(lambda: default_agent_graph),
):
    """
    Server-Sent Events (SSE) streaming endpoint for autonomous agent DAG execution.
    Streams structured real-time events: plan, node_start, tool_call, tool_result, critic, token, done.

    ASI-07: the token bucket is enforced server-side. Callers that present their own provider
    credential via the `X-User-API-Key` header (BYOK) spend their own quota and bypass the bucket.
    """
    client_ip = get_client_ip(request)

    if not byok_key:
        default_tokens = settings.GUEST_QUOTA_DEFAULT if current_user.is_guest else 25
        await db.get_or_create_rate_limit(current_user.id, client_ip, default_tokens=default_tokens)
        if not await db.decrement_rate_limit(current_user.id, client_ip):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=(
                    "Free-tier quota limit reached. Bring your own key (BYOK) to continue "
                    "unconstrained or hire me for a custom build."
                ),
            )

    doc_uuid: UUID | None = None
    if payload.documentId:
        try:
            doc_uuid = UUID(payload.documentId)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid documentId UUID format",
            )

    session_id = payload.sessionId or uuid4().hex

    return StreamingResponse(
        generate_agent_stream(
            query=payload.query,
            user_id=current_user.id,
            document_id=doc_uuid,
            session_id=session_id,
            graph=graph,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "Content-Type": "text/event-stream; charset=utf-8",
        },
    )
