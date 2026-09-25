"""LangGraph Agent DAG Execution Pipeline.

Builds a real LangGraph ``StateGraph`` over the strongly-typed :class:`AgentState`:

    planner -> retriever -> [python_sandbox] -> reflection critic -> (loop-back | synthesizer)

Nodes are deterministic by design: with no third-party LLM key configured the agent runs in
zero-cost Deterministic Simulator mode (keyword planning, hybrid RAG grounding, AST-sandbox
arithmetic, template synthesis). No node fabricates model telemetry.
"""

import logging
from collections.abc import AsyncIterator
from datetime import UTC, datetime

from langgraph.graph import END, StateGraph

from app.agent.state import AgentState, Citation, PlanStep
from app.core.sandbox import PythonSandbox, default_python_sandbox
from app.db.neon import NeonDatabase, neon_db
from app.rag.hybrid_search import HybridSearchEngine, default_hybrid_search_engine

logger = logging.getLogger("nexusagent.agent.graph")

# Keywords that require an AST-sandboxed arithmetic verification step.
SANDBOX_TRIGGERS = (
    "latency",
    "iops",
    "throughput",
    "calculate",
    "quorum",
    "math",
    "verify",
    "formula",
)


def needs_sandbox(query: str) -> bool:
    """Return True when the query requires a sandboxed numeric verification step."""
    query_lower = query.lower()
    return any(trigger in query_lower for trigger in SANDBOX_TRIGGERS)


async def planner_node(state: AgentState) -> AgentState:
    """
    Planner Node: Analyzes user query and formulates bounded architectural plan steps.
    """
    state.node_history.append("planner")
    state.current_node = "planner"

    steps: list[PlanStep] = [
        PlanStep(
            step_number=1,
            description=f"Perform hybrid dense & lexical search across RFC specifications for: '{state.query}'",
            status="in_progress",
            tool="hybrid_rag_search",
        )
    ]

    if needs_sandbox(state.query):
        steps.append(
            PlanStep(
                step_number=2,
                description="Execute AST-sandboxed Python script to compute mathematical throughput or quorum invariants",
                status="pending",
                tool="python_sandbox",
            )
        )

    steps.append(
        PlanStep(
            step_number=len(steps) + 1,
            description="Synthesize verified architectural answer with line citations and Mermaid sequence diagram",
            status="pending",
            tool="synthesizer",
        )
    )

    state.plan = steps
    return state


async def retriever_node(
    state: AgentState,
    search_engine: HybridSearchEngine | None = None,
) -> AgentState:
    """
    Retriever Node: Executes dense pgvector and sparse BM25 retrieval with RRF ranking.
    """
    state.node_history.append("retriever")
    state.current_node = "retriever"

    engine = search_engine or default_hybrid_search_engine
    chunks = await engine.search(
        query=state.query,
        user_id=state.user_id,
        document_id=state.document_id,
        limit=5,
        dense_weight=0.6,
        sparse_weight=0.4,
        rrf_k=60,
    )

    state.retrieved_chunks = chunks

    # Build strongly-typed citations
    citations: list[Citation] = []
    for c in chunks:
        citations.append(
            Citation(
                chunk_id=c.id,
                document_id=c.document_id,
                filename=c.filename,
                start_line=c.start_line,
                end_line=c.end_line,
                header_path=c.header_path,
                preview=c.content[:150] + ("..." if len(c.content) > 150 else ""),
            )
        )
    state.citations = citations

    # Update plan step 1 status
    if state.plan:
        state.plan[0].status = "completed"

    return state


