from datetime import UTC, datetime, timedelta
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.config import settings
from app.core.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    issue_guest_pass,
    user_to_session,
    verify_password,
)
from app.db.models import (
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
    db: NeonDatabase = Depends(get_db),
):
    """Issue 1-Click Ephemeral Guest Pass token pre-loaded with quota."""
    client_ip = get_client_ip(request)
    return await issue_guest_pass(db, client_ip)


@router.post("/register", response_model=TokenResponse)
async def register(
    payload: RegisterRequest,
    db: NeonDatabase = Depends(get_db),
):
    """Register standard user with Argon2 password hashing."""
    existing_user = await db.get_user_by_email(payload.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists",
        )

    now = datetime.now(UTC)
    new_user = User(
        id=uuid4(),
        email=payload.email.lower().strip(),
        hashed_password=hash_password(payload.password),
        name=payload.name.strip(),
        avatar_url=None,
        is_guest=False,
        created_at=now,
        last_seen_at=now,
    )
    created_user = await db.create_user(new_user)

    token_str, expires_in = create_access_token(
        data={"sub": str(created_user.id), "role": "user", "is_guest": False},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return TokenResponse(
        accessToken=token_str,
        tokenType="bearer",
        expiresIn=expires_in,
        user=user_to_session(created_user),
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    db: NeonDatabase = Depends(get_db),
):
    """Authenticate email and password and return access token."""
    user = await db.get_user_by_email(payload.email.lower().strip())
    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    await db.update_user_last_seen(user.id)

    token_str, expires_in = create_access_token(
        data={"sub": str(user.id), "role": "user", "is_guest": user.is_guest},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return TokenResponse(
        accessToken=token_str,
        tokenType="bearer",
        expiresIn=expires_in,
        user=user_to_session(user),
    )


@router.get("/me")
async def get_current_user_profile(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: NeonDatabase = Depends(get_db),
):
    """Return active user profile and quota bucket status."""
    client_ip = get_client_ip(request)
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
    current_user: User = Depends(get_current_user),
):
    """Refresh JWT access token for currently authenticated session."""
    token_str, expires_in = create_access_token(
        data={"sub": str(current_user.id), "role": "guest" if current_user.is_guest else "user", "is_guest": current_user.is_guest},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return TokenResponse(
        accessToken=token_str,
        tokenType="bearer",
        expiresIn=expires_in,
        user=user_to_session(current_user),
    )
