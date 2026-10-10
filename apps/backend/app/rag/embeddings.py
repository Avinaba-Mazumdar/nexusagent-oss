import hashlib
import logging
from collections.abc import Sequence

import httpx
import numpy as np

from app.config import settings

logger = logging.getLogger("nexusagent.rag.embeddings")

EMBEDDING_DIMENSION = 768
GEMINI_EMBED_MODELS = ["gemini-embedding-001", "gemini-embedding-2", "text-embedding-004"]
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
    Embedding generation service supporting Google Gemini embeddings (768-d)
    with graceful fallback between gemini-embedding-001 and gemini-embedding-2.
    """

    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.dimension = EMBEDDING_DIMENSION
        self.active_model = GEMINI_EMBED_MODELS[0]

    async def get_embedding(self, text: str) -> list[float]:
        """Generate a 768-d dense embedding for a single text chunk."""
        embeddings = await self.get_embeddings([text])
        return embeddings[0]

    async def get_embeddings(self, texts: Sequence[str]) -> list[list[float]]:
        """
        Generate 768-d dense embeddings for a batch of text strings via Google Gemini API.
        """
        if not texts:
            return []

        if not self.api_key:
            raise RuntimeError("GEMINI_API_KEY is not configured for EmbeddingService.")

        last_error = None
        # Try active_model first, then other fallback models
        models_to_try = [self.active_model] + [m for m in GEMINI_EMBED_MODELS if m != self.active_model]

        async with httpx.AsyncClient(timeout=10.0) as client:
            for model_name in models_to_try:
                try:
                    url = f"{GEMINI_API_URL}/{model_name}:batchEmbedContents?key={self.api_key}"
                    requests_payload = [
                        {
                            "model": f"models/{model_name}",
                            "content": {"parts": [{"text": t[:2048]}]},
                            "outputDimensionality": self.dimension,
                        }
                        for t in texts
                    ]
                    response = await client.post(url, json={"requests": requests_payload})
                    if response.status_code == 200:
                        data = response.json()
                        embeddings = [item["values"] for item in data.get("embeddings", [])]
                        if len(embeddings) == len(texts):
                            self.active_model = model_name
                            return embeddings
                    last_error = f"Gemini embedding API ({model_name}) status {response.status_code}: {response.text}"
                    if response.status_code != 404:
                        break
                except Exception as e:
                    last_error = str(e)

        logger.error(f"Error calling Gemini Embedding API: {last_error}")
        raise RuntimeError(f"Gemini embedding provider unavailable: {last_error}")


default_embedding_service = EmbeddingService()
