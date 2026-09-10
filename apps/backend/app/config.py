from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "NexusAgent (Archon)"
    VERSION: str = "0.1.0-alpha"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Server & CORS
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Neon PostgreSQL 18
    NEON_DATABASE_URL: str = ""
    DATABASE_URL: str = ""

    # Security & Auth
    JWT_SECRET_KEY: str = "archon-dev-insecure-secret-key-change-in-production-12345"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    GUEST_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    GUEST_QUOTA_DEFAULT: int = 5

    # AI Providers & Fallbacks
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    USE_SIMULATION_FALLBACK: bool = True

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
