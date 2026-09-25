"""
Token-Bucket Rate Limiter.
Enforces hourly token limits per user/IP:
- Guest users: 5 requests / hour
- Authenticated registered users: 25 requests / hour
- BYOK (X-User-API-Key) callers bypass the server bucket
Operates on Neon PostgreSQL with resilient in-memory fallback when offline.
"""

import logging
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from uuid import UUID

from fastapi import HTTPException, status

from app.db.neon import NeonDatabase

logger = logging.getLogger("nexusagent.core.rate_limiter")


@dataclass
class MemoryBucket:
    user_id: str
    client_ip: str
    tokens_remaining: int
    bucket_capacity: int
    last_replenished_at: datetime


class TokenBucketLimiter:
    """Thread-safe / async token-bucket rate limiter with database & memory tiers."""

    def __init__(self, db: NeonDatabase | None = None):
        self.db = db
        # In-memory store keyed by (str(user_id), client_ip)
        self._memory_buckets: dict[tuple[str, str], MemoryBucket] = {}

    def _get_memory_bucket(
        self, user_id: UUID | str, client_ip: str, default_tokens: int
    ) -> MemoryBucket:
        key = (str(user_id), client_ip)
        now = datetime.now(UTC)
        bucket = self._memory_buckets.get(key)

        if not bucket:
            bucket = MemoryBucket(
                user_id=str(user_id),
                client_ip=client_ip,
                tokens_remaining=default_tokens,
                bucket_capacity=default_tokens,
                last_replenished_at=now,
            )
            self._memory_buckets[key] = bucket
            return bucket

        # Check hourly replenishment
        if (now - bucket.last_replenished_at) >= timedelta(hours=1):
            bucket.tokens_remaining = bucket.bucket_capacity
            bucket.last_replenished_at = now

        return bucket

    async def check_and_consume(
        self,
        user_id: UUID,
        client_ip: str,
        is_guest: bool = True,
        byok_key: str | None = None,
    ) -> int:
        """
        Check and consume 1 token.
        Returns tokens_remaining after decrement.
        Raises HTTPException(429) if quota is depleted.
        BYOK keys bypass rate limiting completely.
        """
        if byok_key:
            return 999  # Unlimited for BYOK callers

        default_tokens = 5 if is_guest else 25

        # 1. Try PostgreSQL if pool is available
        if self.db and self.db.pool:
            try:
                await self.db.get_or_create_rate_limit(
                    user_id, client_ip, default_tokens=default_tokens
                )
                success = await self.db.decrement_rate_limit(user_id, client_ip)
                if not success:
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail=(
                            "Free-tier quota limit reached. Bring your own key (BYOK) to continue "
                            "unconstrained or hire me for a custom build."
                        ),
                        headers={"Retry-After": "3600"},
                    )
                # Fetch remaining
                row = await self.db.get_or_create_rate_limit(
                    user_id, client_ip, default_tokens=default_tokens
                )
                return row.tokens_remaining
            except HTTPException:
                raise
            except Exception as e:  # noqa: BLE001
                logger.warning(
                    f"Database rate limit query failed, falling back to memory bucket: {e}"
                )

        # 2. Resilient In-Memory Fallback
        bucket = self._get_memory_bucket(user_id, client_ip, default_tokens)
        if bucket.tokens_remaining <= 0:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=(
                    "Free-tier quota limit reached. Bring your own key (BYOK) to continue "
                    "unconstrained or hire me for a custom build."
                ),
                headers={"Retry-After": "3600"},
            )

        bucket.tokens_remaining -= 1
        return bucket.tokens_remaining

    def reset_for_test(self) -> None:
        """Clear memory cache for test isolation."""
        self._memory_buckets.clear()


default_rate_limiter = TokenBucketLimiter()
