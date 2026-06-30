import logging
import asyncio
from typing import Dict, Any, List
from ..core.celery_app import celery_app
from ..services.github import set_pr_status, post_pr_blocker_comment, Conflict
from ..services.cognee_client import CogneeClient
from pydantic import BaseModel
import os

logger = logging.getLogger(__name__)

class PRIntent(BaseModel):
    intents: List[str]
    technologies: List[str]
    categories: List[str]
    action: str
    risk_level: str

async def detect_pr_intent(pr_payload: dict) -> PRIntent:
    # A mock intent detection logic for the hackathon
    # In reality, this would call Claude.
    body = pr_payload.get("body", "").lower()
    title = pr_payload.get("title", "").lower()
    
    technologies = []
    if "tailwind" in body or "tailwind" in title:
        technologies.append("Tailwind")
    if "aws" in body or "aws" in title:
        technologies.append("AWS")
        
    return PRIntent(
        intents=["add library"],
        technologies=technologies or ["GenericLib"],
        categories=["frontend"],
        action="add",
        risk_level="medium"
    )

async def find_conflicts_in_graph(intent: PRIntent, repo: str) -> List[Conflict]:
    client = CogneeClient()
    conflicts = []
    
    for technology in intent.technologies:
        # Search for past decisions involving this technology
        query = f"decision about {technology}"
        try:
            results = await client.search(
                query, 
                search_type="GRAPH_COMPLETION"
            )
        except Exception as e:
            logger.error(f"Graph search failed in PR Blocker: {e}")
            continue
        
        for result in results:
            if isinstance(result, str):
                continue
            
            why = result.get("why", result.get("reason_summary", "")).lower()
            what = result.get("what", result.get("decision", "")).lower()
            decision_type = result.get("decision_type", "").lower()
            is_deprecated = result.get("deprecated", False)
            
            # Skip if the decision has been explicitly deprecated by the team
            if is_deprecated:
                continue
            
            # Check: was this technology previously REJECTED or REMOVED?
            if "removed" in why or "rejected" in what or decision_type == "removal":
                conflicts.append(Conflict(
                    past_decision=result,
                    conflicting_technology=technology,
                    severity="high" if intent.action == "add" else "medium"
                ))
    
    return conflicts

async def _async_run_pr_blocker_check(pr_payload: dict):
    pr_number = pr_payload.get("number")
    repo = pr_payload.get("base", {}).get("repo", {}).get("full_name", "unknown/repo")
    sha = pr_payload.get("head", {}).get("sha", "unknown_sha")
    app_url = os.getenv("APP_URL", "http://localhost:3000")
    
    # 1. Set status to pending
    await set_pr_status(
        repo, sha, "pending",
        "Lore is checking decision history...",
        f"{app_url}/pr-check/{pr_number}"
    )
    
    # 2. Detect intent
    intent = await detect_pr_intent(pr_payload)
    
    # 3. Find conflicts in graph
    conflicts = await find_conflicts_in_graph(intent, repo)
    
    # 4. Set final status
    if not conflicts:
        await set_pr_status(repo, sha, "success", "No conflicting decisions found")
        return
        
    # Has conflicts - set failure and post comment
    await set_pr_status(
        repo, sha, "failure",
        f"{len(conflicts)} past decision(s) may conflict with this PR",
        f"{app_url}/pr-check/{pr_number}"
    )
    
    await post_pr_blocker_comment(repo, pr_number, conflicts, app_url)

@celery_app.task(name="run_pr_blocker_check")
def run_pr_blocker_check(pr_payload: Dict[str, Any]):
    logger.info(f"Task run_pr_blocker_check started for PR: {pr_payload.get('number')}")
    try:
        asyncio.run(_async_run_pr_blocker_check(pr_payload))
        logger.info(f"Task run_pr_blocker_check succeeded for PR: {pr_payload.get('number')}")
    except Exception as e:
        logger.error(f"Task run_pr_blocker_check failed: {e}")
        raise
