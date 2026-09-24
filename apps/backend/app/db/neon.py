import json
import logging
from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

import asyncpg
from pgvector.asyncpg import register_vector

from app.config import settings
from app.db.models import Document, DocumentChunk, RateLimitBucket, User

logger = logging.getLogger("nexusagent.db.neon")


class NeonDatabase:
    def __init__(self, dsn: str | None = None):
        self.dsn = dsn or settings.NEON_DATABASE_URL or settings.DATABASE_URL
        self.pool: asyncpg.Pool | None = None

    def get_pool(self) -> asyncpg.Pool:
        """Return the active connection pool or raise an error if not connected."""
        if self.pool is None:
            raise RuntimeError("Neon database connection pool is not initialized.")
        return self.pool

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
        pool = self.get_pool()
        async with pool.acquire() as conn:
            await conn.execute(migration_sql)

    async def create_user(self, user: User) -> User:
        """Insert a new user record."""
        pool = self.get_pool()
        query = """
            INSERT INTO users (id, email, hashed_password, name, avatar_url, is_guest, client_ip, device_id, created_at, last_seen_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id, email, hashed_password, name, avatar_url, is_guest, client_ip, device_id, created_at, last_seen_at;
        """
        async with pool.acquire() as conn:
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
        pool = self.get_pool()
        query = "SELECT * FROM users WHERE id = $1;"
        async with pool.acquire() as conn:
            row = await conn.fetchrow(query, user_id)
            return User(**dict(row)) if row else None

    async def get_user_by_email(self, email: str) -> User | None:
        """Fetch user by unique email."""
        pool = self.get_pool()
        query = "SELECT * FROM users WHERE email = $1;"
        async with pool.acquire() as conn:
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
        pool = self.get_pool()
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
        async with pool.acquire() as conn:
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
        pool = self.get_pool()
        query = "SELECT * FROM users WHERE device_id = $1 AND is_guest = TRUE ORDER BY last_seen_at DESC LIMIT 1;"
        async with pool.acquire() as conn:
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
        pool = self.get_pool()
        now = datetime.now(UTC)
        select_query = "SELECT * FROM rate_limit_buckets WHERE user_id = $1 AND client_ip = $2;"
        async with pool.acquire() as conn:
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
        pool = self.get_pool()
        now = datetime.now(UTC)
        async with pool.acquire() as conn:
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
        pool = self.get_pool()
        query = """
            SELECT c.id, c.content, c.metadata, d.filename,
                   1 - (c.embedding <=> $1::vector) AS similarity
            FROM document_chunks c
            JOIN documents d ON c.document_id = d.id
            WHERE d.is_seeded = TRUE
            ORDER BY c.embedding <=> $1::vector ASC
            LIMIT $2;
        """
        async with pool.acquire() as conn:
            rows = await conn.fetch(query, query_embedding, limit)
            return [dict(r) for r in rows]

    async def get_seeded_documents(self) -> list[dict]:
        """Fetch list of active seeded benchmark documents."""
        pool = self.get_pool()
        query = "SELECT id, filename, total_chunks, uploaded_at FROM documents WHERE is_seeded = TRUE ORDER BY filename ASC;"
        async with pool.acquire() as conn:
            rows = await conn.fetch(query)
            return [dict(r) for r in rows]

    async def create_document(self, document: Document) -> Document:
        """Insert a new document record into Neon documents table."""
        pool = self.get_pool()
        query = """
            INSERT INTO documents (id, user_id, filename, mime_type, sha256_hash, total_chunks, storage_path, is_seeded, uploaded_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, user_id, filename, mime_type, sha256_hash, total_chunks, storage_path, is_seeded, uploaded_at;
        """
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                query,
                document.id,
                document.user_id,
                document.filename,
                document.mime_type,
                document.sha256_hash,
                document.total_chunks,
                document.storage_path,
                document.is_seeded,
                document.uploaded_at,
            )
            return Document(**dict(row))

    async def insert_document_chunks(self, chunks: list[DocumentChunk]) -> int:
        """Batch insert document chunks into Neon document_chunks table."""
        if not chunks:
            return 0
        pool = self.get_pool()
        query = """
            INSERT INTO document_chunks (id, document_id, chunk_index, content, embedding, metadata, created_at)
            VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7);
        """
        records = [
            (
                c.id,
                c.document_id,
                c.chunk_index,
                c.content,
                c.embedding,
                json.dumps(c.metadata),
                c.created_at,
            )
            for c in chunks
        ]
        async with pool.acquire() as conn:
            await conn.executemany(query, records)
        return len(chunks)

    async def get_document_by_id(self, document_id: UUID) -> Document | None:
        """Fetch document by primary UUID."""
        pool = self.get_pool()
        query = "SELECT * FROM documents WHERE id = $1;"
        async with pool.acquire() as conn:
            row = await conn.fetchrow(query, document_id)
            return Document(**dict(row)) if row else None

    async def get_document_by_hash(
        self, sha256_hash: str, user_id: UUID | None = None
    ) -> Document | None:
        """Fetch document by unique SHA-256 hash and optional user_id."""
        pool = self.get_pool()
        if user_id:
            query = "SELECT * FROM documents WHERE sha256_hash = $1 AND user_id = $2 LIMIT 1;"
            async with pool.acquire() as conn:
                row = await conn.fetchrow(query, sha256_hash, user_id)
                return Document(**dict(row)) if row else None
        else:
            query = "SELECT * FROM documents WHERE sha256_hash = $1 LIMIT 1;"
            async with pool.acquire() as conn:
                row = await conn.fetchrow(query, sha256_hash)
                return Document(**dict(row)) if row else None

    async def get_document_chunks(self, document_id: UUID) -> list[DocumentChunk]:
        """Fetch all chunks for a document ordered by chunk_index."""
        pool = self.get_pool()
        query = """
            SELECT id, document_id, chunk_index, content, embedding, metadata, created_at
            FROM document_chunks
            WHERE document_id = $1
            ORDER BY chunk_index ASC;
        """
        async with pool.acquire() as conn:
            rows = await conn.fetch(query, document_id)
            chunks: list[DocumentChunk] = []
            for r in rows:
                data = dict(r)
                if isinstance(data.get("metadata"), str):
                    data["metadata"] = json.loads(data["metadata"])
                chunks.append(DocumentChunk(**data))
            return chunks

    async def list_all_documents(self, user_id: UUID | None = None) -> list[Document]:
        """List documents visible to the user (all seeded documents + user's uploaded documents)."""
        pool = self.get_pool()
        if user_id:
            query = """
                SELECT * FROM documents
                WHERE is_seeded = TRUE OR user_id = $1
                ORDER BY uploaded_at DESC;
            """
            async with pool.acquire() as conn:
                rows = await conn.fetch(query, user_id)
                return [Document(**dict(r)) for r in rows]
        else:
            query = "SELECT * FROM documents WHERE is_seeded = TRUE ORDER BY uploaded_at DESC;"
            async with pool.acquire() as conn:
                rows = await conn.fetch(query)
                return [Document(**dict(r)) for r in rows]


neon_db = NeonDatabase()


async def get_db() -> NeonDatabase:
    """FastAPI dependency for accessing database singleton."""
    return neon_db
