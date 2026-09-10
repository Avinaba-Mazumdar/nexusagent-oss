# NexusAgent (Codename: Archon) — Active MVP0 Phased Task Board

This document tracks all implementation phases for the **NexusAgent** autonomous architecture intelligence platform.

> **Status Legend:**
>
> - `[ ]` Open / Pending Implementation (Do NOT check until code exists on disk, builds cleanly, and tests pass)
> - `[/]` In Progress
> - `[x]` Completed, Verified & Passing Gate

---

## Phase 1: Monorepo Foundation & Toolchain Setup

- [x] **Task 1.1: Turborepo & pnpm Monorepo Configuration**
    - Configure `pnpm-workspace.yaml` declaring `apps/*` and `packages/*`.
    - Set up `turbo.json` with cached build, test, and dev pipelines.
- [x] **Task 1.2: Next.js 16 Frontend Initialization (`apps/frontend`)**
    - Scaffold Next.js 16 App Router project with React 19 and TypeScript 7.
    - Initialize Tailwind CSS v4 with `@theme` tokens in `styles/globals.css`.
    - Configure **shadcn/ui** primitives (Button, Dialog, Drawer, Tabs, Badge, ScrollArea, Tooltip).
    - Add Lucide React (`^1.41.0`) and Mermaid.js (`^11.4.1`) dependencies.
- [x] **Task 1.3: FastAPI Backend Initialization (`apps/backend`)**
    - Initialize Python 3.14 project with `uv` (`pyproject.toml` and `uv.lock`).
    - Configure FastAPI ASGI application with CORS, Pydantic v2 settings, and Uvicorn.
    - Set up directory structure: `agent/`, `rag/`, `mcp/`, `core/`, `db/`, `routes/`.
- [x] **Task 1.4: Shared Contracts Package (`packages/contracts`)**
    - Define shared TypeScript interfaces: `AgentState`, `StepNode`, `SSEEventPayload`, `McpToolSchema`, `CitationItem`.
    - Export build artifacts for consumption by `apps/frontend`.

---

## Phase 2: Neon PostgreSQL 18 Data Tier, pgvector & Python Backend Auth Engine

- [ ] **Task 2.1: Neon PostgreSQL 18 Schema Migration**
    - Write `migrations/20260901000000_core_schema.sql` enabling `uuid-ossp` and `vector`.
    - Create tables: `users` (with password hash, guest flag, avatar), `rate_limit_buckets`, `documents` (with `is_seeded`), `document_chunks`, `agent_conversations`, `messages`, `tool_audit_logs`, `citations`.
    - Create HNSW index on `document_chunks.embedding` using `vector_cosine_ops`.
    - Create GIN index on `document_chunks.search_vector` (`tsvector`).
- [ ] **Task 2.2: FastAPI Backend Auth & Multi-Tenant Isolation (`core/auth.py`)**
    - Implement native FastAPI authentication service with signed JWTs (`PyJWT` / `cryptography`).
    - Implement 1-Click Guest Pass token issuance and password hashing (`argon2` / `bcrypt`).
    - Expose `/api/auth/guest`, `/api/auth/login`, `/api/auth/register`, `/api/auth/me`.
    - Enforce tenant data isolation via parameterized query filtering.
- [ ] **Task 2.3: Zero-Config Local Fallback Engine (`db/fallback.py`)**
    - Implement SQLite fallback using `aiosqlite` for metadata persistence.
    - Implement in-memory dot-product cosine similarity using NumPy.
    - Ensure backend starts and operates seamlessly if `NEON_DATABASE_URL` credentials are not provided.

---

## Phase 3: LlamaIndex Document Ingestion & Hybrid RAG Engine

- [ ] **Task 3.1: LlamaIndex Hierarchical Document Parser (`rag/parser.py`)**
    - Integrate `llama-index-core` `MarkdownNodeParser` preserving `h1`/`h2`/`h3` section structures.
    - Implement 800-character chunking with 120-character overlap.
    - Attach rich metadata: `document_id`, `section_title`, `start_line`, `end_line`, `token_count`.
