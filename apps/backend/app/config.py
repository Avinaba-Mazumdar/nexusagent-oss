from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    APP_NAME: str = "NexusAgent"
    VERSION: str = "0.1.0-alpha"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    NEON_DATABASE_URL: str = ""
    DATABASE_URL: str = ""

    JWT_SECRET_KEY: str = "nexusagent-dev-insecure-secret-key-change-in-production-12345"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    GUEST_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    GUEST_QUOTA_DEFAULT: int = 5
    HITL_APPROVAL_TIMEOUT_SECONDS: float = 30.0
    # Rate-limit keying: enable only when behind a trusted reverse proxy that
    # overwrites X-Forwarded-For. Default keys quota on the socket IP so clients
    # cannot rotate quota by header spoofing.
    TRUST_PROXY_HEADERS: bool = False

    # Accepted BYOK key prefixes (provider-recognizable formats only).
    BYOK_PREFIXES: list[str] = ["sk-", "AIza"]

    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    GOOGLE_CLIENT_ID: str = ""
    USE_SIMULATION_FALLBACK: bool = True

    model_config = SettingsConfigDict(
        env_file=(str(BACKEND_DIR / ".env"), ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
