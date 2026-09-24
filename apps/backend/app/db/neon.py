import logging
from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

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

    async def upsert_google_user(
        self,
        email: str,
        name: str,
        avatar_url: str | None = None,
        client_ip: str | None = None,
    ) -> User:
        """Upsert Google OAuth verified user and ensure is_guest is False."""
        if not self.pool:
            raise RuntimeError("Neon database is not connected.")
        now = datetime.now(UTC)
        query = """
            INSERT INTO users (id, email, name, avatar_url, is_guest, client_ip, created_at, last_seen_at)
            VALUES ($1, $2, $3, $4, FALSE, $5, $6, $6)
            ON CONFLICT (email) DO UPDATE
            SET name = EXCLUDED.name,
                avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
                is_guest = FALSE,
                client_ip = COALESCE(EXCLUDED.client_ip, users.client_ip),
                last_seen_at = EXCLUDED.last_seen_at
            RETURNING id, email, hashed_password, name, avatar_url, is_guest, client_ip, device_id, created_at, last_seen_at;
        """
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                query,
                uuid4(),
                email.lower().strip(),
                name.strip(),
                avatar_url,
                client_ip,
                now,
            )
            return User(**dict(row))

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
        """Get or initialize rate limit bucket for user and IP, replenishing hourly if expired."""
        if not self.pool:
            raise RuntimeError("Neon database is not connected.")
        now = datetime.now(UTC)
        select_query = "SELECT * FROM rate_limit_buckets WHERE user_id = $1 AND client_ip = $2;"
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(select_query, user_id, client_ip)
            if row:
                bucket = RateLimitBucket(**dict(row))
                last_rep = bucket.last_replenished_at
                if last_rep.tzinfo is None:
                    last_rep = last_rep.replace(tzinfo=UTC)
                if (now - last_rep) >= timedelta(hours=1):
                    replenish_query = """
                        UPDATE rate_limit_buckets
                        SET tokens_remaining = bucket_capacity,
                            last_replenished_at = $3
                        WHERE user_id = $1 AND client_ip = $2
                        RETURNING *;
                    """
                    updated_row = await conn.fetchrow(replenish_query, user_id, client_ip, now)
                    if updated_row:
                        return RateLimitBucket(**dict(updated_row))
                return bucket

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
                now,
            )
            return RateLimitBucket(**dict(row))

    async def decrement_rate_limit(self, user_id: UUID, client_ip: str) -> bool:
        """Decrement token bucket by 1 if tokens remaining > 0, replenishing first if hourly window elapsed."""
        if not self.pool:
            raise RuntimeError("Neon database is not connected.")
        now = datetime.now(UTC)
        async with self.pool.acquire() as conn:
            bucket_row = await conn.fetchrow(
                "SELECT tokens_remaining, bucket_capacity, last_replenished_at FROM rate_limit_buckets WHERE user_id = $1 AND client_ip = $2;",
                user_id,
                client_ip,
            )
            if bucket_row:
                last_rep = bucket_row["last_replenished_at"]
                if last_rep.tzinfo is None:
                    last_rep = last_rep.replace(tzinfo=UTC)
                if (now - last_rep) >= timedelta(hours=1):
                    await conn.execute(
                        """
                        UPDATE rate_limit_buckets
                        SET tokens_remaining = bucket_capacity,
                            last_replenished_at = $3
                        WHERE user_id = $1 AND client_ip = $2;
                        """,
                        user_id,
                        client_ip,
                        now,
                    )

            query = """
                UPDATE rate_limit_buckets
                SET tokens_remaining = tokens_remaining - 1
                WHERE user_id = $1 AND client_ip = $2 AND tokens_remaining > 0
                RETURNING tokens_remaining;
            """
            val = await conn.fetchval(query, user_id, client_ip)
            return val is not None

    async def search_seeded_chunks(
        self, query_embedding: list[float], limit: int = 3
    ) -> list[dict]:
        """Perform cosine similarity search on seeded knowledge base chunks."""
        if not self.pool:
            raise RuntimeError("Neon database is not connected.")
        query = """
            SELECT c.id, c.content, c.metadata, d.filename,
                   1 - (c.embedding <=> $1::vector) AS similarity
            FROM document_chunks c
            JOIN documents d ON c.document_id = d.id
            WHERE d.is_seeded = TRUE
            ORDER BY c.embedding <=> $1::vector ASC
            LIMIT $2;
        """
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query, query_embedding, limit)
            return [dict(r) for r in rows]

    async def get_seeded_documents(self) -> list[dict]:
        """Fetch list of active seeded benchmark documents."""
        if not self.pool:
            raise RuntimeError("Neon database is not connected.")
        query = "SELECT id, filename, total_chunks, uploaded_at FROM documents WHERE is_seeded = TRUE ORDER BY filename ASC;"
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query)
            return [dict(r) for r in rows]


neon_db = NeonDatabase()


async def get_db() -> NeonDatabase:
    """FastAPI dependency for accessing database singleton."""
    return neon_db
