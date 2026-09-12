import logging
from datetime import UTC, datetime
from uuid import UUID

import asyncpg
from pgvector.asyncpg import register_vector

from app.config import settings
from app.db.models import RateLimitBucket, User

logger = logging.getLogger("nexusagent.db.neon")


class NeonDatabase:
    def __init__(self, dsn: str | None = None):
        self.dsn = dsn or settings.NEON_DATABASE_URL or settings.DATABASE_URL
        self.pool: asyncpg.Pool | None = None

    async def connect(self) -> bool:
        """Establish connection pool to Neon PostgreSQL 18."""
        if not self.dsn:
            logger.warning("No Neon database URL provided; connection skipped.")
            return False

        try:

            async def init_connection(conn: asyncpg.Connection):
                await register_vector(conn)

            self.pool = await asyncpg.create_pool(
                self.dsn,
                min_size=1,
                max_size=10,
                statement_cache_size=0,
                init=init_connection,
            )
            logger.info("Successfully connected to Neon PostgreSQL 18 connection pool.")
            return True
        except (asyncpg.PostgresError, OSError, ConnectionError) as e:
            logger.error(f"Failed to connect to Neon PostgreSQL: {e}")
            self.pool = None
            return False

    async def disconnect(self) -> None:
        """Close connection pool."""
        if self.pool:
            await self.pool.close()
            self.pool = None
            logger.info("Closed Neon PostgreSQL connection pool.")

    async def execute_migration(self, migration_sql: str) -> None:
        """Execute DDL migration script."""
        if not self.pool:
            raise RuntimeError("Neon database is not connected.")
        async with self.pool.acquire() as conn:
            await conn.execute(migration_sql)

    async def create_user(self, user: User) -> User:
        """Insert a new user record."""
        if not self.pool:
            raise RuntimeError("Neon database is not connected.")
        query = """
            INSERT INTO users (id, email, hashed_password, name, avatar_url, is_guest, client_ip, device_id, created_at, last_seen_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id, email, hashed_password, name, avatar_url, is_guest, client_ip, device_id, created_at, last_seen_at;
        """
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                query,
                user.id,
                user.email,
                user.hashed_password,
                user.name,
                user.avatar_url,
                user.is_guest,
                user.client_ip,
                user.device_id,
                user.created_at,
                user.last_seen_at,
            )
            return User(**dict(row))

    async def get_user_by_id(self, user_id: UUID) -> User | None:
        """Fetch user by primary UUID key."""
        if not self.pool:
            raise RuntimeError("Neon database is not connected.")
        query = "SELECT * FROM users WHERE id = $1;"
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(query, user_id)
            return User(**dict(row)) if row else None

    async def get_user_by_email(self, email: str) -> User | None:
        """Fetch user by unique email."""
        if not self.pool:
            raise RuntimeError("Neon database is not connected.")
        query = "SELECT * FROM users WHERE email = $1;"
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(query, email)
            return User(**dict(row)) if row else None

    async def get_guest_by_device_id(self, device_id: str) -> User | None:
        """Fetch active guest user by unique persistent client device ID."""
        if not self.pool:
            raise RuntimeError("Neon database is not connected.")
        query = "SELECT * FROM users WHERE device_id = $1 AND is_guest = TRUE ORDER BY last_seen_at DESC LIMIT 1;"
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(query, device_id)
            return User(**dict(row)) if row else None

    async def update_user_last_seen(
        self, user_id: UUID, client_ip: str | None = None, device_id: str | None = None
    ) -> None:
        """Update last_seen_at timestamp, client IP, and device ID."""
        if not self.pool:
            return
        query = """
            UPDATE users
            SET last_seen_at = $1,
                client_ip = COALESCE($3, client_ip),
                device_id = COALESCE($4, device_id)
            WHERE id = $2;
        """
        async with self.pool.acquire() as conn:
            await conn.execute(query, datetime.now(UTC), user_id, client_ip, device_id)

    async def get_or_create_rate_limit(
        self, user_id: UUID, client_ip: str, default_tokens: int = 5
    ) -> RateLimitBucket:
        """Get or initialize rate limit bucket for user and IP."""
        if not self.pool:
            raise RuntimeError("Neon database is not connected.")
        select_query = "SELECT * FROM rate_limit_buckets WHERE user_id = $1 AND client_ip = $2;"
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(select_query, user_id, client_ip)
            if row:
                return RateLimitBucket(**dict(row))

            insert_query = """
                INSERT INTO rate_limit_buckets (user_id, client_ip, tokens_remaining, bucket_capacity, last_replenished_at)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (user_id, client_ip) DO UPDATE SET last_replenished_at = EXCLUDED.last_replenished_at
                RETURNING *;
            """
            row = await conn.fetchrow(
                insert_query,
                user_id,
                client_ip,
                default_tokens,
                default_tokens,
                datetime.now(UTC),
            )
            return RateLimitBucket(**dict(row))

    async def decrement_rate_limit(self, user_id: UUID, client_ip: str) -> bool:
        """Decrement token bucket by 1 if tokens remaining > 0."""
        if not self.pool:
            raise RuntimeError("Neon database is not connected.")
        query = """
            UPDATE rate_limit_buckets
            SET tokens_remaining = tokens_remaining - 1
            WHERE user_id = $1 AND client_ip = $2 AND tokens_remaining > 0
            RETURNING tokens_remaining;
        """
        async with self.pool.acquire() as conn:
            val = await conn.fetchval(query, user_id, client_ip)
            return val is not None


neon_db = NeonDatabase()


async def get_db() -> NeonDatabase:
    return neon_db
