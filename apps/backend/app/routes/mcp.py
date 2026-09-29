"""
Model Context Protocol (MCP) server integration using FastMCP.
"""

from fastmcp import FastMCP
from app.rag.hybrid_search import default_hybrid_search_engine
from app.core.sandbox import default_python_sandbox

mcp = FastMCP("NexusAgent")

@mcp.tool()
async def hybrid_rag_search(query: str, limit: int = 5) -> str:
    """Searches the architecture knowledge base."""
    chunks = await default_hybrid_search_engine.search(
        query=query, limit=limit, dense_weight=0.6, sparse_weight=0.4, rrf_k=60
    )
    return "\n".join(f"[{c.filename}]: {c.content}" for c in chunks)

@mcp.tool()
async def python_sandbox(code: str) -> str:
    """Executes python code in an AST-validated sandbox environment."""
    result = await default_python_sandbox.execute(code)
    if result.success:
        return result.stdout
    return f"Error: {result.stderr}"

mcp_app = mcp.http_app()