- [ ] **Task 3.2: Dense Vector Embedding Pipeline (`rag/embeddings.py`)**
    - Implement async batch embedding generator supporting OpenAI `text-embedding-3-small` (1536-dim) or Gemini embeddings.
    - Store embeddings directly into Neon `document_chunks` table.
- [ ] **Task 3.3: Reciprocal Rank Fusion (RRF) Hybrid Search (`rag/hybrid_search.py`)**
    - Execute concurrent dense vector search (pgvector HNSW) and sparse lexical search (Postgres BM25 `tsvector`).
    - Calculate RRF fused ranking: $RRF(d) = \frac{1}{60 + rank_{dense}(d)} + \frac{1}{60 + rank_{sparse}(d)}$.
    - Return top-$K$ deduplicated chunks with line-level citation metadata.

---

## Phase 4: LangGraph Agent DAG & AST Python Sandbox

- [ ] **Task 4.1: Strongly-Typed AgentState Schema (`agent/state.py`)**
    - Define `AgentState` TypedDict: `messages`, `plan`, `current_step_index`, `retrieved_chunks`, `tool_outputs`, `reflection`, `human_approval_required`, `iteration_count`.
- [ ] **Task 4.2: LangGraph 1.2 StateGraph Node Pipeline (`agent/graph.py`)**
    - Implement `planner` node: Decomposes architectural inquiries into 3–5 verifiable sub-goals.
    - Implement `retriever` node: Queries LlamaIndex + Neon Hybrid RAG.
    - Implement `mcp_tools` node: Executes internal and external Model Context Protocol tools.
    - Implement `reflection` critic node: Evaluates intermediate claims against RFC constraints, emitting confidence score.
    - Implement `synthesizer` node: Generates markdown synthesis with citation markers and Mermaid diagrams.
    - Add conditional edge looping back if `reflection.needs_more_data == True` (capped at 10 iterations).
- [ ] **Task 4.3: Cross-Platform Subprocess AST Python Sandbox (`core/sandbox.py`)**
    - Parse candidate Python code with `ast.parse()`.
    - Block dangerous AST nodes: `Import`, `ImportFrom`, `Call` to `eval`/`exec`/`open`/`compile`/`__import__`, dunder attributes.
    - Execute safe code in isolated subprocess with 5.0-second timeout and output caps (cross-platform Windows/macOS/Linux).

---

## Phase 5: Model Context Protocol (MCP v2) Server & Client

- [ ] **Task 5.1: FastAPI MCP v2 Protocol Server (`/api/mcp/sse` & CLI stdio)**
    - Implement standard MCP SSE endpoint (`/api/mcp/sse` + `/api/mcp/messages`) and HTTP fallback (`/api/mcp/v1`).
    - Provide `python -m app.mcp.server` stdio command for Claude Desktop and Cursor integration.
    - Expose core tools: `hybrid_rag_search`, `python_sandbox`, `mcp_sql_audit`.
    - Expose accessible RFCs as MCP resources.
- [ ] **Task 5.2: MCP Tool Manifest & Scoped Authorization (`mcp/registry.py`)**
    - Validate tool inputs using Pydantic v2 schemas.
    - Validate Bearer JWT token and check declared permission scopes (`read:documents`, `exec:calculation`).
- [ ] **Task 5.3: External Client Interoperability Guide**
    - Provide Claude Desktop, Cursor, and Antigravity connection configurations.

---

## Phase 6: Next.js 16 + shadcn/ui Command Center Frontend

- [ ] **Task 6.1: Four-Zone Command Center Layout (`app/page.tsx`)**
    - **Header (`components/header/`)**: Branding, version badge, Python Backend Auth / Guest pass, quota token meter, BYOK toggle.
    - **Left Workspace (`components/workspace/`)**: Document vault with drag-and-drop uploader, active MCP servers list, and live tool toggle switches.
    - **Center Canvas (`components/canvas/`)**: Real-time agent streaming thread, dynamic Mermaid SVG viewer, interactive citation pills, and multi-line user inputs.
    - **Right Observability (`components/observability/`)**: Current node execution status, real-time token usage and cost tracker, and state log viewer with raw wire logs.
