import os
from pydantic import BaseModel

class Settings(BaseModel):
    # App Settings
    APP_URL: str = os.getenv("APP_URL", "https://lore.yourdomain.com")
    
    # GitHub App
    GITHUB_APP_ID: str = os.getenv("GITHUB_APP_ID", "")
    GITHUB_APP_PRIVATE_KEY_PATH: str = os.getenv("GITHUB_APP_PRIVATE_KEY_PATH", "")
    GITHUB_WEBHOOK_SECRET: str = os.getenv("GITHUB_WEBHOOK_SECRET", "")
    
    # Jira Settings
    JIRA_BASE_URL: str = os.getenv("JIRA_BASE_URL", "")
    JIRA_CLIENT_ID: str = os.getenv("JIRA_CLIENT_ID", "")
    JIRA_CLIENT_SECRET: str = os.getenv("JIRA_CLIENT_SECRET", "")
    
    # Slack Settings
    SLACK_BOT_TOKEN: str = os.getenv("SLACK_BOT_TOKEN", "")
    SLACK_SIGNING_SECRET: str = os.getenv("SLACK_SIGNING_SECRET", "")
    SLACK_NOTIFICATION_CHANNEL: str = os.getenv("SLACK_NOTIFICATION_CHANNEL", "#engineering-decisions")
    
    # Database Settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://lore:lorepass@postgres:5432/lore")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://redis:6379")
    
    # Cognee Settings
    COGNEE_MODE: str = os.getenv("COGNEE_MODE", "local")

settings = Settings()
