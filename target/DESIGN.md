---
version: alpha
name: NexusAgent-Archon-Design-System
description: A high-contrast, cyber-engineering systems intelligence interface anchored on deep obsidian canvas (#090D16), glassmorphic midnight slate panels (#111827), cyber cyan (#06B6D4) and electric emerald (#10B981) signature accents. Engineered for Next.js 16 + shadcn/ui + Tailwind CSS v4, sub-second real-time streaming observability, WCAG 2.1 AA accessibility, dynamic Mermaid.js SVG architecture rendering, and interactive citation inspection.

colors:
    primary: "#06b6d4"
    primary-active: "#0891b2"
    primary-subtle: "rgba(6, 182, 212, 0.12)"
    primary-border: "rgba(6, 182, 212, 0.35)"
    accent: "#10b981"
    accent-active: "#059669"
    accent-glow: "rgba(16, 185, 129, 0.25)"
    ink: "#f8fafc"
    ink-secondary: "#94a3b8"
    body: "#cbd5e1"
    muted: "#64748b"
    hairline: "rgba(255, 255, 255, 0.08)"
    border-strong: "rgba(255, 255, 255, 0.16)"
    canvas: "#090d16"
    canvas-subtle: "#0b0f19"
    surface-soft: "#0f172a"
    surface-card: "#111827"
    surface-card-elevated: "#1a2234"
    surface-glass: "rgba(17, 24, 39, 0.75)"
    surface-glass-border: "rgba(255, 255, 255, 0.08)"
    on-primary: "#090d16"
    on-accent: "#ffffff"
    on-dark: "#f8fafc"
    status-valid: "#10b981"
    status-valid-bg: "rgba(16, 185, 129, 0.12)"
    status-valid-border: "rgba(16, 185, 129, 0.30)"
    status-warning: "#f59e0b"
    status-warning-bg: "rgba(245, 158, 11, 0.12)"
    status-warning-border: "rgba(245, 158, 11, 0.30)"
    status-danger: "#f43f5e"
    status-danger-bg: "rgba(244, 63, 94, 0.12)"
    status-danger-border: "rgba(244, 63, 94, 0.30)"
    status-info: "#38bdf8"
    status-info-bg: "rgba(56, 189, 248, 0.12)"
    status-info-border: "rgba(56, 189, 248, 0.30)"
    citation-pill: "#1e293b"
    citation-pill-border: "#334155"
    citation-pill-hover: "#06b6d4"

shadows:
    sm: "0 1px 2px rgba(0, 0, 0, 0.4)"
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.5)"
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.6), 0 4px 6px -4px rgba(0, 0, 0, 0.6)"
    glow-cyan: "0 0 20px rgba(6, 182, 212, 0.25)"
    glow-emerald: "0 0 20px rgba(16, 185, 129, 0.25)"
    drawer: "-10px 0 25px -5px rgba(0, 0, 0, 0.65)"

typography:
    display-xl:
        fontFamily: "Outfit, system-ui, sans-serif"
        fontSize: 32px
        fontWeight: 700
        lineHeight: 1.15
        letterSpacing: -0.5px
    display-lg:
        fontFamily: "Outfit, system-ui, sans-serif"
        fontSize: 24px
        fontWeight: 700
        lineHeight: 1.2
        letterSpacing: -0.3px
    title-md:
        fontFamily: "Inter, system-ui, sans-serif"
        fontSize: 16px
        fontWeight: 600
        lineHeight: 1.35
        letterSpacing: -0.1px
    title-sm:
        fontFamily: "Inter, system-ui, sans-serif"
        fontSize: 14px
        fontWeight: 600
        lineHeight: 1.4
        letterSpacing: 0
    body-md:
        fontFamily: "Inter, system-ui, sans-serif"
        fontSize: 14px
        fontWeight: 400
        lineHeight: 1.5
        letterSpacing: 0
    body-sm:
        fontFamily: "Inter, system-ui, sans-serif"
        fontSize: 12px
        fontWeight: 400
        lineHeight: 1.45
        letterSpacing: 0
    code:
        fontFamily: "JetBrains Mono, monospace"
        fontSize: 13px
        fontWeight: 500
        lineHeight: 1.5
        letterSpacing: -0.2px
---

# NexusAgent (Codename: Archon) — UI/UX Design System Specification

## 1. Design Philosophy & Core Tenets

NexusAgent is built for Staff-Plus Systems Engineers, VP of Engineering, and CTOs who evaluate mission-critical distributed architectures. The visual identity conveys **cryptographic precision, high-velocity intelligence, and deep observability**.

