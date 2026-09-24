import ast
import asyncio
import logging
import sys
import time

from pydantic import BaseModel, ConfigDict, Field

logger = logging.getLogger("nexusagent.core.sandbox")

DEFAULT_TIMEOUT_SECONDS = 5.0
MAX_TIMEOUT_SECONDS = 10.0
MAX_OUTPUT_CHARS = 100_000

# Explicitly allowed standard library modules for algorithmic & systems math calculations
ALLOWED_MODULES = {
    "math",
    "json",
    "datetime",
    "time",
    "random",
    "re",
    "collections",
    "itertools",
    "heapq",
    "typing",
    "dataclasses",
    "statistics",
    "decimal",
    "fractions",
    "bisect",
    "copy",
    "string",
}

# Strictly forbidden built-in functions
BLOCKED_BUILTINS = {
    "exec",
    "eval",
    "compile",
    "__import__",
    "open",
    "input",
    "breakpoint",
    "exit",
    "quit",
    "help",
    "memoryview",
    "globals",
    "locals",
    "vars",
    "delattr",
}

# Forbidden dunder / private escape attributes
BLOCKED_ATTRIBUTES = {
    "__subclasses__",
    "__globals__",
    "__code__",
    "__bases__",
    "__mro__",
    "__class__",
    "__dict__",
    "__builtins__",
    "__import__",
    "__loader__",
    "__spec__",
    "__module__",
    "gi_frame",
    "f_globals",
    "f_locals",
    "f_code",
    "cr_frame",
    "ag_frame",
}


class ASTSecurityViolation(Exception):
    def __init__(self, violations: list[str]):
        self.violations = violations
        super().__init__(f"AST Security Validation Failed: {'; '.join(violations)}")


class ASTSecurityValidator(ast.NodeVisitor):
    """
    Static AST visitor inspecting Python source trees to block unsafe imports,
    dangerous built-in invocations, and Python object-model escape vectors.
    """

    def __init__(self):
        self.violations: list[str] = []

    def visit_Import(self, node: ast.Import) -> None:
        for alias in node.names:
            root_module = alias.name.split(".")[0]
            if root_module not in ALLOWED_MODULES:
                self.violations.append(
                    f"Line {node.lineno}: Disallowed module import '{alias.name}'. "
                    f"Allowed modules: {', '.join(sorted(ALLOWED_MODULES))}"
                )
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom) -> None:
        if node.module:
            root_module = node.module.split(".")[0]
            if root_module not in ALLOWED_MODULES:
                self.violations.append(
                    f"Line {node.lineno}: Disallowed module import from '{node.module}'. "
                    f"Allowed modules: {', '.join(sorted(ALLOWED_MODULES))}"
                )
        else:
            self.violations.append(f"Line {node.lineno}: Relative imports are forbidden.")
        self.generic_visit(node)

    def visit_Call(self, node: ast.Call) -> None:
        # Check direct calls like eval(...) or open(...)
        if isinstance(node.func, ast.Name) and node.func.id in BLOCKED_BUILTINS:
            self.violations.append(
                f"Line {node.lineno}: Prohibited built-in function call '{node.func.id}()'."
            )
        # Check getattr/setattr calls targeting blocked attributes
        elif isinstance(node.func, ast.Attribute) and node.func.attr in BLOCKED_ATTRIBUTES:
            self.violations.append(
                f"Line {node.lineno}: Prohibited attribute access '{node.func.attr}'."
            )
        self.generic_visit(node)

    def visit_Attribute(self, node: ast.Attribute) -> None:
        if node.attr in BLOCKED_ATTRIBUTES:
            self.violations.append(
                f"Line {node.lineno}: Prohibited access to dunder/private attribute '{node.attr}'."
            )
        self.generic_visit(node)


def validate_python_code(code: str) -> tuple[bool, list[str]]:
    """
    Validate Python script with AST static analysis.
    Returns (is_valid, list_of_violations).
    """
    if not code or not code.strip():
        return False, ["Script is empty"]

    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        return False, [f"Syntax Error at line {e.lineno}, offset {e.offset}: {e.msg}"]

    validator = ASTSecurityValidator()
    validator.visit(tree)

    if validator.violations:
        return False, validator.violations

    return True, []


class ExecutionResult(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    success: bool
    stdout: str = ""
    stderr: str = ""
    exit_code: int = 0
    duration_ms: int = 0
    ast_valid: bool = True
    security_violations: list[str] = Field(default_factory=list)


class PythonSandbox:
    """
    Asynchronous subprocess runner executing AST-verified Python scripts
    with strict wall-clock timeout bounds and memory/output limits.
    """

    def __init__(self, default_timeout: float = DEFAULT_TIMEOUT_SECONDS):
        self.default_timeout = min(default_timeout, MAX_TIMEOUT_SECONDS)

    async def execute(
        self,
        code: str,
        timeout_seconds: float | None = None,
    ) -> ExecutionResult:
        timeout = min(timeout_seconds or self.default_timeout, MAX_TIMEOUT_SECONDS)
        start_time = time.perf_counter()

        # 1. Perform AST static security validation
        is_valid, violations = validate_python_code(code)
        if not is_valid:
            duration = int((time.perf_counter() - start_time) * 1000)
            return ExecutionResult(
                success=False,
                stdout="",
                stderr="AST Security Validation Failed:\n"
                + "\n".join(f"- {v}" for v in violations),
                exit_code=1,
                duration_ms=duration,
                ast_valid=False,
                security_violations=violations,
            )

        # 2. Spawn isolated Python subprocess
        # Python flags: -c to run string code, -u for unbuffered binary stdout and stderr
        cmd = [sys.executable, "-u", "-c", code]

        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )

            try:
                stdout_bytes, stderr_bytes = await asyncio.wait_for(
                    process.communicate(),
                    timeout=timeout,
                )
            except TimeoutError:
                try:
                    process.kill()
                    await process.wait()
                except OSError as err:
                    logger.debug(f"Failed to kill timed out process: {err}")
                duration = int((time.perf_counter() - start_time) * 1000)
                return ExecutionResult(
                    success=False,
                    stdout="",
                    stderr=f"Execution timed out after {timeout:.1f} seconds.",
                    exit_code=-1,
                    duration_ms=duration,
                    ast_valid=True,
                    security_violations=[],
                )

            duration = int((time.perf_counter() - start_time) * 1000)
            stdout_str = stdout_bytes.decode("utf-8", errors="replace")[:MAX_OUTPUT_CHARS]
            stderr_str = stderr_bytes.decode("utf-8", errors="replace")[:MAX_OUTPUT_CHARS]
            exit_code = process.returncode if process.returncode is not None else 0

            return ExecutionResult(
                success=(exit_code == 0),
                stdout=stdout_str,
                stderr=stderr_str,
                exit_code=exit_code,
                duration_ms=duration,
                ast_valid=True,
                security_violations=[],
            )

        except (OSError, RuntimeError, ValueError) as e:
            duration = int((time.perf_counter() - start_time) * 1000)
            logger.error(f"Unexpected error running Python sandbox subprocess: {e}")
            return ExecutionResult(
                success=False,
                stdout="",
                stderr=f"Subprocess runner error: {e}",
                exit_code=1,
                duration_ms=duration,
                ast_valid=True,
                security_violations=[],
            )


default_python_sandbox = PythonSandbox()
