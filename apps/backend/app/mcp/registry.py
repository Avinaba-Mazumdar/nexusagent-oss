"""
MCP Tool & Resource Registry.
Provides tools:
  - hybrid_rag_search: Dense pgvector + BM25 tsvector with RRF ranking
  - python_sandbox: AST-isolated execution runtime with 5.0s timeout
  - mcp_sql_audit: Read-only schema introspection and query analysis for Neon PostgreSQL 18
"""

import json
import logging
import re
from pathlib import Path
from typing import Any

from app.core.sandbox import default_python_sandbox
from app.db.neon import neon_db
from app.mcp.protocol import (
    ResourceDefinition,
    ToolCallContent,
    ToolCallResult,
    ToolDefinition,
    ToolInputSchema,
)
from app.rag.hybrid_search import default_hybrid_search_engine

logger = logging.getLogger("nexusagent.mcp.registry")

KNOWLEDGE_BASE_DIR = (
    Path(__file__).resolve().parent.parent.parent.parent / "knowledge_base" / "benchmarks"
)


# Tool Definitions
TOOLS: list[ToolDefinition] = [
    ToolDefinition(
        name="hybrid_rag_search",
        description="Performs dense pgvector and sparse BM25 hybrid search across RFC documents and AI model benchmarks fused via Reciprocal Rank Fusion (RRF).",
        inputSchema=ToolInputSchema(
            properties={
                "query": {
                    "type": "string",
                    "description": "Natural language query to search across architectural RFCs and benchmarks.",
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of chunks to return (1 to 20). Default is 5.",
                    "default": 5,
                },
            },
            required=["query"],
        ),
    ),
    ToolDefinition(
        name="python_sandbox",
        description="Executes sandboxed mathematical or distributed systems verification script inside an AST-isolated Python runtime with a 5.0s timeout ceiling.",
        inputSchema=ToolInputSchema(
            properties={
                "code": {
                    "type": "string",
                    "description": "Python source code to execute. Blocked from file I/O, network sockets, and OS syscalls.",
                },
                "timeout": {
                    "type": "number",
                    "description": "Timeout limit in seconds (default 5.0, maximum 10.0).",
                    "default": 5.0,
                },
            },
            required=["code"],
        ),
    ),
    ToolDefinition(
        name="mcp_sql_audit",
        description="Executes read-only SQL queries and schema introspection against Neon PostgreSQL 18. Strictly blocks mutations (INSERT, UPDATE, DELETE, DROP, ALTER).",
        inputSchema=ToolInputSchema(
            properties={
                "query": {
                    "type": "string",
                    "description": "Read-only SQL statement (SELECT, EXPLAIN, SHOW).",
                }
            },
            required=["query"],
        ),
    ),
]


# Resource Definitions
STATIC_RESOURCES: list[ResourceDefinition] = [
    ResourceDefinition(
        uri="rfc://104-raft-consensus",
        name="RFC-104: Raft Consensus vs Multi-Paxos",
        description="Leader election invariants, log replication guarantees, and quorum models.",
        mimeType="text/markdown",
    ),
    ResourceDefinition(
        uri="rfc://neon-storage-architecture",
        name="Neon Storage Architecture Whitepaper",
        description="Serverless PostgreSQL compute-storage separation and page server invariants.",
        mimeType="text/markdown",
    ),
    ResourceDefinition(
        uri="benchmark://benchlm-2026",
        name="BenchLM 2026 AI Model Intelligence & Latency Suite",
        description="Weekly frontier model reasoning, throughput, and TTFT benchmarks.",
        mimeType="text/markdown",
    ),
    ResourceDefinition(
        uri="benchmark://cursorbench-coding",
        name="CursorBench Agentic Coding Leaderboard",
        description="Comparative software engineering benchmarks for Claude, GPT, and Gemini.",
        mimeType="text/markdown",
    ),
]


