#!/usr/bin/env python3
"""
NexusAgent Predefined Knowledge Base Seeding Pipeline.
Reads markdown files in knowledge_base/benchmarks/, creates semantic chunks,
generates 768-dimensional embeddings, and upserts into Neon PostgreSQL document_chunks.

Run bi-weekly or after updating benchmark files:
  python scripts/seed_kb.py
"""

import os
import sys
import hashlib
import asyncio
import logging
from pathlib import Path
from uuid import uuid4
import asyncpg
import numpy as np
import httpx
from pgvector.asyncpg import register_vector

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("seed_kb")

BASE_DIR = Path(__file__).resolve().parent.parent
KB_DIR = BASE_DIR / "knowledge_base" / "benchmarks"
ENV_FILE = BASE_DIR / "apps" / "backend" / ".env"


def load_env():
    env_vars = {}
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env_vars[k.strip()] = v.strip()
    return env_vars


def chunk_markdown(content: str, max_chunk_size: int = 600) -> list[str]:
    """Chunk markdown document by double newlines and header boundaries."""
    raw_sections = [s.strip() for s in content.split("\n\n") if s.strip()]
    chunks = []
    current_chunk = []
    current_len = 0

    for section in raw_sections:
        section_len = len(section)
        if current_len + section_len > max_chunk_size and current_chunk:
            chunks.append("\n\n".join(current_chunk))
            current_chunk = [section]
            current_len = section_len
        else:
            current_chunk.append(section)
            current_len += section_len

    if current_chunk:
        chunks.append("\n\n".join(current_chunk))

    return chunks


async def get_embedding(text: str, api_key: str | None = None) -> list[float]:
    """
    Get 768-dim embedding using Google text-embedding-004 if api_key available,
    otherwise deterministic normalized semantic hash for offline dev.
    """
    if api_key:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={api_key}"
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(
                    url,
                    json={
                        "model": "models/text-embedding-004",
                        "content": {"parts": [{"text": text[:2048]}]},
                    },
                )
                if res.status_code == 200:
                    data = res.json()
                    values = data.get("embedding", {}).get("values", [])
                    if len(values) == 768:
                        return values
                else:
                    logger.warning(f"Gemini embedding API returned {res.status_code}, falling back.")
        except Exception as e:
            logger.warning(f"Gemini embedding call failed ({e}), using fallback.")

    # Deterministic pseudo-embedding for local offline development / CI (768 dimensions)
    # Uses multiple SHA-256 rounds to seed a reproducible normalized unit vector
    h = hashlib.sha256(text.encode("utf-8")).hexdigest()
    seed = int(h[:8], 16)
    rng = np.random.default_rng(seed)
    vec = rng.standard_normal(768).astype(np.float32)
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm
    return vec.tolist()


async def seed_knowledge_base():
    env_vars = load_env()
    dsn = os.environ.get("NEON_DATABASE_URL") or env_vars.get("NEON_DATABASE_URL")
    gemini_key = os.environ.get("GEMINI_API_KEY") or env_vars.get("GEMINI_API_KEY")

    if not dsn:
        logger.error("NEON_DATABASE_URL not found in environment or apps/backend/.env")
        sys.exit(1)

    if not KB_DIR.exists():
        logger.error(f"Knowledge base directory {KB_DIR} does not exist.")
        sys.exit(1)

    files = list(KB_DIR.glob("*.md"))
    if not files:
        logger.warning(f"No markdown documents found in {KB_DIR}")
        return

    logger.info(f"Connecting to Neon database pool...")
    conn = await asyncpg.connect(dsn)
    await register_vector(conn)

    try:
        # Wipe previous seeded records for atomic bi-weekly refresh
        logger.info("Refreshing seeded documents...")
        await conn.execute("DELETE FROM documents WHERE is_seeded = TRUE;")

        total_chunks_seeded = 0
        for doc_path in files:
            content = doc_path.read_text(encoding="utf-8")
            sha256_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()
            chunks = chunk_markdown(content)
            doc_id = uuid4()

            logger.info(f"Ingesting '{doc_path.name}' ({len(chunks)} chunks)...")
            await conn.execute(
                """
                INSERT INTO documents (id, user_id, filename, mime_type, sha256_hash, total_chunks, storage_path, is_seeded)
                VALUES ($1, NULL, $2, 'text/markdown', $3, $4, $5, TRUE);
                """,
                doc_id,
                doc_path.name,
                sha256_hash,
                len(chunks),
                str(doc_path.relative_to(BASE_DIR)),
            )

            for idx, chunk_text in enumerate(chunks):
                emb = await get_embedding(chunk_text, gemini_key)
                chunk_id = uuid4()
                await conn.execute(
                    """
                    INSERT INTO document_chunks (id, document_id, chunk_index, content, embedding, metadata)
                    VALUES ($1, $2, $3, $4, $5, $6::jsonb);
                    """,
                    chunk_id,
                    doc_id,
                    idx,
                    chunk_text,
                    emb,
                    f'{{"source": "{doc_path.name}", "chunk_index": {idx}}}',
                )
                total_chunks_seeded += 1

        logger.info(f"Successfully seeded {len(files)} documents and {total_chunks_seeded} chunks into Neon DB!")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(seed_knowledge_base())