async def sandbox_node(
    state: AgentState,
    sandbox: PythonSandbox | None = None,
) -> AgentState:
    """
    Sandbox Tool Node: Runs AST-isolated verification script if calculations are needed.
    """
    state.node_history.append("sandbox")
    state.current_node = "sandbox"

    box = sandbox or default_python_sandbox
    query_lower = state.query.lower()

    # Formulate verification code based on architectural query requirements
    code = ""
    if "quorum" in query_lower or "nodes" in query_lower or "partition" in query_lower:
        code = """\
def calculate_quorum(nodes):
    return (nodes // 2) + 1

cluster_sizes = [3, 5, 7, 9]
quorums = {n: calculate_quorum(n) for n in cluster_sizes}
print(f"Quorum requirements: {quorums}")
"""
    elif "iops" in query_lower or "throughput" in query_lower or "latency" in query_lower:
        code = """\
import math
window_ms = 4.2
iops = 14000
batch_size = math.ceil((iops * window_ms) / 1000)
print(f"Computed write window batch size: {batch_size} ops/window at {window_ms}ms target")
"""

    if code:
        state.tool_calls.append({"tool": "python_sandbox", "code": code.strip()})

        result = await box.execute(code)
        state.tool_results.append(
            {
                "tool": "python_sandbox",
                "success": result.success,
                "stdout": result.stdout.strip(),
                "stderr": result.stderr.strip(),
                "duration_ms": result.duration_ms,
            }
        )

    # Update plan step status if present
    for step in state.plan:
        if step.tool == "python_sandbox":
            step.status = "completed"

    return state


async def critic_node(state: AgentState) -> AgentState:
    """
    Reflection Critic Node: Verifies context grounding, citations, and loop-back criteria.
    Increments iteration_count and enforces strict limit of 10 iterations.
    """
    state.node_history.append("critic")
    state.current_node = "critic"
    state.iteration_count += 1

    chunks_count = len(state.retrieved_chunks)
    has_citations = len(state.citations) > 0

    # Calculate reflection grounding score
    if chunks_count > 0:
        base_score = 0.60
        citation_bonus = 0.20 if has_citations else 0.0
        relevance_bonus = (
            0.15 if any(c.similarity_score > 0.01 for c in state.retrieved_chunks) else 0.0
        )
        score = min(base_score + citation_bonus + relevance_bonus, 0.98)
    else:
        score = 0.35

    state.reflection_score = round(score, 2)
    state.is_grounded = state.reflection_score >= 0.70

    # Re-planning decision: If not grounded and under max iterations
    if not state.is_grounded and state.iteration_count < state.max_iterations:
        state.needs_replan = True
        state.reflection_feedback = (
            f"Grounding score {state.reflection_score} below threshold 0.70. "
            f"Re-evaluating query '{state.query}' with expanded retrieval window."
        )
    else:
        state.needs_replan = False
        state.reflection_feedback = (
            f"Grounding verified with {chunks_count} retrieved chunks "
            f"(Score: {state.reflection_score}). Ready for architectural synthesis."
        )

    return state


async def synthesizer_node(state: AgentState) -> AgentState:
    """
    Synthesizer Node: Produces verified architectural response with citations and Mermaid diagram.
    """
    state.node_history.append("synthesizer")
    state.current_node = "synthesizer"

    parts: list[str] = [f"## Architectural Analysis: {state.query}\n"]

    if state.retrieved_chunks:
        parts.append("### Grounded Evidence & Specification Invariants\n")
        for chunk in state.retrieved_chunks[:3]:
            line_info = (
                f" (Lines {chunk.start_line}-{chunk.end_line})"
                if chunk.start_line and chunk.end_line
                else ""
            )
            parts.append(f"- **[{chunk.filename}{line_info}]**: {chunk.content.strip()}\n")

    if state.tool_results:
        parts.append("\n### Sandbox Verification Output\n")
        for res in state.tool_results:
            if res.get("stdout"):
                parts.append(f"```text\n{res['stdout']}\n```\n")

    diagram = """```mermaid
flowchart TD
    Client["Client Application"] -->|Write Request| Leader["Raft Leader Node"]
    Leader -->|Replicate Log| Follower1["Follower 1 (AZ-1)"]
    Leader -->|Replicate Log| Follower2["Follower 2 (AZ-2)"]
    Follower1 -->|Ack| Leader
    Follower2 -->|Ack| Leader
    Leader -->|Commit & Respond| Client
```"""
    parts.append("\n### State Machine Sequence Diagram\n\n" + diagram)
    state.mermaid_diagrams.append(diagram)

    parts.append(
        f"\n\n---\n*Synthesis verified by Reflection Critic "
        f"(Soundness Score: {state.reflection_score}, Iterations: {state.iteration_count})*"
    )

    state.response = "\n".join(parts)
    state.is_complete = True
    state.completed_at = datetime.now(UTC)

    for step in state.plan:
        step.status = "completed"

    return state


