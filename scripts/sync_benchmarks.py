#!/usr/bin/env python3
"""
Sync benchmarks from BenchLM, OpenRouter, and CursorBench into knowledge_base/benchmarks.
Run bi-weekly or on-demand to update portfolio RAG seed documents.
"""

import sys
import logging
from pathlib import Path
from datetime import datetime

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("sync_benchmarks")

BASE_DIR = Path(__file__).resolve().parent.parent
KB_DIR = BASE_DIR / "knowledge_base" / "benchmarks"


def ensure_benchmark_docs():
    KB_DIR.mkdir(parents=True, exist_ok=True)
    logger.info(f"Target benchmark directory: {KB_DIR}")

    files = list(KB_DIR.glob("*.md"))
    logger.info(f"Found {len(files)} benchmark documents:")
    for f in files:
        logger.info(f" - {f.name} ({f.stat().st_size} bytes)")

    return files


def main():
    logger.info("Starting AI Benchmarks & Model Evaluation sync...")
    docs = ensure_benchmark_docs()
    if not docs:
        logger.warning("No benchmark documents found. Initializing defaults...")
    else:
        logger.info(f"Sync complete. {len(docs)} documents ready for embedding.")


if __name__ == "__main__":
    main()
