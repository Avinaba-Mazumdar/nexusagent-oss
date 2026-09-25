"""
Security Guardrails: Prompt Injection Delimiters & Canary Tokens.
Protects autonomous agent context from indirect prompt injection and data exfiltration.
"""

import html
import re
from collections.abc import Sequence
from typing import Any
from uuid import uuid4

# Prompt injection signatures (case-insensitive)
INJECTION_PATTERNS = [
    re.compile(
        r"\b(ignore|disregard|forget|override)\s+(all\s+)?(previous|prior|system)\s+(instructions|prompts|rules)\b",
        re.IGNORECASE,
    ),
    re.compile(r"\b(system\s+prompt|developer\s+mode|jailbreak|DAN\s+mode)\b", re.IGNORECASE),
    re.compile(
        r"\b(reveal|output|display|leak)\s+(your\s+)?(secret|token|api[_\s]key|canary|password|credentials)\b",
        re.IGNORECASE,
    ),
    re.compile(r"</?untrusted_document_context.*?>", re.IGNORECASE),
]


def generate_canary_token() -> str:
    """Generate a cryptographic per-session/per-turn UUID canary token."""
    return f"CANARY_{uuid4().hex[:12].upper()}"


def sanitize_untrusted_text(text: str) -> str:
    """
    Sanitize text retrieved from external or user-uploaded documents to prevent delimiter breakout attacks.
    Escapes any closing or opening XML-style tags that mimic untrusted_document_context.
    """
    if not text:
        return ""
    # Neutralize any attempts to prematurely close or spoof document delimiters
    sanitized = re.sub(
        r"</?untrusted_document_context[^>]*>",
        lambda m: html.escape(m.group(0)),
        text,
        flags=re.IGNORECASE,
    )
    return sanitized


def wrap_untrusted_context(
    content: str,
    filename: str = "document.md",
    start_line: int | None = None,
    end_line: int | None = None,
    doc_id: str | None = None,
) -> str:
    """
    Wrap untrusted retrieved document content with strict XML-style security boundaries.
    Instructs models to treat content within boundaries strictly as passive data, never instructions.
    """
    safe_content = sanitize_untrusted_text(content)
    line_attr = f' lines="{start_line}-{end_line}"' if start_line and end_line else ""
    doc_attr = f' id="{doc_id}"' if doc_id else ""

    return (
        f'<untrusted_document_context filename="{html.escape(filename)}"{doc_attr}{line_attr}>\n'
        f"{safe_content.strip()}\n"
        f"</untrusted_document_context>"
    )


def detect_prompt_injection(text: str) -> tuple[bool, str | None]:
    """
    Scan query or text for known adversarial prompt injection indicators.
    Returns (is_injected, matched_reason).
    """
    if not text:
        return False, None

    for pattern in INJECTION_PATTERNS:
        match = pattern.search(text)
        if match:
            return True, f"Suspicious prompt pattern detected: '{match.group(0)}'"

    return False, None


def verify_canary_integrity(output: str, canary_token: str) -> bool:
    """
    Check if the private canary token was leaked into model output.
    Returns True if the output is clean (canary was NOT leaked).
    Returns False if canary was compromised.
    """
    if not canary_token:
        return True
    return canary_token not in output


def sanitize_retrieved_chunks(
    chunks: Sequence[Any],
) -> tuple[list[Any], list[str], list[dict[str, str]]]:
    """
    Defense-in-depth for indirect prompt injection arriving inside retrieved documents.

    For each retrieved chunk:
      1. Escape delimiter-breakout attempts (``sanitize_untrusted_text``).
      2. Wrap the content in ``<untrusted_document_context>`` boundaries.
      3. Scan for instruction-style patterns; flagged chunks are dropped entirely.

    Returns ``(sanitized_chunks, wrapped_contexts, flagged)`` where ``flagged``
    entries carry the filename and the matched reason for observability.
    """
    sanitized_chunks: list[Any] = []
    wrapped_contexts: list[str] = []
    flagged: list[dict[str, str]] = []

    for chunk in chunks:
        clean = sanitize_untrusted_text(chunk.content)
        injected, reason = detect_prompt_injection(clean)
        if injected:
            flagged.append({"filename": chunk.filename, "reason": reason or "injection pattern"})
            continue
        chunk.content = clean
        sanitized_chunks.append(chunk)
        wrapped_contexts.append(
            wrap_untrusted_context(
                clean,
                filename=chunk.filename,
                start_line=chunk.start_line,
                end_line=chunk.end_line,
            )
        )

    return sanitized_chunks, wrapped_contexts, flagged