- [ ] **Task 6.2: Real-Time Markdown & Mermaid Rendering (`components/canvas/`)**
    - Stream markdown tokens smoothly with auto-scroll anchor.
    - Dynamically render Mermaid.js SVG architecture diagrams with pan/zoom controls.
    - Render interactive Citation Pills with hover popover preview and line jump.
- [ ] **Task 6.3: Human-in-the-Loop (HITL) Modal (`components/hitl/`)**
    - Display confirmation banner/modal when tool call requires human authorization.
    - Send approve/reject callback to `/api/agent/approval`.
- [ ] **Task 6.4: Interactive MCP Inspector (`components/observability/McpInspector.tsx`)**
    - Browse registered MCP tools and JSON parameter schemas.
    - Execute test tool calls directly from UI and view raw JSON-RPC wire request/response.

---

## Phase 7: Real-Time SSE Streaming & Observability Pipeline

- [ ] **Task 7.1: FastAPI Server-Sent Events Endpoint (`routes/agent.py`)**
    - Stream LangGraph execution events: `plan`, `node_start`, `tool_call`, `tool_result`, `reflection`, `token`, `done`.
- [ ] **Task 7.2: Next.js SSE Client Hook (`hooks/useAgentStream.ts`)**
    - Consume SSE stream with automatic reconnection and typed payload dispatching to Zustand stores.
- [ ] **Task 7.3: Live Reactive Agent DAG (`components/observability/CurrentNode.tsx`)**
    - Visualize execution graph in real time with glowing active nodes and progress badges.

---

## Phase 8: OWASP Top 10 for Agentic AI Hardening (ASI-01 to ASI-10)

- [ ] **Task 8.1: Prompt Injection Delimiters & Canary Tokens (ASI-01)**
    - Encapsulate uploaded document chunks in `<untrusted_document_context id="...">` XML tags.
    - Inject UUID canary tokens into system prompt; discard output and alert if canary leaks.
- [ ] **Task 8.2: PII Redaction & Multi-Tenant Isolation (ASI-02)**
    - Sanitize sensitive tokens/emails on ingestion.
    - Enforce tenant isolation preventing cross-tenant chunk leakage.
- [ ] **Task 8.3: Rate Limiting & Financial Denial of Service (ASI-07)**
    - Implement token-bucket rate limiter: 5 queries/hr for guests, 25 queries/hr for authenticated users.
    - Enforce LangGraph recursion limit (max 10 iterations).
- [ ] **Task 8.4: Immutable Security Audit Logging (ASI-10)**
    - Log all tool invocations, parameters, latency, and HITL status to `tool_audit_logs`.
- [ ] **Task 8.5: Automated OWASP Security Test Suite (`tests/security/`)**
    - Write test suites for indirect prompt injection, sandbox escape attempts, and unauthorized MCP calls.

---

## Phase 9: Pre-Seeded RFCs, Deterministic Simulator & Showcase Readiness

- [ ] **Task 9.1: Seed Showcase Architecture RFCs**
    - Bundle `RFC-104-distributed-cache-consistency.md` (Raft vs Multi-Paxos).
    - Bundle `Neon-Serverless-Storage-Architecture.md` (Pageserver and WAL architecture).
- [ ] **Task 9.2: Deterministic Simulator Mode**
    - Implement zero-cost cached execution replay for reviewers without API keys.
    - Toggle in UI allows instant simulation with pre-computed DAG traces and Mermaid diagrams.
- [ ] **Task 9.3: 1-Click Guest Experience Polish**
    - Instant guest token generation (`POST /api/auth/guest`).
    - Pre-load 5 live API quota tokens with countdown timer badge.
- [ ] **Task 9.4: 60-Second Video Walkthrough Script Alignment**
    - Validate demo flow: 1-Click Guest -> Scenario 1 -> Live DAG -> Mermaid SVG -> MCP Inspector.
