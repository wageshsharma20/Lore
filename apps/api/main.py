from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from .routers import webhooks, auth, chat, adrs, ask, decisions, dashboard, sync
import logging

import logging
import sentry_sdk
import os

logger = logging.getLogger(__name__)

sentry_dsn = os.getenv("SENTRY_DSN")
if sentry_dsn:
    sentry_sdk.init(
        dsn=sentry_dsn,
        traces_sample_rate=1.0,
        profiles_sample_rate=1.0,
    )

app = FastAPI(
    title="Lore API",
    description="The AI Memory Layer for Engineering Teams",
    version="1.0.0",
    docs_url="/docs"
)

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.exceptions import RequestValidationError
from fastapi import HTTPException

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Ensure HTTP exceptions follow the structured JSON response."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": True, "code": exc.status_code, "detail": exc.detail}
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Ensure all unhandled API errors return a structured JSON response."""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": True, "code": 500, "detail": str(exc)}
    )

app.include_router(webhooks.router)
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(adrs.router)
app.include_router(ask.router)
app.include_router(decisions.router)
app.include_router(dashboard.router)
app.include_router(sync.router)

@app.get("/health")
async def health_check():
    """Health check endpoint to ensure API is running."""
    return {"status": "ok"}
