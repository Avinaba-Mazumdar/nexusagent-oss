# NexusAgent (Codename: Archon)

> **Autonomous Technical Research & Systems Design Intelligence Engine**

NexusAgent is an enterprise-grade autonomous systems analyst that evaluates distributed systems RFCs, cross-references infrastructure whitepapers, verifies latency models in an AST Python sandbox, self-reflects on consensus trade-offs, and synthesizes structured verdicts with dynamic Mermaid architecture diagrams.

---

## ⚡ Key Capabilities

- **Autonomous Agent DAG**: Multi-step Plan-and-Execute workflow with a self-reflection critic loop powered by **LangGraph**.
- **Modern 4-Zone UI**: High-contrast command center built with **Next.js 16**, **React 19**, **shadcn/ui**, and **Tailwind CSS v4** (Header, Left Data & Tools Panel, Center Active Chat, Right Live Inspector).
- **Hybrid RAG Pipeline**: Combines dense vector search with sparse keyword search (**Supabase `pgvector`** + **`tsvector` BM25**) fused via Reciprocal Rank Fusion (RRF), powered by **LlamaIndex** hierarchical parsing.
- **Model Context Protocol (MCP v2)**: Compliant JSON-RPC 2.0 server (`/api/mcp/v1`) and client for seamless interoperability with Claude Desktop, Cursor, and Antigravity.
- **OWASP Top 10 for Agentic AI**: Hardened perimeter with prompt injection delimiters, AST Python execution sandbox, canary token tracking, Human-in-the-Loop (HITL) gates, and immutable audit logs.
- **100% Free-Tier & Zero-Cost Mode**: 1-Click Guest Pass with token-bucket rate limiting, local SQLite/NumPy fallbacks, and a pre-cached Deterministic Simulator ($0 API cost).

---

## 🧱 Monorepo Architecture

```
nexusagent-oss/
├── apps/
│   ├── frontend/         # Next.js 16 + shadcn/ui + Tailwind v4 + Zustand + Mermaid.js
│   └── backend/          # FastAPI + LangGraph + LlamaIndex + Supabase + MCP v2
├── packages/
│   └── contracts/        # Shared TypeScript interfaces & JSON-RPC 2.0 schemas
├── target/
│   ├── ARCHITECTURE.md   # System topology, Supabase DDL, pgvector HNSW, OWASP specs
│   ├── DESIGN.md         # 4-zone UI layout, cyber obsidian tokens, component guide
│   ├── AGENTs.md         # AI Agent context, system master, coding invariants
│   └── TODOs.md          # Active MVP0 phased task board
└── data/
    └── seeded_documents/ # Pre-seeded RFCs (Raft vs Multi-Paxos, Neon Storage)
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: `v24.x LTS`
- **pnpm**: `^10.x`
- **Python**: `3.14.x` with `uv` package manager

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-org/nexusagent-oss.git
cd nexusagent-oss

# Install frontend dependencies
pnpm install

# Install backend dependencies
cd apps/backend && uv sync && cd ../..
```

### 2. Configure Environment (Optional)

Copy `.env.example` to `.env`. If third-party API keys are not provided, NexusAgent runs in **Deterministic Simulation Mode** with local in-memory fallbacks automatically!

### 3. Run Development Servers

```bash
pnpm dev
```

- **Frontend Command Center**: `http://localhost:3000`
- **Backend API & MCP Server**: `http://localhost:8000`
- **Interactive API Docs**: `http://localhost:8000/docs`

---

## 📚 Master Documentation Index

- 📐 **[System Architecture](target/ARCHITECTURE.md)**: Deep technical spec, topology, database DDL, and OWASP security matrix.
- 🎨 **[UI/UX Design System](target/DESIGN.md)**: 4-zone command center specifications, theme tokens, and component guidelines.
- 🤖 **[AI Agent Context & Rules](target/AGENTs.md)**: Architectural invariants, definition of done, and verification gates.
- 📋 **[Active Task Board](target/TODOs.md)**: Phased implementation roadmap and progress tracking.

---

## 📄 License

MIT License. Designed and engineered for high-impact technical analysis.
