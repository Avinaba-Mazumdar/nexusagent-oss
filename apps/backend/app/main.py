import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes.health import router as health_router

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="NexusAgent (Archon) - Production-Grade Autonomous Orchestration Engine with Neon PostgreSQL 18 & LangGraph.",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(health_router, prefix="/api")


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint welcoming clients and referencing documentation."""
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "version": settings.VERSION,
        "docs_url": "/docs",
        "health_check": "/health",
    }


def start():
    """Entrypoint for running the server."""
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )


if __name__ == "__main__":
    start()
