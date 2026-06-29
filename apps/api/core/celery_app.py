from celery import Celery
import os

# Default to localhost redis, but can be overridden by env
redis_url = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "lore_tasks",
    broker=redis_url,
    backend=redis_url,
    include=["apps.api.tasks.pr_tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)
