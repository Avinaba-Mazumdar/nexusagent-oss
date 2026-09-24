import hashlib
import logging
from typing import Any
from uuid import UUID

from llama_index.core import Document as LlamaDocument
from llama_index.core.node_parser import MarkdownNodeParser

from app.db.models import DocumentChunk

logger = logging.getLogger("nexusagent.rag.parser")

MAX_CHUNK_CHARS = 800
CHUNK_OVERLAP = 100


def compute_line_positions(full_text: str, chunk_content: str) -> tuple[int, int]:
    """Find 1-indexed start and end line numbers of chunk_content inside full_text."""
    if not chunk_content or not full_text:
        return 1, 1

    first_line = chunk_content.splitlines()[0] if chunk_content.splitlines() else chunk_content
    char_index = full_text.find(first_line)
    if char_index == -1:
        # Fallback: substring search with stripped snippet
        stripped = first_line.strip()
        char_index = full_text.find(stripped) if stripped else -1

    if char_index != -1:
        start_line = full_text[:char_index].count("\n") + 1
        end_line = start_line + max(0, chunk_content.count("\n"))
        return start_line, end_line

    return 1, max(1, chunk_content.count("\n") + 1)


def split_large_section(
    section_text: str, max_chars: int = MAX_CHUNK_CHARS, overlap: int = CHUNK_OVERLAP
) -> list[str]:
    """Split section text exceeding max_chars by paragraphs/lines while respecting boundaries."""
    if len(section_text) <= max_chars:
        return [section_text]

    chunks: list[str] = []
    lines = section_text.splitlines(keepends=True)
    current_chunk: list[str] = []
    current_len = 0

    for line in lines:
        if current_len + len(line) > max_chars and current_chunk:
            combined = "".join(current_chunk).strip()
            if combined:
                chunks.append(combined)

            # Keep overlap lines if possible
            overlap_lines: list[str] = []
            overlap_len = 0
            for prev_line in reversed(current_chunk):
                if overlap_len + len(prev_line) <= overlap:
                    overlap_lines.insert(0, prev_line)
                    overlap_len += len(prev_line)
                else:
                    break
            current_chunk = overlap_lines
            current_len = overlap_len

        current_chunk.append(line)
        current_len += len(line)

    if current_chunk:
        combined = "".join(current_chunk).strip()
        if combined:
            chunks.append(combined)

    return chunks if chunks else [section_text[:max_chars]]


class MarkdownHierarchicalParser:
    """LlamaIndex-powered markdown hierarchical parser creating chunk records with line metadata."""

    def __init__(self, max_chunk_chars: int = MAX_CHUNK_CHARS, overlap: int = CHUNK_OVERLAP):
        self.max_chunk_chars = max_chunk_chars
        self.overlap = overlap
        self.node_parser = MarkdownNodeParser()

    def parse_markdown(
        self,
        markdown_text: str,
        document_id: UUID,
        extra_metadata: dict[str, Any] | None = None,
    ) -> list[DocumentChunk]:
        """
        Parse raw markdown content into structured, hierarchical DocumentChunk models.
        Extracts header hierarchy, start_line, end_line, char_count, token_count, and SHA-256 hash.
        """
        extra_metadata = extra_metadata or {}
        clean_text = markdown_text.strip()
        if not clean_text:
            return []

        llama_doc = LlamaDocument(text=clean_text)
        try:
            nodes = self.node_parser.get_nodes_from_documents([llama_doc])
        except (ValueError, TypeError, KeyError, AttributeError, IndexError) as exc:
            logger.warning("MarkdownNodeParser failed (%s); falling back to direct split.", exc)
            nodes = []

        chunks: list[DocumentChunk] = []
        chunk_index = 0

        if nodes:
            for node in nodes:
                node_text = node.text.strip()
                if not node_text:
                    continue

                header_path_raw = node.metadata.get("header_path", "/")
                # Normalize header_path: "/Header 1/Subheader/" -> ["Header 1", "Subheader"]
                headers = [h.strip() for h in header_path_raw.split("/") if h.strip()]

                # If node itself starts with a markdown header, append it to headerPath
                first_line = node_text.splitlines()[0].strip() if node_text.splitlines() else ""
                if first_line.startswith("#"):
                    curr_header = first_line.lstrip("#").strip()
                    if curr_header and (not headers or headers[-1] != curr_header):
                        headers = [*headers, curr_header]

                sub_chunks = split_large_section(
                    node_text, max_chars=self.max_chunk_chars, overlap=self.overlap
                )
                for sub_text in sub_chunks:
                    start_l, end_l = compute_line_positions(clean_text, sub_text)
                    meta = {
                        "headerPath": headers,
                        "startLine": start_l,
                        "endLine": end_l,
                        "charCount": len(sub_text),
                        "tokenCount": max(1, len(sub_text.split())),
                        "sha256": hashlib.sha256(sub_text.encode("utf-8")).hexdigest(),
                        **extra_metadata,
                    }
                    chunk = DocumentChunk(
                        document_id=document_id,
                        chunk_index=chunk_index,
                        content=sub_text,
                        metadata=meta,
                    )
                    chunks.append(chunk)
                    chunk_index += 1
        else:
            # Fallback if no markdown nodes returned
            sub_chunks = split_large_section(
                clean_text, max_chars=self.max_chunk_chars, overlap=self.overlap
            )
            for sub_text in sub_chunks:
                start_l, end_l = compute_line_positions(clean_text, sub_text)
                meta = {
                    "headerPath": [],
                    "startLine": start_l,
                    "endLine": end_l,
                    "charCount": len(sub_text),
                    "tokenCount": max(1, len(sub_text.split())),
                    "sha256": hashlib.sha256(sub_text.encode("utf-8")).hexdigest(),
                    **extra_metadata,
                }
                chunk = DocumentChunk(
                    document_id=document_id,
                    chunk_index=chunk_index,
                    content=sub_text,
                    metadata=meta,
                )
                chunks.append(chunk)
                chunk_index += 1

        return chunks


default_markdown_parser = MarkdownHierarchicalParser()
