from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

import jwt
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from passlib.context import CryptContext

from app.config import settings
from app.db.models import AuthTokens, GuestPassResponse, User, UserSession
from app.db.neon import NeonDatabase, get_db

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
security_bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    """Hash password using Argon2."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against Argon2 hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> tuple[str, int]:
    """Create signed HS256 JWT access token, returning token and expiresIn seconds."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
        expires_in = int(expires_delta.total_seconds())
    else:
        expires_in = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        expire = datetime.now(UTC) + timedelta(seconds=expires_in)

    to_encode.update({"exp": expire, "iat": datetime.now(UTC)})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt, expires_in


def decode_access_token(token: str) -> dict:
    """Decode and validate signed JWT."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def user_to_session(user: User) -> UserSession:
    """Convert User model to UserSession contract schema."""
    return UserSession(
        id=str(user.id),
        email=user.email,
        name=user.name,
        avatarUrl=user.avatar_url,
        isGuest=user.is_guest,
        clientIp=user.client_ip,
        deviceId=user.device_id,
        createdAt=user.created_at.isoformat(),
        lastSeenAt=user.last_seen_at.isoformat(),
    )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Security(security_bearer),
    db: NeonDatabase = Depends(get_db),
) -> User:
    """FastAPI dependency to extract and verify authenticated user."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = decode_access_token(token)
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token subject",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_uuid = UUID(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token user ID",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await db.get_user_by_id(user_uuid)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    await db.update_user_last_seen(user.id)
    return user


async def issue_guest_pass(
    db: NeonDatabase, client_ip: str, device_id: str | None = None
) -> GuestPassResponse:
    """Issue or retrieve 1-Click Guest Pass token bound to client IP & device ID."""
    now = datetime.now(UTC)
    clean_device_id = device_id.strip() if device_id and device_id.strip() else None

    target_user: User | None = None
    if clean_device_id:
        target_user = await db.get_guest_by_device_id(clean_device_id)

    if target_user:
        await db.update_user_last_seen(
            target_user.id, client_ip=client_ip, device_id=clean_device_id
        )
        target_user.client_ip = client_ip
        target_user.last_seen_at = now
    else:
        assigned_device_id = clean_device_id or uuid4().hex[:16]
        guest_uuid = uuid4()
        guest_name = f"Guest Architect #{str(guest_uuid)[:6]}"
        user = User(
            id=guest_uuid,
            email=None,
            hashed_password=None,
            name=guest_name,
            avatar_url=None,
            is_guest=True,
            client_ip=client_ip,
            device_id=assigned_device_id,
            created_at=now,
            last_seen_at=now,
        )
        target_user = await db.create_user(user)

    bucket = await db.get_or_create_rate_limit(
        user_id=target_user.id,
        client_ip=client_ip,
        default_tokens=settings.GUEST_QUOTA_DEFAULT,
    )

    token_str, expires_in = create_access_token(
        data={"sub": str(target_user.id), "role": "guest", "is_guest": True},
        expires_delta=timedelta(minutes=settings.GUEST_TOKEN_EXPIRE_MINUTES),
    )

    return GuestPassResponse(
        user=user_to_session(target_user),
        tokens=AuthTokens(
            accessToken=token_str,
            tokenType="bearer",
            expiresIn=expires_in,
        ),
        quotaRemaining=bucket.tokens_remaining,
        bucketCapacity=bucket.bucket_capacity,
    )
