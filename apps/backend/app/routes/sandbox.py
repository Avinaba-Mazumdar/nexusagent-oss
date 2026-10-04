import logging

from fastapi import APIRouter, Depends, Header, Request, status
from pydantic import BaseModel, Field

from app.core.auth import get_client_ip, get_current_user, validate_byok_key
from app.core.rate_limiter import default_rate_limiter
from app.core.sandbox import PythonSandbox, default_python_sandbox
from app.db.models import User

logger = logging.getLogger("nexusagent.routes.sandbox")

router = APIRouter(prefix="/sandbox", tags=["Python Sandbox Code Execution"])


class SandboxRunRequestWire(BaseModel):
    code: str = Field(
        ...,
        min_length=1,
        max_length=50000,
        description="Python 3 script content to execute in isolated AST-guarded sandbox",
    )
    timeoutSeconds: float = Field(
        5.0,
        ge=0.5,
        le=10.0,
        description="Execution wall-clock timeout limit in seconds (0.5 to 10.0)",
    )


class SandboxRunResponseWire(BaseModel):
    success: bool
    stdout: str
    stderr: str
    exitCode: int
    durationMs: int
    astValid: bool
    securityViolations: list[str] = Field(default_factory=list)


@router.post("/run", response_model=SandboxRunResponseWire, status_code=status.HTTP_200_OK)
async def run_sandbox_code(
    payload: SandboxRunRequestWire,
    request: Request,
    current_user: User = Depends(get_current_user),
    byok_key: str | None = Header(None, alias="X-User-API-Key"),
    sandbox: PythonSandbox = Depends(lambda: default_python_sandbox),
):
    """
    Execute Python code in AST static analysis guarded subprocess sandbox.
    Rejects unsafe modules (os, sys, subprocess), dunder escapes, and builtins (eval, exec).
    Enforces a strict wall-clock timeout ceiling. Metered by token bucket rate limiter.
    """
    client_ip = get_client_ip(request)
    byok_key = validate_byok_key(byok_key)

    await default_rate_limiter.check_and_consume(
        user_id=current_user.id,
        client_ip=client_ip,
        is_guest=current_user.is_guest,
        byok_key=byok_key,
    )
    result = await sandbox.execute(
        code=payload.code,
        timeout_seconds=payload.timeoutSeconds,
    )

    return SandboxRunResponseWire(
        success=result.success,
        stdout=result.stdout,
        stderr=result.stderr,
        exitCode=result.exit_code,
        durationMs=result.duration_ms,
        astValid=result.ast_valid,
        securityViolations=result.security_violations,
    )
