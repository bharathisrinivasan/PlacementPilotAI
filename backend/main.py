"""
PlacementPilot AI — FastAPI Application Entry Point.

Main application with:
- CORS configuration for frontend
- API router registration
- Startup/shutdown lifecycle events
- Global error handling
- Logging configuration
"""

import logging
import os
import sys

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)-30s | %(levelname)-8s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# Validate critical configuration
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
if not GOOGLE_API_KEY or GOOGLE_API_KEY == "your_google_api_key_here":
    logger.warning(
        "⚠️  GOOGLE_API_KEY is not configured. "
        "Set it in your .env file to enable AI analysis."
    )

# Set the API key for Google GenAI
if GOOGLE_API_KEY and GOOGLE_API_KEY != "your_google_api_key_here":
    os.environ["GOOGLE_API_KEY"] = GOOGLE_API_KEY

# Create FastAPI app
app = FastAPI(
    title="PlacementPilot AI",
    description="AI-powered Career Concierge for college placement preparation. "
                "Analyzes resumes, identifies skill gaps, optimizes for ATS, "
                "and generates personalized career roadmaps.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Build the list of allowed origins — include localhost for dev + any env-configured URL
_allowed_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
]
# Add the configured frontend URL (e.g., Vercel deploy URL) if it differs from localhost
if FRONTEND_URL and FRONTEND_URL not in _allowed_origins:
    _allowed_origins.append(FRONTEND_URL)

# Also support wildcard pattern matching for Vercel preview deployments
_allow_origin_regex = r"https://.*\.(vercel\.app|netlify\.app|render\.com)$"

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_origin_regex=_allow_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────
# Global Exception Handler
# ──────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all exception handler for unhandled errors."""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "error_code": "INTERNAL_ERROR",
            "message": "An unexpected error occurred. Please try again.",
        },
    )


# ──────────────────────────────────────────────
# Lifecycle Events
# ──────────────────────────────────────────────

@app.on_event("startup")
async def startup_event() -> None:
    """Application startup handler."""
    logger.info("🚀 PlacementPilot AI starting up...")
    logger.info(f"   Frontend URL: {FRONTEND_URL}")
    logger.info(f"   API Key configured: {bool(GOOGLE_API_KEY and GOOGLE_API_KEY != 'your_google_api_key_here')}")
    logger.info(f"   Python version: {sys.version}")
    logger.info("✅ PlacementPilot AI is ready!")


@app.on_event("shutdown")
async def shutdown_event() -> None:
    """Application shutdown handler."""
    logger.info("👋 PlacementPilot AI shutting down...")


# ──────────────────────────────────────────────
# Register API Routes
# ──────────────────────────────────────────────

from backend.api.routes import router as api_router  # noqa: E402
app.include_router(api_router)


# ──────────────────────────────────────────────
# Root Endpoint
# ──────────────────────────────────────────────

@app.get("/")
async def root() -> dict:
    """Root endpoint with API information."""
    return {
        "name": "PlacementPilot AI",
        "version": "1.0.0",
        "description": "AI-powered Career Concierge API",
        "docs": "/docs",
        "health": "/api/health",
    }


# ──────────────────────────────────────────────
# Entry Point
# ──────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    host = os.getenv("BACKEND_HOST", "0.0.0.0")
    port = int(os.getenv("BACKEND_PORT", "8000"))

    uvicorn.run(
        "backend.main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info",
    )
