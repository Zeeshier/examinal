"""
Examinal – AI‑powered assessment platform.
Entry‑point: uvicorn main:app --reload
"""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.middleware.activity_logger import ActivityLoggerMiddleware

# ── Import every model so Base.metadata knows them ──
from app.models import (
    user, course, content, exam, question, submission, activity_log,
    enrollment_request, message
)

from app.routers import (
    auth, users, courses, content as content_router,
    questions, exams, submissions, grading, analytics, admin,
    enrollment_requests, messages
)
from app.routers.contact import router as contact_router


@asynccontextmanager
async def lifespan(application: FastAPI):
    # ── Startup ──
    Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
    Path(settings.VECTOR_STORE_DIR).mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(bind=engine)
    yield
    # ── Shutdown ──


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI‑powered end‑to‑end assessment platform",
    lifespan=lifespan,
)

# ── Global Error Handling ──
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "type": "error"}
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    print(f"CRITICAL ERROR: {exc}")
    import traceback
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected server error occurred. Please contact support.",
            "type": "error"
        }
    )

# ── Custom middleware ──
app.add_middleware(ActivityLoggerMiddleware)

# ── CORS ──
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# ── Routers ──
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(courses.router)
app.include_router(content_router.router)
app.include_router(questions.router)
app.include_router(exams.router)
app.include_router(submissions.router)
app.include_router(grading.router)
app.include_router(analytics.router)
app.include_router(admin.router)
app.include_router(contact_router)
app.include_router(enrollment_requests.router)
app.include_router(messages.router)


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "healthy", "app": settings.APP_NAME, "version": settings.APP_VERSION}
