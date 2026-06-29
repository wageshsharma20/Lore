from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from .routers import webhooks, auth, chat, adrs, ask
import logging

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Lore API",
    description="The AI Memory Layer for Engineering Teams",
    version="1.0.0",
    docs_url="/docs"
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

@app.get("/health")
async def health_check():
    """Health check endpoint to ensure API is running."""
    return {"status": "ok"}


