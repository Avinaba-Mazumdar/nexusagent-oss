import pytest
from httpx import ASGITransport, AsyncClient

from app.core.sandbox import (
    PythonSandbox,
    validate_python_code,
)
from app.main import app


def test_ast_validator_safe_code():
    """Verify that legitimate algorithmic math and data transformation scripts pass AST check."""
    safe_scripts = [
        """
import math
import json
import collections

data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
mean_val = sum(data) / len(data)
variance = sum((x - mean_val) ** 2 for x in data) / len(data)
std_dev = math.sqrt(variance)

counts = collections.Counter(["read", "write", "read", "read"])
print(json.dumps({"mean": mean_val, "std_dev": round(std_dev, 2), "counts": dict(counts)}))
""",
        """
import itertools

permutations = list(itertools.permutations([1, 2, 3], 2))
print(f"Permutations: {len(permutations)}")
""",
    ]

    for script in safe_scripts:
        is_valid, violations = validate_python_code(script)
        assert is_valid is True
        assert len(violations) == 0


def test_ast_validator_blocks_malicious_imports():
    """Verify that disallowed modules are immediately blocked by AST static analysis."""
    malicious_imports = [
        "import os\nos.system('whoami')",
        "import sys\nsys.exit(0)",
        "import subprocess\nsubprocess.run(['dir'])",
        "import socket\ns = socket.socket()",
        "import urllib.request",
        "import requests",
        "import httpx",
        "from os import system\nsystem('calc')",
        "from subprocess import Popen",
    ]

    for script in malicious_imports:
        is_valid, violations = validate_python_code(script)
        assert is_valid is False
        assert len(violations) >= 1
        assert any("Disallowed module import" in v for v in violations)


def test_ast_validator_blocks_dangerous_builtins_and_dunders():
    """Verify that eval, exec, open, __import__, and dunder escape vectors are blocked."""
    dangerous_scripts = [
        "eval('2 + 2')",
        "exec('print(123)')",
        "open('/etc/passwd', 'r')",
        "__import__('os').system('ls')",
        "x = globals()",
        "y = locals()",
        "().__class__.__bases__[0].__subclasses__()",
        "x = [].__class__",
        "f = (lambda: None).__code__",
    ]

    for script in dangerous_scripts:
        is_valid, violations = validate_python_code(script)
        assert is_valid is False
        assert len(violations) >= 1


@pytest.mark.asyncio
async def test_sandbox_execution_success():
    """Verify that safe Python code executes and captures stdout accurately."""
    sandbox = PythonSandbox(default_timeout=5.0)
    code = """
import math
radius = 5.0
area = math.pi * (radius ** 2)
print(f"AREA:{area:.2f}")
"""
    result = await sandbox.execute(code)
    assert result.success is True
    assert result.ast_valid is True
    assert result.exit_code == 0
    assert "AREA:78.54" in result.stdout
    assert len(result.security_violations) == 0


@pytest.mark.asyncio
async def test_sandbox_execution_timeout():
    """Verify that infinite loops are killed when timeout expires."""
    sandbox = PythonSandbox(default_timeout=1.0)
    code = """
import time
while True:
    time.sleep(0.1)
"""
    result = await sandbox.execute(code, timeout_seconds=1.0)
    assert result.success is False
    assert result.exit_code == -1
    assert "timed out" in result.stderr.lower()


@pytest.mark.db
@pytest.mark.asyncio
async def test_sandbox_endpoint_authenticated():
    """Verify POST /api/sandbox/run endpoint with authenticated user."""
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Obtain guest token
        guest_resp = await client.post("/api/auth/guest")
        assert guest_resp.status_code == 200
        token = guest_resp.json()["tokens"]["accessToken"]

        # 1. Safe execution
        safe_resp = await client.post(
            "/api/sandbox/run",
            headers={"Authorization": f"Bearer {token}"},
            json={"code": "print('HELLO_FROM_SANDBOX')", "timeoutSeconds": 3.0},
        )
        assert safe_resp.status_code == 200
        safe_data = safe_resp.json()
        assert safe_data["success"] is True
        assert safe_data["astValid"] is True
        assert "HELLO_FROM_SANDBOX" in safe_data["stdout"]
        assert len(safe_data["securityViolations"]) == 0

        # 2. Malicious injection attempt
        malicious_resp = await client.post(
            "/api/sandbox/run",
            headers={"Authorization": f"Bearer {token}"},
            json={"code": "import os\nos.system('whoami')", "timeoutSeconds": 3.0},
        )
        assert malicious_resp.status_code == 200
        mal_data = malicious_resp.json()
        assert mal_data["success"] is False
        assert mal_data["astValid"] is False
        assert len(mal_data["securityViolations"]) >= 1
        assert "Disallowed module import" in mal_data["securityViolations"][0]
