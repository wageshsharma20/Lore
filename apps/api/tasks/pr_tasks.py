import asyncio
import logging
from typing import Dict, Any
from ..core.celery_app import celery_app
from ..services.github import PRData
from ..services.gemini_service import detect_architectural_intent, extract_decisions
from ..services.cognee_client import CogneeClient

logger = logging.getLogger(__name__)

async def _async_process_merged_pr(pr_payload: Dict[str, Any]):
    logger.info(f"Starting async processing for PR #{pr_payload.get('number')}")
    
    # Map webhook payload to our internal PRData schema
    # (Handling a simplified payload for the hackathon)
    pr_data = PRData(
        title=pr_payload.get("title", "Unknown Title"),
        body=pr_payload.get("body", "") or "No description",
        author=pr_payload.get("user", {}).get("login", "unknown"),
        diff="Mock diff for processing...",  # In reality, fetch from PR diff_url
        diff_summary="",
        pr_number=pr_payload.get("number", 0),
        commits=[],
        changed_files=[],
        reviewers=[],
        labels=[],
        linked_issues=[],
        jira_keys=[],
        slack_thread_urls=[],
        merged_at=pr_payload.get("merged_at", ""),
        repo_full_name=pr_payload.get("repo", {}).get("full_name", "")
    )

    # 1. Intent Detection
    is_architectural = await detect_architectural_intent(pr_data)
    if not is_architectural:
        logger.info(f"PR #{pr_payload.get('number')} skipped. No architectural intent detected.")
        return {"status": "skipped", "reason": "No architectural intent"}

    logger.info(f"PR #{pr_payload.get('number')} has architectural intent. Extracting decisions...")

    # 2. Extract Decisions
    # Note: jira_tickets and slack_threads would be fetched here in a real scenario
    decisions = await extract_decisions(pr_data, jira_tickets=[], slack_threads=[])
    
    if not decisions:
        logger.info("No explicit decisions found by the extractor.")
        return {"status": "success", "decisions_extracted": 0}

    # 3. Write to DB via CogneeClient
    client = CogneeClient()
    saved_count = 0
    
    for decision in decisions:
        # Guaranteeing the specific schema requirement for DB output
        # Using structured dicts that map to nodes to implicitly create MADE_BY edge
        db_payload = {
            "title": decision.title,
            "decision": decision.decision,
            "reason_summary": decision.reason_summary,
            "made_by": {"type": "Developer", "name": decision.decision_author},
            "contributing_authors": [{"type": "Developer", "name": c} for c in decision.contributing_authors],
            "alternatives_considered": decision.alternatives_considered,
            "consequences": decision.consequences,
            "confidence_score": decision.confidence_score,
            "source_pr": pr_payload.get("html_url")
        }
        
        try:
            await client.add(db_payload, dataset_id="architecture_decisions")
            saved_count += 1
        except Exception as e:
            logger.error(f"Failed to save decision to Cognee DB: {e}")

    # Immediately cognify the dataset after adding decisions
    try:
        await client.cognify(dataset_id="architecture_decisions")
        logger.info(f"Cognify triggered successfully for PR #{pr_payload.get('number')}")
    except Exception as e:
        logger.error(f"Failed to cognify architecture_decisions: {e}")

    logger.info(f"Successfully processed PR #{pr_payload.get('number')} and saved {saved_count} decisions.")
    return {"status": "success", "decisions_extracted": saved_count}


@celery_app.task(name="process_merged_pr_task")
def process_merged_pr_task(pr_payload: Dict[str, Any]):
    """
    Celery task triggered when a PR is merged.
    Runs the intent detector and extracts ADRs.
    """
    logger.info(f"Task process_merged_pr_task started for PR: {pr_payload.get('title')}")
    try:
        result = asyncio.run(_async_process_merged_pr(pr_payload))
        logger.info(f"Task process_merged_pr_task succeeded: {result}")
        return result
    except Exception as e:
        logger.error(f"Task process_merged_pr_task failed: {e}")
        raise
