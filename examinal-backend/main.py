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
    contact, enrollment_request, message, refresh_token, login_attempt, password_reset_token
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
    from sqlalchemy import text

    # ── Idempotent column migrations (safe to re-run; errors are swallowed) ──
    _safe_alters = [
        "ALTER TABLE contact_messages ADD COLUMN is_read BOOLEAN DEFAULT FALSE",
        "ALTER TABLE contact_messages ADD COLUMN reply TEXT NULL",
        "ALTER TABLE contact_messages ADD COLUMN replied_at DATETIME NULL DEFAULT NULL",
        "ALTER TABLE users ADD COLUMN failed_login_count INT NOT NULL DEFAULT 0",
        "ALTER TABLE users ADD COLUMN locked_until DATETIME NULL DEFAULT NULL",
        "ALTER TABLE exams ADD COLUMN category VARCHAR(100) NOT NULL DEFAULT 'General'",
        "ALTER TABLE exams ADD COLUMN schedule_type VARCHAR(20) NOT NULL DEFAULT 'anytime'",
        "ALTER TABLE exams ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT FALSE",
        "ALTER TABLE exam_questions ADD COLUMN rubric TEXT NULL DEFAULT NULL",
        "ALTER TABLE exam_questions ADD COLUMN topic VARCHAR(255) NULL DEFAULT NULL",
        "ALTER TABLE exam_submissions ADD COLUMN results_published BOOLEAN NOT NULL DEFAULT FALSE",
        "UPDATE exams SET category = 'General' WHERE category IS NULL",
        "UPDATE exams SET schedule_type = 'anytime' WHERE schedule_type IS NULL",
        "UPDATE users SET failed_login_count = 0 WHERE failed_login_count IS NULL",
        "ALTER TABLE exams MODIFY COLUMN category VARCHAR(100) NOT NULL DEFAULT 'General'",
        "ALTER TABLE exams MODIFY COLUMN schedule_type VARCHAR(20) NOT NULL DEFAULT 'anytime'",
        "ALTER TABLE users MODIFY COLUMN failed_login_count INT NOT NULL DEFAULT 0",
    ]
    with engine.connect() as conn:
        for stmt in _safe_alters:
            try:
                conn.execute(text(stmt))
                conn.commit()
            except Exception:
                try:
                    conn.rollback()
                except Exception:
                    pass

    # Create new tables (refresh_tokens, login_attempts, password_reset_tokens, etc.)
    Base.metadata.create_all(bind=engine)

    # ── Database Cleanup ──
    from app.utils.maintenance import run_cleanup
    from app.database import SessionLocal
    with SessionLocal() as db:
        run_cleanup(db)

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
