import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.mcp.server import handle_jsonrpc_request


@pytest.mark.asyncio
async def test_mcp_initialize_endpoint():
    """Verify MCP initialize handshake returns protocolVersion 2024-11-05 and capabilities."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            "/api/mcp/v1",
            json={
                "jsonrpc": "2.0",
                "id": "init-1",
                "method": "initialize",
                "params": {"protocolVersion": "2024-11-05"},
            },
        )
        assert res.status_code == 200
        data = res.json()
        assert data["jsonrpc"] == "2.0"
        assert data["id"] == "init-1"
        assert data["result"]["protocolVersion"] == "2024-11-05"
        assert data["result"]["serverInfo"]["name"] == "nexusagent-mcp"
        assert "tools" in data["result"]["capabilities"]


@pytest.mark.asyncio
async def test_mcp_tools_list_endpoint():
    """Verify MCP tools/list returns hybrid_rag_search, python_sandbox, and mcp_sql_audit."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            "/api/mcp/v1",
            json={
                "jsonrpc": "2.0",
                "id": "list-1",
                "method": "tools/list",
            },
        )
        assert res.status_code == 200
        data = res.json()
        tools = data["result"]["tools"]
        tool_names = [t["name"] for t in tools]
        assert "hybrid_rag_search" in tool_names
        assert "python_sandbox" in tool_names
        assert "mcp_sql_audit" in tool_names

        # Verify inputSchema structure
        sandbox_tool = next(t for t in tools if t["name"] == "python_sandbox")
        assert "code" in sandbox_tool["inputSchema"]["properties"]
        assert "code" in sandbox_tool["inputSchema"]["required"]


@pytest.mark.asyncio
async def test_mcp_tool_call_sandbox_safe():
    """Verify MCP tools/call executes safe code inside AST sandbox."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            "/api/mcp/v1",
            json={
                "jsonrpc": "2.0",
                "id": "call-1",
                "method": "tools/call",
                "params": {
                    "name": "python_sandbox",
                    "arguments": {"code": "print(sum([10, 20, 30]))"},
                },
            },
        )
        assert res.status_code == 200
        data = res.json()
        assert data["result"]["isError"] is False
        assert "60" in data["result"]["content"][0]["text"]


@pytest.mark.asyncio
async def test_mcp_tool_call_sandbox_blocked():
    """Verify MCP tools/call blocks dangerous code with AST security error."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            "/api/mcp/v1",
            json={
                "jsonrpc": "2.0",
                "id": "call-2",
                "method": "tools/call",
                "params": {
                    "name": "python_sandbox",
                    "arguments": {"code": "import os; os.system('echo pwned')"},
                },
            },
        )
        assert res.status_code == 200
        data = res.json()
        assert data["result"]["isError"] is True
        assert "AST Security Validation Failed" in data["result"]["content"][0]["text"]


@pytest.mark.asyncio
async def test_mcp_sql_audit_mutation_blocked():
    """Verify mcp_sql_audit blocks destructive mutating queries."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            "/api/mcp/v1",
            json={
                "jsonrpc": "2.0",
                "id": "sql-1",
                "method": "tools/call",
                "params": {
                    "name": "mcp_sql_audit",
                    "arguments": {"query": "DROP TABLE users;"},
                },
            },
        )
        assert res.status_code == 200
        data = res.json()
        assert data["result"]["isError"] is True
        assert "Security Violation" in data["result"]["content"][0]["text"]


@pytest.mark.asyncio
async def test_mcp_resources_list_and_read():
    """Verify MCP resources/list and resources/read."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # List resources
        list_res = await client.post(
            "/api/mcp/v1",
            json={"jsonrpc": "2.0", "id": "res-1", "method": "resources/list"},
        )
        assert list_res.status_code == 200
        res_list = list_res.json()["result"]["resources"]
        assert len(res_list) >= 2
        first_uri = res_list[0]["uri"]

        # Read resource
        read_res = await client.post(
            "/api/mcp/v1",
            json={
                "jsonrpc": "2.0",
                "id": "res-2",
                "method": "resources/read",
                "params": {"uri": first_uri},
            },
        )
        assert read_res.status_code == 200
        contents = read_res.json()["result"]["contents"]
        assert len(contents) > 0
        assert contents[0]["uri"] == first_uri
        assert len(contents[0]["text"]) > 10


@pytest.mark.asyncio
async def test_mcp_sse_handshake_endpoint():
    """Verify GET /api/mcp/sse emits the standard endpoint event."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/mcp/sse?once=true")
        assert res.status_code == 200
        assert "text/event-stream" in res.headers.get("content-type", "")
        assert "event: endpoint" in res.text
        assert "/api/mcp/messages?sessionId=" in res.text


@pytest.mark.asyncio
async def test_stdio_jsonrpc_dispatcher():
    """Verify stdio JSON-RPC handler processes requests and errors correctly."""
    # Ping
    ping_res = await handle_jsonrpc_request({"jsonrpc": "2.0", "id": 1, "method": "ping"})
    assert ping_res["result"] == {}

    # Method not found
    bad_res = await handle_jsonrpc_request({"jsonrpc": "2.0", "id": 2, "method": "unknown/method"})
    assert bad_res["error"]["code"] == -32601
