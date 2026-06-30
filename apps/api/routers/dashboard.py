from fastapi import APIRouter, Query, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os
import json
import logging
from google import genai
from google.genai import types

from ..services.cognee_client import CogneeClient
from ..services.teams import get_active_team_members
from .auth import verify_token

router = APIRouter(prefix="/api", tags=["Dashboard"])
logger = logging.getLogger(__name__)

class Decision(BaseModel):
    id: str
    title: str
    decision_type: str
    what: str
    reason: str = ""
    author: str
    contributors: List[str]
    date: str
    affected_systems: List[str]
    source_pr_url: str

class DecisionList(BaseModel):
    decisions: List[Decision]

class HeatmapSummary(BaseModel):
    total_decisions: int
    red_silos: int
    yellow_warnings: int
    green_healthy: int

# We'll use a very simple in-memory cache to avoid burning tokens on every reload during the hackathon demo.
# Note: In a real app this would be in Redis.
_DASHBOARD_CACHE = {
    "decisions": None
}

async def fetch_and_parse_decisions() -> List[Decision]:
    """Helper to fetch from Cognee and parse with Gemini."""
    if _DASHBOARD_CACHE["decisions"] is not None:
        return _DASHBOARD_CACHE["decisions"]

    client = CogneeClient()
    try:
        # Search for all architectural decisions broadly
        graph_results = await client.search("all architectural decisions", search_type="hybrid")
    except Exception as e:
        logger.error(f"Graph search failed for dashboard: {e}")
        return []

    if not graph_results:
        return []

    gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY", "dummy-key"))
    
    prompt = (
        f"Based on the following engineering decision records retrieved from our knowledge graph:\n\n"
        f"{json.dumps(graph_results, indent=2, default=str)}\n\n"
        f"Extract ALL decisions into an array of Decision objects. Ensure that you capture the true 'author' "
        f"and any 'contributors'. Make up a unique 'id' for each if none exists."
    )
    
    try:
        response = await gemini_client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=DecisionList,
                system_instruction="You are an AI assistant parsing architectural decisions for a dashboard.",
                temperature=0.1
            )
        )
        
        parsed = DecisionList.model_validate_json(response.text)
        _DASHBOARD_CACHE["decisions"] = parsed.decisions
        return parsed.decisions

    except Exception as e:
        logger.error(f"Gemini dashboard parsing failed: {e}")
        return []

@router.get("/summary", response_model=HeatmapSummary)
async def get_summary():
    """Returns the Heatmap Summary data dynamically calculated."""
    decisions = await fetch_and_parse_decisions()
    active_members = get_active_team_members()
    
    total = len(decisions)
    red = 0
    yellow = 0
    
    for d in decisions:
        if d.author not in active_members:
            red += 1
        elif not d.contributors:
            yellow += 1
            
    green = total - red - yellow
    if green < 0:
        green = 0
        
    return HeatmapSummary(
        total_decisions=total,
        red_silos=red,
        yellow_warnings=yellow,
        green_healthy=green
    )

@router.get("/decisions", response_model=List[Decision])
async def get_decisions(query: Optional[str] = None):
    """
    Returns all decisions, or searches if query is provided.
    """
    decisions = await fetch_and_parse_decisions()
    
    if query:
        query_lower = query.lower()
        decisions = [d for d in decisions if query_lower in d.title.lower() or query_lower in d.reason.lower()]
        
    return decisions

@router.post("/dashboard/refresh")
async def refresh_dashboard_cache(token_payload: dict = Depends(verify_token)):
    """Clear the simple dashboard cache to fetch fresh data."""
    _DASHBOARD_CACHE["decisions"] = None
    return {"status": "Cache cleared"}
