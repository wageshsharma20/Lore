from fastapi import FastAPI
from pydantic import BaseModel
from routers import webhooks, auth

app = FastAPI(
    title="Lore API",
    description="The AI Memory Layer for Engineering Teams",
    version="1.0.0"
)

app.include_router(webhooks.router)
app.include_router(auth.router)

@app.get("/health")
async def health_check():
    """Health check endpoint to ensure API is running."""
    return {"status": "ok"}


