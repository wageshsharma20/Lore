from fastapi import APIRouter, HTTPException, BackgroundTasks
import httpx
import logging
from typing import Dict, Any
from ..tasks.pr_tasks import process_merged_pr_task
from .auth import get_stored_token

router = APIRouter(prefix="/api", tags=["Sync"])
logger = logging.getLogger(__name__)

async def fetch_historical_prs(repo: str, token: str):
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github.v3+json",
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        # Fetch last 30 closed/merged PRs
        resp = await client.get(
            f"https://api.github.com/repos/{repo}/pulls?state=closed&per_page=30",
            headers=headers,
        )
        if resp.status_code != 200:
            logger.error(f"Failed to fetch PRs for {repo}: {resp.text}")
            return
        
        prs = resp.json()
        for pr in prs:
            if pr.get("merged_at"):
                # Pass directly to the celery task
                try:
                    process_merged_pr_task.delay(pr)
                except Exception as e:
                    logger.error(f"Failed to queue PR task: {e}")

@router.post("/sync")
async def trigger_github_sync(background_tasks: BackgroundTasks):
    github_token = get_stored_token("github")
    if not github_token:
        raise HTTPException(status_code=401, detail="GitHub not connected. Please connect in Settings.")
        
    import os
    repo_owner = os.getenv("GITHUB_REPO_OWNER", "tarot-club-hackathons")
    repo_name = os.getenv("GITHUB_REPO_NAME", "lore")
    repo = f"{repo_owner}/{repo_name}"
    
    background_tasks.add_task(fetch_historical_prs, repo, github_token)
    return {"status": "Sync triggered successfully"}
