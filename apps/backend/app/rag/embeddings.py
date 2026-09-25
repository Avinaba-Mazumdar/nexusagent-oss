import hashlib
import logging
from collections.abc import Sequence

import httpx
import numpy as np

from app.config import settings

logger = logging.getLogger("nexusagent.rag.embeddings")

EMBEDDING_DIMENSION = 768
GEMINI_EMBED_MODEL = "text-embedding-004"
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models"


def generate_deterministic_embedding(text: str, dim: int = EMBEDDING_DIMENSION) -> list[float]:
    """
    Generate a reproducible, pseudo-semantic 768-dimensional unit vector from input text.
    Provides zero-latency fallback and offline testing when Gemini API key is not configured.
    Uses multi-salt cryptographic hashing and token feature projection with L2 normalization.
    """
    if not text.strip():
        vec = np.zeros(dim, dtype=np.float32)
        vec[0] = 1.0
        return vec.tolist()

    # Seed random generator deterministically using SHA-256 of text
    digest = hashlib.sha256(text.encode("utf-8")).digest()
    seed = int.from_bytes(digest[:8], byteorder="big") % (2**32)
    rng = np.random.RandomState(seed)

    # Base noise vector
    vector = rng.standard_normal(dim).astype(np.float32)

    # Word-level n-gram feature boosting
    words = [w.lower().strip(".,;:!?\"'()[]{}") for w in text.split() if len(w) > 2]
    for i, word in enumerate(words):
        word_digest = hashlib.sha256(word.encode("utf-8")).digest()
        idx1 = int.from_bytes(word_digest[:4], "big") % dim
        idx2 = int.from_bytes(word_digest[4:8], "big") % dim
        vector[idx1] += 1.5 / (1.0 + 0.1 * i)
        vector[idx2] -= 1.0 / (1.0 + 0.1 * i)

    # L2 normalize
    norm = np.linalg.norm(vector)
    if norm > 0:
        vector = vector / norm

    return vector.tolist()


class EmbeddingService:
    """
    Embedding generation service supporting Google Gemini text-embedding-004
    with graceful deterministic simulation fallback.
    """

    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.dimension = EMBEDDING_DIMENSION

    async def get_embedding(self, text: str) -> list[float]:
        """Generate a 768-d dense embedding for a single text chunk."""
        embeddings = await self.get_embeddings([text])
        return embeddings[0]

    async def get_embeddings(self, texts: Sequence[str]) -> list[list[float]]:
        """
        Generate 768-d dense embeddings for a batch of text strings.

        Live mode: uses the Google Gemini API whenever an API key is configured.
        Simulator mode: with no key, returns deterministic vectors (zero-cost demo mode).
        USE_SIMULATION_FALLBACK only controls behavior when a configured provider *fails*;
        it never silences a working API key.
        """
        if not texts:
            return []

        if not self.api_key:
            return [generate_deterministic_embedding(t, self.dimension) for t in texts]

        try:
            url = f"{GEMINI_API_URL}/{GEMINI_EMBED_MODEL}:batchEmbedContents?key={self.api_key}"
            requests_payload = [
                {
                    "model": f"models/{GEMINI_EMBED_MODEL}",
                    "content": {"parts": [{"text": t[:2048]}]},
                }
                for t in texts
            ]
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url, json={"requests": requests_payload})
                if response.status_code == 200:
                    data = response.json()
                    embeddings = [item["values"] for item in data.get("embeddings", [])]
                    if len(embeddings) == len(texts):
                        return embeddings
                logger.warning(
                    f"Gemini embedding API returned status {response.status_code}; using deterministic fallback."
                )
        except (httpx.HTTPError, OSError, ValueError, KeyError) as e:
            logger.warning(f"Error calling Gemini Embedding API: {e}")

        if not settings.USE_SIMULATION_FALLBACK:
            raise RuntimeError(
                "Gemini embedding provider unavailable and USE_SIMULATION_FALLBACK is disabled. "
                "Set GEMINI_API_KEY or re-enable the deterministic simulator fallback."
            )

        logger.warning("Falling back to deterministic simulator embeddings.")
        return [generate_deterministic_embedding(t, self.dimension) for t in texts]


default_embedding_service = EmbeddingService()
