import logging
import asyncio
import os
from typing import Dict, Any, List
from ..core.celery_app import celery_app
from ..services.github import set_pr_status, post_pr_blocker_comment, Conflict
from ..services.cognee_client import CogneeClient
from ..routers.auth import get_stored_token
from pydantic import BaseModel
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

class PRIntent(BaseModel):
    intents: List[str]
    technologies: List[str]
    categories: List[str]
    action: str
    risk_level: str

async def detect_pr_intent(pr_payload: dict) -> PRIntent:
    """
    Uses Gemini to extract the intent, technologies, and risk level from the PR.
    """
    title = pr_payload.get("title", "")
    body = pr_payload.get("body", "") or ""
    gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY", "dummy-key"))

    prompt = (
        f"Analyze this pull request and extract its intent.\n\n"
        f"PR Title: {title}\n"
        f"PR Description: {body[:2000]}\n\n"
        f"Extract: what technologies are being added/removed, what the action is (add/remove/update/refactor), "
        f"and the risk level (low/medium/high)."
    )

    try:
        response = await gemini_client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=PRIntent,
                temperature=0.1,
            )
        )
        return PRIntent.model_validate_json(response.text)
    except Exception as e:
        logger.error(f"Gemini PR intent detection failed: {e}. Falling back to basic extraction.")
        # Graceful fallback: extract technologies from title keywords
        text = f"{title} {body}".lower()
        technologies = []
        common_tech = ["tailwind", "aws", "gcp", "redux", "mongodb", "postgres", "typescript", "webpack", "vite"]
        for tech in common_tech:
            if tech in text:
                technologies.append(tech.capitalize())

        return PRIntent(
            intents=["modify codebase"],
            technologies=technologies or ["unknown"],
            categories=["general"],
            action="update",
            risk_level="medium"
        )

async def find_conflicts_in_graph(intent: PRIntent, repo: str) -> List[Conflict]:
    client = CogneeClient()
    conflicts = []

    for technology in intent.technologies:
        query = f"decision about {technology}"
        try:
            results = await client.search(query, search_type="GRAPH_COMPLETION")
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

            if is_deprecated:
                continue

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

    # Retrieve stored GitHub token
    github_token = get_stored_token("github")

    # 1. Set status to pending
    await set_pr_status(
        repo, sha, "pending",
        "Lore is checking decision history...",
        f"{app_url}/pr-check/{pr_number}",
        github_token=github_token
    )

    # 2. Detect intent using Gemini
    intent = await detect_pr_intent(pr_payload)

    # 3. Find conflicts in Cognee graph
    conflicts = await find_conflicts_in_graph(intent, repo)

    # 4. Set final status and post comment
    if not conflicts:
        await set_pr_status(repo, sha, "success", "No conflicting decisions found", github_token=github_token)
        return

    await set_pr_status(
        repo, sha, "failure",
        f"{len(conflicts)} past decision(s) may conflict with this PR",
        f"{app_url}/pr-check/{pr_number}",
        github_token=github_token
    )

    await post_pr_blocker_comment(repo, pr_number, conflicts, app_url, github_token=github_token)

@celery_app.task(name="run_pr_blocker_check")
def run_pr_blocker_check(pr_payload: Dict[str, Any]):
    logger.info(f"Task run_pr_blocker_check started for PR: {pr_payload.get('number')}")
    try:
        asyncio.run(_async_run_pr_blocker_check(pr_payload))
        logger.info(f"Task run_pr_blocker_check succeeded for PR: {pr_payload.get('number')}")
    except Exception as e:
        logger.error(f"Task run_pr_blocker_check failed: {e}")
        raise
