import os
import json
import logging
from typing import List, Optional
from pydantic import BaseModel, Field
import instructor
import litellm
from .github import PRData
from ..core.config import settings
from .jira import JiraTicket

logger = logging.getLogger(__name__)

# Fallback model for general use if not explicitly passed
DEFAULT_MODEL = "groq/llama-3.3-70b-versatile"

class ExtractedDecision(BaseModel):
    title: str = Field(description="A short, clear title of the architectural or technical decision.")
    reason_summary: str = Field(description="Why this decision was made. The problem being solved.")
    decision: str = Field(description="What was explicitly decided or implemented in this PR.")
    alternatives_considered: List[str] = Field(default_factory=list, description="Any alternatives discussed or rejected.")
    consequences: List[str] = Field(default_factory=list, description="Downstream effects or tradeoffs of this decision.")
    decision_author: str = Field(description="The true champion or primary author of this decision.")
    contributing_authors: List[str] = Field(default_factory=list, description="Other participants who contributed to this decision.")
    confidence_score: float = Field(ge=0.0, le=1.0, description="AI confidence score (0.0 to 1.0) that this is a true architectural decision.")

class ExtractedDecisions(BaseModel):
    decisions: List[ExtractedDecision]

def get_llm_client():
    """Returns an instructor-patched litellm async client."""
    # Litellm relies on environment variables like GROQ_API_KEY, OPENAI_API_KEY, etc.
    # It supports a completion function, which instructor wraps.
    client = instructor.from_litellm(litellm.acompletion)
    return client

async def detect_architectural_intent(pr: PRData) -> bool:
    """
    Fast and cheap intent detector to check if a PR likely contains architectural or significant technical decisions.
    """
    client = get_llm_client()
    prompt = (
        f"Does the following pull request seem to introduce architectural changes, new patterns, core library updates, "
        f"or significant technical decisions? Answer 'YES' or 'NO' only.\n\n"
        f"Title: {pr.title}\nDescription: {pr.body[:2000]}"
    )
    
    class IntentResponse(BaseModel):
        is_architectural: bool

    try:
        response = await client.chat.completions.create(
            model=DEFAULT_MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_model=IntentResponse,
            temperature=0.1
        )
        return response.is_architectural
    except Exception as e:
        logger.error(f"Intent detector failed: {e}")
        return True # Fallback to running full extraction if it fails

async def summarize_diff(diff: str) -> str:
    """
    Summarizes a large code diff to prevent blowing up the context window.
    """
    if len(diff) < 10000:
        return diff  # Optimization: Skip LLM call if diff is manageable

    client = get_llm_client()
    prompt = f"Please summarize the following code diff concisely, focusing only on structural, architectural, or significant logic changes:\n\n{diff[:50000]}"
    
    class SummaryResponse(BaseModel):
        summary: str

    try:
        response = await client.chat.completions.create(
            model=DEFAULT_MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_model=SummaryResponse,
            temperature=0.1
        )
        return response.summary
    except Exception as e:
        logger.error(f"Failed to summarize diff: {e}")
        return diff[:10000] # Fallback truncation

async def extract_decisions(
    pr: PRData, 
    jira_tickets: Optional[List[JiraTicket]] = None,
    slack_threads: Optional[List[str]] = None
) -> List[ExtractedDecision]:
    """
    Passes the PR diff, description, Jira context, and Slack threads to an LLM to extract structured architectural decisions.
    """
    client = get_llm_client()

    jira_context = "No Jira tickets linked."
    if jira_tickets:
        jira_context = "\n\n".join([
            f"Ticket: {t.key}\nSummary: {t.summary}\nDescription: {t.description}\nStatus: {t.status}\nPriority: {t.priority}\nAssignee: {t.assignee}\nReporter: {t.reporter}"
            for t in jira_tickets
        ])
        
    slack_context = "No Slack threads linked."
    if slack_threads:
        slack_context = "\n\n".join(slack_threads)

    # Use AI summarized diff if available, else raw
    diff_content = pr.diff_summary if getattr(pr, "diff_summary", "") else pr.diff

    system_prompt = (
        "You are an expert Principal Engineer. Your job is to analyze Pull Requests and extract "
        "Architecture Decision Records (ADRs). Ignore minor bug fixes or styling. Only extract "
        "meaningful technical, architectural, or library-level decisions. "
        "Use the PR description, the code diff, the business requirements from Jira tickets, and discussions from Slack threads to understand the full context. "
        "Crucially: Infer the true champion of the decision by evaluating the PR author, the Jira assignee, and key participants in the provided Slack threads."
    )
    
    prompt = f"""
    Please analyze the following PR and its associated business context to extract any architectural decisions.
    
    PR Title: {pr.title}
    PR Author: {pr.author}
    Description: {pr.body}
    
    === JIRA BUSINESS CONTEXT ===
    {jira_context}
    =============================
    
    === SLACK THREAD CONTEXT ===
    {slack_context}
    =============================
    
    === PR DIFF ===
    {diff_content[:10000]}
    ===============
    """

    try:
        response = await client.chat.completions.create(
            model=DEFAULT_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            response_model=ExtractedDecisions,
            temperature=0.1
        )
        
        parsed = response
        
        # Enforce defaults
        for d in parsed.decisions:
            if not d.decision_author:
                d.decision_author = pr.author
                
        return parsed.decisions

    except Exception as e:
        logger.error(f"Failed to extract decisions via LLM: {e}")
        return []
