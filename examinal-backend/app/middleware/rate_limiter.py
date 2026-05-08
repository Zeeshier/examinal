import time
import asyncio
from collections import defaultdict
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

class SimpleRateLimiterMiddleware(BaseHTTPMiddleware):
    """
    A naive in-memory fixed-window rate limiter.
    Limits each IP (and user ID if authenticated) to a certain number of requests per window.
    Not suitable for multi-worker production without Redis, but provides basic API abuse protection.
    """
    def __init__(self, app, max_requests: int = 100, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        # dict: { key: {"count": int, "reset_time": float} }
        self.storage = defaultdict(lambda: {"count": 0, "reset_time": 0.0})
        self._lock = asyncio.Lock()

    def _get_client_key(self, request: Request) -> str:
        # Use Authorization header token hash or IP as key
        auth_header = request.headers.get("authorization", "")
        if auth_header.startswith("Bearer "):
            # We don't decode the JWT here for performance; using the token itself as identifier
            return f"user:{hash(auth_header)}"
        
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return f"ip:{forwarded.split(',')[0].strip()}"
        return f"ip:{request.client.host if request.client else 'unknown'}"

    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for static files/uploads
        if request.url.path.startswith("/uploads") or request.url.path == "/health":
            return await call_next(request)

        key = self._get_client_key(request)
        now = time.time()

        async with self._lock:
            record = self.storage[key]
            if now > record["reset_time"]:
                # Window expired, reset
                record["count"] = 1
                record["reset_time"] = now + self.window_seconds
            else:
                record["count"] += 1
                if record["count"] > self.max_requests:
                    return JSONResponse(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        content={
                            "detail": "Rate limit exceeded. Please try again later.",
                            "type": "rate_limit_error",
                            "retry_after": int(record["reset_time"] - now)
                        },
                        headers={"Retry-After": str(int(record["reset_time"] - now))}
                    )

        response = await call_next(request)
        return response
