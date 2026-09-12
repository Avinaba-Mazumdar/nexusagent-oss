# NexusAgent — Phased Implementation Board

> **Definition of Done (DoD) Quality Gate:**
> No task or phase may be checked `[x]` until:
>
> 1. **Tested**: Automated tests pass (`pnpm test` / `uv run pytest`)
> 2. **Linted**: Zero linter errors or warnings (`pnpm lint` / `uv run ruff check`)
> 3. **Formatted**: Code formatted cleanly (`pnpm format:check` / `uv run ruff format --check`)
> 4. **Verified**: End-to-end functionality visually or functionally verified on running servers

---

### Phase 1: Scaffold Project [Completed]

- [x] Setup pnpm and Turborepo monorepo configuration
- [x] Init Next.js 16 App Router frontend (`apps/frontend`)
- [x] Init Python 3.14 FastAPI backend (`apps/backend`)
- [x] Setup Neon PostgreSQL connection and environment
      Verification: Run local dev servers (`pnpm dev:fe`, `pnpm dev:be`), verify health endpoint and DB connection.

### Phase 2: Base UI & Database Schemas [Completed]

- [x] Setup shadcn/ui components and theme tokens
- [x] Setup Neon PostgreSQL schema migrations (UUID, pgvector, core tables)
- [x] Setup frontend and backend API communication routes
- [x] Setup 4-zone command center UI layout
      Verification: Run local servers, inspect Neon tables, verify frontend renders layout and shadcn components without errors.

### Phase 3: User Authentication

- [x] Backend guest pass issuance & Argon2 password hashing (`core/auth.py`)
- [x] Frontend guest sign-in button wiring & session state header
- [ ] Google OAuth client setup & backend token verification flow
- [x] Auth token persistence (cookies/localStorage) & API client interceptor
      Verification: Click "Guest Sign In" in UI -> Header updates with active user session and quota badge; test Google sign-in flow.

### Phase 4: Document Ingestion & Parsing

- [ ] Build document upload endpoint (`POST /api/documents/upload`)
- [ ] Implement LlamaIndex markdown hierarchical parser (`rag/parser.py`)
- [ ] Split content into 800-char chunks with line-level section metadata
- [ ] Persist parsed documents and chunks into Neon `documents` and `document_chunks`
      Verification: Upload sample RFC markdown, verify database contains document record and chunk rows with line metadata.

### Phase 5: Vector Embeddings & Hybrid Search

- [ ] Implement dense embedding generation using pgvector HNSW index
- [ ] Implement full-text BM25 lexical search using Postgres `tsvector` GIN index
- [ ] Implement Reciprocal Rank Fusion (RRF) ranking algorithm (`rag/hybrid_search.py`)
- [ ] Expose search endpoint `POST /api/rag/search`
      Verification: Query RFC text via search endpoint, verify top-K results return ranked chunks with similarity scores and line numbers.

### Phase 6: AST Python Code Execution Sandbox

- [ ] Create AST static analysis validator blocking dangerous nodes and builtins (`core/sandbox.py`)
- [ ] Implement timeout-bounded subprocess execution runner (5.0s timeout)
- [ ] Expose sandbox execution endpoint `POST /api/sandbox/run`
- [ ] Add automated test suite for safe code and malicious injection attempts
      Verification: Run safe math script and verify output; submit script with `import os` and assert AST rejects execution.

### Phase 7: LangGraph Agent DAG Pipeline

- [ ] Define strongly-typed `AgentState` schema (`agent/state.py`)
- [ ] Implement planner, retriever, and synthesizer nodes (`agent/graph.py`)
- [ ] Implement reflection critic node with loop-back condition (capped at 10 iterations)
- [ ] Wire hybrid search and sandbox tools into agent graph
      Verification: Invoke agent via test script, assert graph executes state transitions (plan -> retrieve -> reflect -> synthesize).

### Phase 8: Real-Time SSE Streaming & Observability

- [ ] Implement FastAPI Server-Sent Events endpoint `POST /api/agent/stream`
- [ ] Stream structured events (`plan`, `node_start`, `tool_call`, `tool_result`, `token`, `done`)
- [ ] Build Next.js SSE client hook (`hooks/useAgentStream.ts`)
- [ ] Implement reactive execution DAG tracker in observability panel
      Verification: Trigger streaming query from UI or curl, verify incremental SSE tokens and node status events arrive in real-time.

### Phase 9: Interactive Canvas & Diagram Rendering

- [ ] Implement streaming Markdown renderer with code syntax highlighting
- [ ] Integrate dynamic Mermaid.js SVG rendering with pan and zoom controls
- [ ] Implement interactive Citation Pills with line jump and hover previews
- [ ] Wire agent stream output to canvas viewer
      Verification: Stream response containing Mermaid code block and citations; verify SVG diagram renders and citation click highlights source.

### Phase 10: Model Context Protocol (MCP v2) Integration

- [ ] Implement FastAPI MCP SSE endpoint (`/api/mcp/sse`) and CLI stdio entrypoint
- [ ] Register tools (`hybrid_rag_search`, `python_sandbox`, `mcp_sql_audit`) with Pydantic schemas
- [ ] Build frontend MCP Inspector panel to test tool calls and view JSON-RPC payloads
- [ ] Add client connection configuration for Claude Desktop and Cursor
      Verification: Connect Claude or run MCP Inspector UI, call `hybrid_rag_search`, verify valid JSON-RPC response.

### Phase 11: Human-in-the-Loop & Security Controls

- [ ] Implement HITL approval modal in UI and backend pause/resume endpoint (`/api/agent/approval`)
- [ ] Implement prompt injection delimiters (`<untrusted_document_context>`) and UUID canary tokens
- [ ] Implement token-bucket rate limiter for guest and registered users
- [ ] Add immutable audit logging to `tool_audit_logs` table
      Verification: Trigger tool requiring approval, verify agent suspends until approved; exceed rate limit and verify HTTP 429.

### Phase 12: Deterministic Showcase & 1-Click Guest Experience

- [ ] Bundle pre-seeded RFCs (`RFC-104` Raft vs Multi-Paxos, Neon Storage Architecture)
- [ ] Implement deterministic cached execution simulator for zero-cost demos
- [ ] Polish 1-Click Guest experience with pre-loaded quota badge
- [ ] Run end-to-end demo flow validation
      Verification: Open app in guest mode with zero API keys, run demo scenario, verify instant cached DAG trace and rendered diagram.