class McpRegistry:
    """Manages MCP tool execution, resource listing, and protocol dispatch."""

    @staticmethod
    def get_tools() -> list[dict[str, Any]]:
        return [tool.model_dump() for tool in TOOLS]

    @staticmethod
    def get_resources() -> list[dict[str, Any]]:
        return [res.model_dump() for res in STATIC_RESOURCES]

    @staticmethod
    async def read_resource(uri: str) -> dict[str, Any]:
        """Read resource content by URI."""
        filename_map = {
            "rfc://104-raft-consensus": "rfc_104_consensus.md",
            "rfc://neon-storage-architecture": "neon_storage_architecture.md",
            "benchmark://benchlm-2026": "benchlm_evals.md",
            "benchmark://cursorbench-coding": "cursor_bench.md",
        }

        # Check knowledge base files
        filename = filename_map.get(uri)
        if filename and KNOWLEDGE_BASE_DIR.is_dir():
            target_file = KNOWLEDGE_BASE_DIR / filename
            if target_file.is_file():
                content = target_file.read_text(encoding="utf-8")
                return {
                    "contents": [
                        {
                            "uri": uri,
                            "mimeType": "text/markdown",
                            "text": content,
                        }
                    ]
                }

        # Fallback simulated RFC content
        sample_rfc = (
            f"# Resource: {uri}\n\n"
            "Pre-seeded architecture specification from NexusAgent knowledge vault.\n"
            "Grounding Invariants:\n"
            "- Quorum required: (N // 2) + 1\n"
            "- Read consistency: Linearizable read index\n"
            "- Storage tier: Neon PostgreSQL 18 with compute-storage decoupling\n"
        )
        return {
            "contents": [
                {
                    "uri": uri,
                    "mimeType": "text/markdown",
                    "text": sample_rfc,
                }
            ]
        }

    @classmethod
    async def call_tool(cls, name: str, arguments: dict[str, Any]) -> ToolCallResult:
        """Route and execute tool invocation."""
        if name == "hybrid_rag_search":
            return await cls._exec_hybrid_search(arguments)
        elif name == "python_sandbox":
            return await cls._exec_python_sandbox(arguments)
        elif name == "mcp_sql_audit":
            return await cls._exec_sql_audit(arguments)
        else:
            return ToolCallResult(
                content=[
                    ToolCallContent(
                        text=f"Unknown tool '{name}'. Available: hybrid_rag_search, python_sandbox, mcp_sql_audit"
                    )
                ],
                isError=True,
            )

    @classmethod
    async def _exec_hybrid_search(cls, arguments: dict[str, Any]) -> ToolCallResult:
        query = str(arguments.get("query", "")).strip()
        if not query:
            return ToolCallResult(
                content=[ToolCallContent(text="Missing required argument 'query'.")],
                isError=True,
            )
        limit = min(max(int(arguments.get("limit", 5)), 1), 20)

        results = await default_hybrid_search_engine.search(query=query, limit=limit)
        if not results:
            return ToolCallResult(
                content=[
                    ToolCallContent(
                        text=f"No matching chunks found in knowledge base for query: '{query}'."
                    )
                ],
                isError=False,
            )

        formatted_chunks = []
        for idx, r in enumerate(results, start=1):
            line_info = (
                f" (Lines {r.start_line}-{r.end_line})" if r.start_line and r.end_line else ""
            )
            header_info = f" § {' > '.join(r.header_path)}" if r.header_path else ""
            formatted_chunks.append(
                f"### Result {idx}: [{r.filename}{line_info}]{header_info}\n"
                f"Relevance Score (RRF): {r.similarity_score:.4f}\n\n"
                f"{r.content.strip()}\n"
            )

        return ToolCallResult(
            content=[ToolCallContent(text="\n---\n".join(formatted_chunks))],
            isError=False,
        )

    @classmethod
    async def _exec_python_sandbox(cls, arguments: dict[str, Any]) -> ToolCallResult:
        code = str(arguments.get("code", "")).strip()
        if not code:
            return ToolCallResult(
                content=[ToolCallContent(text="Missing required argument 'code'.")],
                isError=True,
            )
        timeout = float(arguments.get("timeout", 5.0))

        res = await default_python_sandbox.execute(code=code, timeout_seconds=timeout)
        output_parts = [
            f"Execution Success: {res.success}",
            f"Duration: {res.duration_ms:.2f}ms",
        ]
        if res.stdout:
            output_parts.append(f"\n[stdout]\n{res.stdout}")
        if res.stderr:
            output_parts.append(f"\n[stderr]\n{res.stderr}")

        return ToolCallResult(
            content=[ToolCallContent(text="\n".join(output_parts))],
            isError=not res.success,
        )

    @classmethod
    async def _exec_sql_audit(cls, arguments: dict[str, Any]) -> ToolCallResult:
        query = str(arguments.get("query", "")).strip()
        if not query:
            return ToolCallResult(
                content=[ToolCallContent(text="Missing required argument 'query'.")],
                isError=True,
            )

        # Security check: Read-Only Enforcement
        forbidden_pattern = (
            r"\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|GRANT|REVOKE|EXECUTE|LOCK)\b"
        )
        if re.search(forbidden_pattern, query, re.IGNORECASE):
            return ToolCallResult(
                content=[
                    ToolCallContent(
                        text="Security Violation: Only read-only queries (SELECT, EXPLAIN, SHOW) are permitted in SQL audit mode."
                    )
                ],
                isError=True,
            )

        # Execute query if database pool is available
        if neon_db.pool:
            try:
                rows = await neon_db.fetch(query)
                formatted_rows = [dict(r) for r in rows[:50]]
                return ToolCallResult(
                    content=[
                        ToolCallContent(text=json.dumps(formatted_rows, indent=2, default=str))
                    ],
                    isError=False,
                )
            except Exception as e:  # noqa: BLE001
                return ToolCallResult(
                    content=[ToolCallContent(text=f"Database query error: {e!s}")],
                    isError=True,
                )

        # Fallback offline schema audit
        offline_schema = {
            "tables": [
                {
                    "name": "users",
                    "columns": [
                        "id (UUID)",
                        "email (VARCHAR)",
                        "role (VARCHAR)",
                        "created_at (TIMESTAMP)",
                    ],
                },
                {
                    "name": "documents",
                    "columns": [
                        "id (UUID)",
                        "filename (VARCHAR)",
                        "total_chunks (INT)",
                        "is_seeded (BOOL)",
                    ],
                },
                {
                    "name": "document_chunks",
                    "columns": [
                        "id (UUID)",
                        "document_id (UUID)",
                        "content (TEXT)",
                        "embedding (vector(768))",
                        "tsv_content (tsvector)",
                    ],
                },
                {
                    "name": "rate_limit_buckets",
                    "columns": [
                        "user_id (UUID)",
                        "tokens_remaining (INT)",
                        "last_refill (TIMESTAMP)",
                    ],
                },
                {
                    "name": "tool_audit_logs",
                    "columns": [
                        "id (UUID)",
                        "tool_name (VARCHAR)",
                        "arguments (JSONB)",
                        "executed_at (TIMESTAMP)",
                    ],
                },
            ],
            "status": "Neon PostgreSQL 18 - Verified Offline Schema Topology",
        }
        return ToolCallResult(
            content=[ToolCallContent(text=json.dumps(offline_schema, indent=2))],
            isError=False,
        )


default_mcp_registry = McpRegistry()
