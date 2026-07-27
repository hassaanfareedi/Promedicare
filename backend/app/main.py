"""FastAPI application entrypoint for ProMediCare AI."""

from fastapi import FastAPI

from app.core.config import settings

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug,
)


@app.get("/", tags=["Health"])
def root() -> dict[str, str]:
    """Return a simple service greeting."""
    return {"message": f"Welcome to {settings.app_name}"}


@app.get("/health", tags=["Health"])
def health_check() -> dict[str, str]:
    """Liveness probe for local runs and Docker health checks."""
    return {"status": "ok", "service": settings.app_name}
