from datetime import UTC, datetime
from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field


def utc_now() -> datetime:
    return datetime.now(UTC)


class User(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID = Field(default_factory=uuid4)
    email: str | None = None
    hashed_password: str | None = None
    name: str = "Guest Reviewer"
    avatar_url: str | None = None
    is_guest: bool = True
    client_ip: str | None = None
    device_id: str | None = None
    created_at: datetime = Field(default_factory=utc_now)
    last_seen_at: datetime = Field(default_factory=utc_now)


class RateLimitBucket(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID = Field(default_factory=uuid4)
    user_id: UUID
    client_ip: str
    tokens_remaining: int = 5
    bucket_capacity: int = 5
    last_replenished_at: datetime = Field(default_factory=utc_now)


class Document(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID = Field(default_factory=uuid4)
    user_id: UUID
    filename: str
    mime_type: str
    sha256_hash: str
    total_chunks: int = 0
    storage_path: str | None = None
    is_seeded: bool = False
    uploaded_at: datetime = Field(default_factory=utc_now)


class DocumentChunk(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID = Field(default_factory=uuid4)
    document_id: UUID
    chunk_index: int
    content: str
    embedding: list[float] | None = None
    search_vector: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=utc_now)


class AgentConversation(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID = Field(default_factory=uuid4)
    user_id: UUID
    title: str = "New Architectural Inquiry"
    created_at: datetime = Field(default_factory=utc_now)


class Message(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID = Field(default_factory=uuid4)
    conversation_id: UUID
    role: str
    content: str
    plan_trace: dict[str, Any] | None = None
    reflection_summary: dict[str, Any] | None = None
    created_at: datetime = Field(default_factory=utc_now)


class ToolAuditLog(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID = Field(default_factory=uuid4)
    conversation_id: UUID | None = None
    user_id: UUID | None = None
    tool_name: str
    mcp_server: str = "nexusagent-internal"
    input_args: dict[str, Any] = Field(default_factory=dict)
    output_summary: dict[str, Any] | None = None
    duration_ms: int = 0
    hitl_approved: bool = True
    executed_at: datetime = Field(default_factory=utc_now)


class Citation(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID = Field(default_factory=uuid4)
    message_id: UUID
    chunk_id: UUID
    start_line: int | None = None
    end_line: int | None = None
    relevance_score: float = 0.0


# Wire Schemas matching packages/contracts/src/auth.ts


class UserSession(BaseModel):
    id: str
    email: str | None = None
    name: str
    avatarUrl: str | None = None
    isGuest: bool
    clientIp: str | None = None
    deviceId: str | None = None
    createdAt: str
    lastSeenAt: str


class GuestPassRequest(BaseModel):
    deviceId: str | None = None


class AuthTokens(BaseModel):
    accessToken: str
    tokenType: str = "bearer"
    expiresIn: int


class GuestPassResponse(BaseModel):
    user: UserSession
    tokens: AuthTokens
    quotaRemaining: int
    bucketCapacity: int


class QuotaStatus(BaseModel):
    tokensRemaining: int
    bucketCapacity: int
    resetMinutes: int


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str


class TokenResponse(BaseModel):
    accessToken: str
    tokenType: str = "bearer"
    expiresIn: int
    user: UserSession