- **Dark-Canvas Obsidian Core**: Deep black `#090D16` and `#0B0F19` foundations minimize eye fatigue during extended technical reviews and code audits.
- **Glassmorphic Tactile Panels**: Cards and drawers utilize `backdrop-blur-md` and semi-transparent surfaces (`rgba(17, 24, 39, 0.75)`) with crisp `0.5px` borders (`rgba(255, 255, 255, 0.08)`).
- **Dual-Coded Cyber Accents**: Cyber Cyan (`#06B6D4`) denotes active planning and streaming tokens; Electric Emerald (`#10B981`) denotes verified consensus invariants and passing reflection checks.
- **Sub-Second Observability**: Every agent decision node, LlamaIndex chunk retrieval, and MCP tool call is reflected dynamically in real time without page reloads.

---

## 2. Component Integration: Next.js 16 + shadcn/ui + Tailwind v4

NexusAgent integrates **shadcn/ui** primitives powered by **Tailwind CSS v4** native CSS variables and `@theme` directives:

### 2.1 Tailwind CSS v4 Configuration (`apps/frontend/styles/globals.css`)

```css
@import "tailwindcss";

@theme {
    --color-background: #090d16;
    --color-foreground: #f8fafc;
    --color-card: #111827;
    --color-card-foreground: #f8fafc;
    --color-popover: #0f172a;
    --color-popover-foreground: #f8fafc;
    --color-primary: #06b6d4;
    --color-primary-foreground: #090d16;
    --color-secondary: #1e293b;
    --color-secondary-foreground: #f8fafc;
    --color-muted: #1e293b;
    --color-muted-foreground: #94a3b8;
    --color-accent: #10b981;
    --color-accent-foreground: #ffffff;
    --color-destructive: #f43f5e;
    --color-destructive-foreground: #ffffff;
    --color-border: rgba(255, 255, 255, 0.08);
    --color-input: rgba(255, 255, 255, 0.12);
    --color-ring: #06b6d4;
    --font-sans: "Inter", system-ui, -apple-system, sans-serif;
    --font-heading: "Outfit", system-ui, -apple-system, sans-serif;
    --font-mono: "JetBrains Mono", monospace;
}
```

---

## 3. Four-Zone Command Center Layout

