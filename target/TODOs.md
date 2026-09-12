# NexusAgent — Phased Implementation Board

### Phase 1: Scaffold Project [Completed]

1. Setup pnpm and Turborepo monorepo configuration
2. Init Next.js 16 App Router frontend (`apps/frontend`)
3. Init Python 3.14 FastAPI backend (`apps/backend`)
4. Setup Neon PostgreSQL connection and environment
   Verification: Run local dev servers (`pnpm dev:fe`, `pnpm dev:be`), verify health endpoint and DB connection.

### Phase 2: Base UI & Database Schemas [Completed]

1. Setup shadcn/ui components and theme tokens
2. Setup Neon PostgreSQL schema migrations (UUID, pgvector, core tables)
3. Setup frontend and backend API communication routes
4. Setup 4-zone command center UI layout
   Verification: Run local servers, inspect Neon tables, verify frontend renders layout and shadcn components without errors.

### Phase 3: User Authentication [Completed]

1. Setup 1-Click Guest pass token issuance
2. Setup Google auth / email registration with Argon2 password hashing
3. Setup JWT verification and tenant isolation middleware
4. Connect frontend auth state and user session header
   Verification: Run auth tests, issue guest pass via `POST /api/auth/guest`, verify protected `/api/auth/me` resolves.

### Phase 4: Document Ingestion & Parsing

1. Build document upload endpoint (`POST /api/documents/upload`)
2. Implement LlamaIndex markdown hierarchical parser (`rag/parser.py`)
3. Split content into 800-char chunks with line-level section metadata
4. Persist parsed documents and chunks into Neon `documents` and `document_chunks`
   Verification: Upload sample RFC markdown, verify database contains document record and chunk rows with line metadata.

### Phase 5: Vector Embeddings & Hybrid Search

1. Implement dense embedding generation using pgvector HNSW index
2. Implement full-text BM25 lexical search using Postgres `tsvector` GIN index
3. Implement Reciprocal Rank Fusion (RRF) ranking algorithm (`rag/hybrid_search.py`)
4. Expose search endpoint `POST /api/rag/search`
   Verification: Query RFC text via search endpoint, verify top-K results return ranked chunks with similarity scores and line numbers.

### Phase 6: AST Python Code Execution Sandbox

1. Create AST static analysis validator blocking dangerous nodes and builtins (`core/sandbox.py`)
2. Implement timeout-bounded subprocess execution runner (5.0s timeout)
3. Expose sandbox execution endpoint `POST /api/sandbox/run`
4. Add automated test suite for safe code and malicious injection attempts
   Verification: Run safe math script and verify output; submit script with `import os` and assert AST rejects execution.

### Phase 7: LangGraph Agent DAG Pipeline

1. Define strongly-typed `AgentState` schema (`agent/state.py`)
2. Implement planner, retriever, and synthesizer nodes (`agent/graph.py`)
3. Implement reflection critic node with loop-back condition (capped at 10 iterations)
4. Wire hybrid search and sandbox tools into agent graph
   Verification: Invoke agent via test script, assert graph executes state transitions (plan -> retrieve -> reflect -> synthesize).

### Phase 8: Real-Time SSE Streaming & Observability

1. Implement FastAPI Server-Sent Events endpoint `POST /api/agent/stream`
2. Stream structured events (`plan`, `node_start`, `tool_call`, `tool_result`, `token`, `done`)
3. Build Next.js SSE client hook (`hooks/useAgentStream.ts`)
4. Implement reactive execution DAG tracker in observability panel
   Verification: Trigger streaming query from UI or curl, verify incremental SSE tokens and node status events arrive in real-time.

### Phase 9: Interactive Canvas & Diagram Rendering

1. Implement streaming Markdown renderer with code syntax highlighting
2. Integrate dynamic Mermaid.js SVG rendering with pan and zoom controls
3. Implement interactive Citation Pills with line jump and hover previews
4. Wire agent stream output to canvas viewer
   Verification: Stream response containing Mermaid code block and citations; verify SVG diagram renders and citation click highlights source.

### Phase 10: Model Context Protocol (MCP v2) Integration

1. Implement FastAPI MCP SSE endpoint (`/api/mcp/sse`) and CLI stdio entrypoint
2. Register tools (`hybrid_rag_search`, `python_sandbox`, `mcp_sql_audit`) with Pydantic schemas
3. Build frontend MCP Inspector panel to test tool calls and view JSON-RPC payloads
4. Add client connection configuration for Claude Desktop and Cursor
   Verification: Connect Claude or run MCP Inspector UI, call `hybrid_rag_search`, verify valid JSON-RPC response.

### Phase 11: Human-in-the-Loop & Security Controls

1. Implement HITL approval modal in UI and backend pause/resume endpoint (`/api/agent/approval`)
2. Implement prompt injection delimiters (`<untrusted_document_context>`) and UUID canary tokens
3. Implement token-bucket rate limiter for guest and registered users
4. Add immutable audit logging to `tool_audit_logs` table
   Verification: Trigger tool requiring approval, verify agent suspends until approved; exceed rate limit and verify HTTP 429.

### Phase 12: Deterministic Showcase & 1-Click Guest Experience

1. Bundle pre-seeded RFCs (`RFC-104` Raft vs Multi-Paxos, Neon Storage Architecture)
2. Implement deterministic cached execution simulator for zero-cost demos
3. Polish 1-Click Guest experience with pre-loaded quota badge
4. Run end-to-end demo flow validation
   Verification: Open app in guest mode with zero API keys, run demo scenario, verify instant cached DAG trace and rendered diagram.
