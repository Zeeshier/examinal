"""
Examinal API - Main Entry Point
FastAPI application with CORS middleware configuration.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.endpoints import health, auth, exams, upload, ai, students
from app.db.session import init_db

# Initialize FastAPI application
app = FastAPI(
    title="Examinal API",
    description="AI-powered examination platform with automated question generation and grading",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(exams.router, prefix="/api/exams", tags=["Exams"])
app.include_router(upload.router, prefix="/api", tags=["Upload"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI"])
app.include_router(students.router, prefix="/api/students", tags=["Students"])


@app.on_event("startup")
async def startup_event():
    """Initialize resources on application startup."""
    print("🚀 Examinal API starting up...")
    # Initialize database tables
    init_db()


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup resources on application shutdown."""
    print("👋 Examinal API shutting down...")
