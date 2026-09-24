from datetime import UTC, datetime, timedelta
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.config import settings
from app.core.auth import (
    DUMMY_ARGON2_HASH,
    create_access_token,
    get_current_user,
    hash_password,
    issue_guest_pass,
    user_to_session,
    verify_google_token,
    verify_password,
)
from app.db.models import (
    GoogleAuthRequest,
    GuestPassRequest,
    GuestPassResponse,
    LoginRequest,
    QuotaStatus,
    RegisterRequest,
    TokenResponse,
    User,
)
from app.db.neon import NeonDatabase, get_db

router = APIRouter(prefix="/auth", tags=["Authentication"])


def get_client_ip(request: Request) -> str:
    """Extract client IP from headers or client connection."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"


@router.post("/guest", response_model=GuestPassResponse)
async def create_guest_pass(
    request: Request,
    payload: GuestPassRequest | None = None,
    db: NeonDatabase = Depends(get_db),
):
    """Issue 1-Click Ephemeral Guest Pass token pre-loaded with quota."""
    client_ip = get_client_ip(request)
    device_id = payload.deviceId if payload else None
    return await issue_guest_pass(db, client_ip, device_id)


@router.post("/register", response_model=TokenResponse)
async def register(
    payload: RegisterRequest,
    request: Request,
    db: NeonDatabase = Depends(get_db),
):
    """Register standard user with Argon2 password hashing."""
    existing_user = await db.get_user_by_email(payload.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email address already exists.",
        )

    client_ip = get_client_ip(request)
    now = datetime.now(UTC)
    new_user = User(
        id=uuid4(),
        email=payload.email,
        hashed_password=hash_password(payload.password),
        name=payload.name,
        avatar_url=None,
        is_guest=False,
        client_ip=client_ip,
        created_at=now,
        last_seen_at=now,
    )
    created_user = await db.create_user(new_user)

    bucket = await db.get_or_create_rate_limit(
        user_id=created_user.id,
        client_ip=client_ip,
        default_tokens=25,
    )

    token_str, expires_in = create_access_token(
        data={"sub": str(created_user.id), "role": "user", "is_guest": False},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return TokenResponse(
        accessToken=token_str,
        tokenType="bearer",
        expiresIn=expires_in,
        user=user_to_session(created_user),
        quotaRemaining=bucket.tokens_remaining,
        bucketCapacity=bucket.bucket_capacity,
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    request: Request,
    db: NeonDatabase = Depends(get_db),
):
    """Authenticate email and password and return access token with timing-attack defense."""
    user = await db.get_user_by_email(payload.email)
    if not user or not user.hashed_password:
        # Perform constant-time verification with dummy hash to prevent user enumeration
        verify_password(payload.password, DUMMY_ARGON2_HASH)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    client_ip = get_client_ip(request)
    await db.update_user_last_seen(user.id, client_ip)

    bucket = await db.get_or_create_rate_limit(
        user_id=user.id,
        client_ip=client_ip,
        default_tokens=25,
    )

    token_str, expires_in = create_access_token(
        data={"sub": str(user.id), "role": "user", "is_guest": user.is_guest},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return TokenResponse(
        accessToken=token_str,
        tokenType="bearer",
        expiresIn=expires_in,
        user=user_to_session(user),
        quotaRemaining=bucket.tokens_remaining,
        bucketCapacity=bucket.bucket_capacity,
    )


@router.post("/google", response_model=TokenResponse)
async def google_auth(
    payload: GoogleAuthRequest,
    request: Request,
    db: NeonDatabase = Depends(get_db),
):
    """Authenticate or register user via verified Google ID token."""
    google_profile = await verify_google_token(payload.credential)

    client_ip = get_client_ip(request)
    user = await db.upsert_google_user(
        email=google_profile["email"],
        name=google_profile["name"],
        avatar_url=google_profile.get("picture"),
        client_ip=client_ip,
    )

    bucket = await db.get_or_create_rate_limit(
        user_id=user.id,
        client_ip=client_ip,
        default_tokens=25,
    )

    token_str, expires_in = create_access_token(
        data={"sub": str(user.id), "role": "user", "is_guest": False},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return TokenResponse(
        accessToken=token_str,
        tokenType="bearer",
        expiresIn=expires_in,
        user=user_to_session(user),
        quotaRemaining=bucket.tokens_remaining,
        bucketCapacity=bucket.bucket_capacity,
    )


@router.get("/me")
async def get_current_user_profile(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: NeonDatabase = Depends(get_db),
):
    """Return active user profile and quota bucket status."""
    client_ip = get_client_ip(request)
    await db.update_user_last_seen(current_user.id, client_ip)
    current_user.client_ip = client_ip

    bucket = await db.get_or_create_rate_limit(
        user_id=current_user.id,
        client_ip=client_ip,
        default_tokens=settings.GUEST_QUOTA_DEFAULT if current_user.is_guest else 25,
    )

    return {
        "user": user_to_session(current_user),
        "quota": QuotaStatus(
            tokensRemaining=bucket.tokens_remaining,
            bucketCapacity=bucket.bucket_capacity,
            resetMinutes=60,
        ),
    }


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: NeonDatabase = Depends(get_db),
):
    """Refresh JWT access token for currently authenticated session."""
    client_ip = get_client_ip(request)
    bucket = await db.get_or_create_rate_limit(
        user_id=current_user.id,
        client_ip=client_ip,
        default_tokens=settings.GUEST_QUOTA_DEFAULT if current_user.is_guest else 25,
    )

    token_str, expires_in = create_access_token(
        data={
            "sub": str(current_user.id),
            "role": "guest" if current_user.is_guest else "user",
            "is_guest": current_user.is_guest,
        },
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return TokenResponse(
        accessToken=token_str,
        tokenType="bearer",
        expiresIn=expires_in,
        user=user_to_session(current_user),
        quotaRemaining=bucket.tokens_remaining,
        bucketCapacity=bucket.bucket_capacity,
    )
