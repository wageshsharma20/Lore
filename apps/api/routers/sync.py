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
        # Fetch up to 3 pages (90 PRs) to respect limits while being historical
        for page in range(1, 4):
            resp = await client.get(
                f"https://api.github.com/repos/{repo}/pulls?state=closed&per_page=30&page={page}",
                headers=headers,
            )
            if resp.status_code != 200:
                logger.error(f"Failed to fetch PRs for {repo} on page {page}: {resp.text}")
                break
            
            prs = resp.json()
            if not prs:
                break
            
            for pr in prs:
                if pr.get("merged_at"):
                    try:
                        # Call the async function directly to avoid asyncio.run() crash in event loop
                        from ..tasks.pr_tasks import _async_process_merged_pr
                        await _async_process_merged_pr(pr)
                    except Exception as e:
                        logger.error(f"Failed to process PR task: {e}")

@router.post("/sync")
async def trigger_github_sync(background_tasks: BackgroundTasks):
    github_token = get_stored_token("github")
    if not github_token:
        raise HTTPException(status_code=401, detail="GitHub not connected. Please connect in Settings.")
        
    from ..core.config_store import load_config
    config = load_config()
    repo = config.github_repo
    
    if not repo:
        raise HTTPException(status_code=400, detail="GitHub repository not configured. Please configure it in Settings.")
    
    background_tasks.add_task(fetch_historical_prs, repo, github_token)
    return {"status": "Sync triggered successfully"}