````
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ HEADER: [NexusAgent Archon Branding]               │ Quota: [████░] 4/5 Tokens │ [Google Sign-In] │ [BYOK]    │
├──────────────────────────┬────────────────────────────────────────────────────┬───────────────────────────────┤
│ LEFT PANEL               │ CENTER PANEL                                       │ RIGHT PANEL                   │
│ (Data and Tools Panel)   │ (Active Chat Interface)                            │ (Live Agent Inspector)        │
│                          │                                                    │                               │
│ 📁 Files Uploaded        │ Active Document: RFC-104-distributed-cache.md       │ 🧭 Current Node               │
│  - RFC-104-cache.md      │                                                    │  [ planner ] -> [ RETRIEVER ] │
│  - Neon-storage.md       │ 🤖 NexusAgent (Streaming...)                       │  Status: RUNNING (Node 2/5)   │
│  + Drag-and-Drop Upload  │ Based on Section 4.2 of [RFC-104:L128], Raft...    │                               │
│                          │                                                    │ 📊 Token Usage                │
│ 🔌 Active MCP Servers    │ ```mermaid                                         │  - Prompt: 1,420 tokens       │
│  - local:8000/api/mcp/sse│ graph LR                                           │  - Completion: 384 tokens     │
│  - claude-desktop (Link) │    Leader --> FollowerA                            │  - Cached: 890 tokens (90% off│
│                          │    Leader --> FollowerB                            │  - Est. Cost: $0.00018        │
│ 🎛️ Live Tool Switches   │ ```                                                │                               │
│  [x] Hybrid RAG Search   │                                                    │ 📜 State Log Viewer           │
│  [x] AST Python Sandbox  │ ┌────────────────────────────────────────────────┐ │  - 22:14:01 [Planner] Sub-goal│
│  [x] SQL Schema Audit    │ │ User Input: Ask architectural question... [Send│ │  - 22:14:02 [RAG] Top 4 chunks│
│  [ ] Web Search (Ext)    │ └────────────────────────────────────────────────┘ │  - 22:14:03 [AST] Math valid  │
└──────────────────────────┴────────────────────────────────────────────────────┴───────────────────────────────┘
````

### 3.1 Header (Branding & Sign-In) (`components/header/`)

- **Branding**: Hexagonal Archon icon with gradient title (`NexusAgent Archon: Autonomous Systems Analyst`).
- **User Sign-In & Auth**: Supabase Auth Google Sign-in button with user avatar display, plus "1-Click Guest Pass" toggle.
- **Quota Token Meter**: Visual 5-segment token bucket pill displaying remaining live queries (`4/5 remaining`) and hourly reset timer.
- **BYOK & Simulator Toggles**: "Bring Your Own Key" (BYOK) modal launcher and 1-click Deterministic Simulator toggle (100% free mode).

### 3.2 Left Panel: Data and Tools Panel (`components/workspace/`)

- **Files Uploaded (Document Vault)**:
    - List of ingested architecture whitepapers, RFCs, and API contracts.
    - Per-document chunk count, SHA-256 integrity hash, and LlamaIndex parsing status badges.
    - Drag-and-drop file upload zone supporting `.md`, `.pdf`, `.txt`, `.json`.
- **Active MCP Servers**:
    - Live indicator of registered Model Context Protocol endpoints (e.g. `http://localhost:8000/api/mcp/sse`).
    - Connection status pill for external clients (Claude Desktop, Cursor, Antigravity).
- **Live Tool Switches**:
    - Tactile toggle switches (using shadcn/ui `Switch`) allowing operators to enable or disable individual tools in real time:
        - `Hybrid RAG Search` (Supabase pgvector + tsvector BM25)
        - `AST Python Sandbox` (Isolated mathematical latency verifier)
        - `SQL Schema Audit` (Postgres schema and index efficiency analyzer)
        - `Web Search (Ext)` (Tavily / Perplexity fallback tool)
        - `Mermaid Dynamic SVG` (Architecture diagram synthesis)

### 3.3 Center Panel: Active Chat Interface (`components/canvas/`)

- **AI Agent Stream Thread**:
    - Real-time token streaming with sub-600ms TTFT via Server-Sent Events (SSE).
    - Shiki syntax-highlighted code blocks with copy-to-clipboard.
    - **Dynamic Mermaid.js SVG Diagrams**: Interactive architecture diagrams with hardware-accelerated zoom, pan, and SVG export.
    - **Interactive Citation Pills**: Clickable badges (`[RFC-104:L128-145]`) displaying snippet previews on hover and jumping to exact document line ranges on click.
    - **Human-in-the-Loop (HITL) Action Banner**: Amber modal card (`components/hitl/HitlModal.tsx`) appearing when a high-impact tool execution requires human approval.
- **User Inputs Console**:
    - Multi-line textarea with auto-grow, keyboard shortcuts (`Ctrl+Enter` / `Cmd+Enter`), model selector (Gemini 2.5 Flash / Claude 3.7 / GPT-4o), and quick 1-click showcase scenario buttons.

### 3.4 Right Panel: Live Agent Inspector (`components/observability/`)

- **Current Node**:
    - Visual indicator of active LangGraph node (`planner` -> `retriever` -> `mcp_tools` -> `python_sandbox` -> `reflection` -> `synthesizer`).
    - Animated pulsing cyan glow indicating execution in flight, transitioning to emerald upon node completion.
- **Token Usage & Cost Tracker**:
    - Real-time counters tracking Prompt Tokens, Completion Tokens, and Cached Tokens (leveraging prompt caching discounts).
    - Live query cost estimator ($0.000XX) providing total financial transparency.
- **State Log Viewer**:
    - Chronological execution timeline logging each step transition, timestamp, and duration in milliseconds.
    - Expandable payloads inspecting intermediate tool input arguments, raw outputs, and the reflection critic's confidence score ($0.00 - 1.00$).
    - Raw JSON-RPC wire protocol viewer for inspecting MCP request/response payloads (`components/observability/McpInspector.tsx`).

---

## 4. Typography & Visual Hierarchy

- **Headings (`Outfit`)**: Modern geometric sans-serif for command center headers, card titles, and modal headers.
- **Body & Controls (`Inter`)**: High-legibility neutral sans-serif optimized for small-text readability in dense technical documentation.
- **Code & Payloads (`JetBrains Mono`)**: Fixed-width font with clear ligatures for Python scripts, JSON schemas, and citations.

---

## 5. Micro-Animations & Tactile States

- **Glow Pulse on Active Nodes**: Active LangGraph nodes pulse with a subtle cyan glow (`animation: pulse 2s infinite`).
- **Stream Ingestion Smooth Scroll**: The conversation container maintains automatic anchor scrolling as new tokens arrive.
- **Citation Pill Hover Micro-Lift**: `transform: translateY(-1px)` with smooth cubic-bezier transition (`0.2s ease-out`).
- **Zero-Friction Modal Transitions**: Radix UI Dialog transitions with `scale-95 to scale-100` and `opacity-0 to opacity-100` in 150ms.

---

## 6. Accessibility & Responsive Breakpoints

- **WCAG 2.1 AA Compliance**: All text elements maintain a minimum contrast ratio of `4.5:1` against their respective card surfaces.
- **Dual-Coded Status**: Success, warning, and error states pair distinct colors with dedicated Lucide icons (`CheckCircle`, `AlertTriangle`, `XCircle`) to ensure colorblind accessibility.
- **Responsive Breakpoints**:
    - `Desktop (>= 1280px)`: Full 4-zone command center layout (Header + Left Workspace + Center Canvas + Right Observability).
    - `Tablet (768px - 1279px)`: Left workspace collapses into an icon dock; Right observability drawer toggles via slide-over sheet.
    - `Mobile (375px - 767px)`: Center canvas takes priority; left vault and right DAG accessible via bottom navigation tabs.
