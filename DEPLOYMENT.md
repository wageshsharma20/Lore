# Production Deployment Guide (Railway)

This guide walks you through deploying the Lore backend to Railway for our Day 10 Demo.

## 1. Prerequisites
- A Railway account (https://railway.app/)
- The GitHub repository connected to your Railway account.

## 2. Setting Up the Project & Databases
1. Create a New Project in Railway.
2. Add a **PostgreSQL** database from the Railway marketplace.
3. Add a **Redis** instance from the Railway marketplace.
4. If using Cognee Cloud, ensure you have your `COGNEE_API_KEY`. If self-hosting Neo4j, create a free AuraDB instance (https://neo4j.com/cloud/aura/).

## 3. Deploying the Backend Services
We will create three separate services in Railway linked to the same GitHub repository, each running a different command.

### Service 1: API (FastAPI)
1. Add a new service -> **Deploy from GitHub repo** -> Select `lore`.
2. Go to Settings > Service > Start Command and enter: 
   `uvicorn apps.api.main:app --host 0.0.0.0 --port $PORT --workers 4`
3. Go to Variables and click **Add Reference** to pull in `DATABASE_URL` (from Postgres) and `REDIS_URL` (from Redis). 
   *Note: Set `CELERY_BROKER_URL` to the value of `REDIS_URL`.*
4. Add the rest of the secrets from `.env.prod.example` (e.g. `ANTHROPIC_API_KEY`, `GITHUB_TOKEN`).
5. Generate a public domain for this service in the Settings tab.

### Service 2: Celery Worker
1. Add another service -> **Deploy from GitHub repo** -> Select `lore`.
2. Go to Settings > Service > Start Command and enter:
   `celery -A apps.api.tasks worker --concurrency 4 --loglevel=info`
3. Add the exact same variables you added to the API service.

### Service 3: Celery Beat (Nightly Heatmap)
1. Add a third service -> **Deploy from GitHub repo** -> Select `lore`.
2. Go to Settings > Service > Start Command and enter:
   `celery -A apps.api.tasks beat --loglevel=info`
3. Add the exact same variables you added to the API service.

## 4. Final Wiring
1. Take the public URL generated for your API service (e.g., `https://lore-production.up.railway.app`).
2. Go to your **GitHub Repository Settings > Webhooks** and update the Payload URL to `https://lore-production.up.railway.app/webhooks/github`.
3. Go to your **Slack App Settings** and point any interactivity/slash command URLs to your new production domain.
