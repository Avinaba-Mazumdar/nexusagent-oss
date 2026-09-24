import logging

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field

from app.core.auth import get_current_user
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
    current_user: User = Depends(get_current_user),
    sandbox: PythonSandbox = Depends(lambda: default_python_sandbox),
):
    """
    Execute Python code in AST static analysis guarded subprocess sandbox.
    Rejects unsafe modules (os, sys, subprocess), dunder escapes, and builtins (eval, exec).
    Enforces a strict wall-clock timeout ceiling.
    """
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