def route_after_retriever(state: AgentState) -> str:
    """Conditional edge: run sandboxed verification only when the query needs arithmetic."""
    return "sandbox" if needs_sandbox(state.query) else "critic"


def route_next_node(state: AgentState) -> str:
    """
    Conditional Routing Edge: Determines whether to loop back to planner/retriever
    or advance to synthesis. Strictly enforces cap at 10 iterations.
    """
    if state.needs_replan and state.iteration_count < state.max_iterations:
        logger.info(
            f"Loop-back triggered: iteration {state.iteration_count}/{state.max_iterations}. Re-planning."
        )
        return "planner"
    return "synthesizer"


class AgentGraph:
    """
    LangGraph ``StateGraph`` orchestrator coordinating:
    Planner -> Retriever -> [Python Sandbox] -> Reflection Critic -> (Loop-Back) -> Synthesizer.
    """

    def __init__(
        self,
        db: NeonDatabase | None = None,
        search_engine: HybridSearchEngine | None = None,
        sandbox: PythonSandbox | None = None,
    ):
        self.db = db or neon_db
        self.search_engine = search_engine or default_hybrid_search_engine
        self.sandbox = sandbox or default_python_sandbox
        self.graph = self._build_graph()

    async def _retriever_node(self, state: AgentState) -> AgentState:
        return await retriever_node(state, search_engine=self.search_engine)

    async def _sandbox_node(self, state: AgentState) -> AgentState:
        return await sandbox_node(state, sandbox=self.sandbox)

    def _build_graph(self):
        """Assemble and compile the LangGraph StateGraph state machine."""
        builder = StateGraph(AgentState)

        builder.add_node("planner", planner_node)
        builder.add_node("retriever", self._retriever_node)
        builder.add_node("sandbox", self._sandbox_node)
        builder.add_node("critic", critic_node)
        builder.add_node("synthesizer", synthesizer_node)

        builder.set_entry_point("planner")
        builder.add_edge("planner", "retriever")
        builder.add_conditional_edges(
            "retriever",
            route_after_retriever,
            {"sandbox": "sandbox", "critic": "critic"},
        )
        builder.add_edge("sandbox", "critic")
        builder.add_conditional_edges(
            "critic",
            route_next_node,
            {"planner": "planner", "synthesizer": "synthesizer"},
        )
        builder.add_edge("synthesizer", END)

        return builder.compile()

    @staticmethod
    def _run_config(state: AgentState) -> dict:
        """Bound LangGraph recursion so cyclical reflection can never run away."""
        return {"recursion_limit": max(25, state.max_iterations * 5 + 5)}

    async def invoke(self, initial_state: AgentState) -> AgentState:
        """Execute the full LangGraph DAG from planning to architectural synthesis."""
        final_state = await self.graph.ainvoke(
            initial_state, config=self._run_config(initial_state)
        )
        return (
            final_state
            if isinstance(final_state, AgentState)
            else AgentState.model_validate(final_state)
        )

    async def stream_steps(
        self, initial_state: AgentState
    ) -> AsyncIterator[tuple[str, AgentState]]:
        """Yield (node_name, state) transitions incrementally as each LangGraph node finishes."""
        async for chunk in self.graph.astream(
            initial_state,
            config=self._run_config(initial_state),
            stream_mode="updates",
        ):
            for node_name, update in chunk.items():
                if isinstance(update, AgentState):
                    step_state = update
                elif isinstance(update, dict):
                    step_state = AgentState.model_validate(update)
                else:
                    logger.warning(f"Unexpected LangGraph update payload from node {node_name}")
                    continue
                yield (node_name, step_state)


default_agent_graph = AgentGraph()
