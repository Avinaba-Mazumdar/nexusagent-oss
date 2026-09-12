-- ==============================================================================
-- NexusAgent Core Database Schema Migration
-- Target: Neon Serverless PostgreSQL 18 with pgvector & full-text tsvector
-- Version: 20260901000000
-- ==============================================================================

-- Enable necessary extensions in Neon PostgreSQL 18
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 1. Users Table (FastAPI Backend Authentication & Ephemeral Guests)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    hashed_password VARCHAR(255),
    name VARCHAR(255) NOT NULL DEFAULT 'Guest Reviewer',
    avatar_url TEXT,
    is_guest BOOLEAN NOT NULL DEFAULT TRUE,
    client_ip VARCHAR(45),
    device_id VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_device_id ON users(device_id);

-- 2. Token-Bucket Rate Limiter State
CREATE TABLE IF NOT EXISTS rate_limit_buckets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    client_ip VARCHAR(45) NOT NULL,
    tokens_remaining INT NOT NULL DEFAULT 5,
    bucket_capacity INT NOT NULL DEFAULT 5,
    last_replenished_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_ip UNIQUE (user_id, client_ip)
);

-- 3. Document Metadata Table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    sha256_hash VARCHAR(64) NOT NULL,
    total_chunks INT NOT NULL DEFAULT 0,
    storage_path TEXT,
    is_seeded BOOLEAN NOT NULL DEFAULT FALSE,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Document Chunks with pgvector & tsvector
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1536), -- Dense vector representation
    search_vector TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- High-Performance Indexes
CREATE INDEX IF NOT EXISTS idx_chunks_embedding_hnsw
    ON document_chunks USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_chunks_search_vector
    ON document_chunks USING GIN (search_vector);

CREATE INDEX IF NOT EXISTS idx_chunks_document_id
    ON document_chunks(document_id);

-- 5. Conversations
CREATE TABLE IF NOT EXISTS agent_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL DEFAULT 'New Architectural Inquiry',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES agent_conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    plan_trace JSONB,
    reflection_summary JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. OWASP ASI-10: Tool Execution Audit Logs
CREATE TABLE IF NOT EXISTS tool_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES agent_conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    tool_name VARCHAR(100) NOT NULL,
    mcp_server VARCHAR(100) NOT NULL DEFAULT 'nexusagent-internal',
    input_args JSONB NOT NULL,
    output_summary JSONB,
    duration_ms INT NOT NULL DEFAULT 0,
    hitl_approved BOOLEAN NOT NULL DEFAULT TRUE,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. Citations Mapping
CREATE TABLE IF NOT EXISTS citations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    chunk_id UUID NOT NULL REFERENCES document_chunks(id) ON DELETE CASCADE,
    start_line INT,
    end_line INT,
    relevance_score REAL NOT NULL DEFAULT 0.0
);
