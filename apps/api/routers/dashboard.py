from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/api", tags=["Dashboard"])

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

class HeatmapSummary(BaseModel):
    total_decisions: int
    red_silos: int
    yellow_warnings: int
    green_healthy: int

@router.get("/summary", response_model=HeatmapSummary)
async def get_summary():
    """Returns the Heatmap Summary data for the dashboard."""
    # Mock data that corresponds to the initial state described
    return HeatmapSummary(
        total_decisions=5,
        red_silos=1,
        yellow_warnings=2,
        green_healthy=2
    )

@router.get("/decisions", response_model=List[Decision])
async def get_decisions(query: Optional[str] = None):
    """
    Returns all decisions, or searches if query is provided.
    This fulfills the GET /api/decisions and GET /api/decisions?query=... 
    expected by the frontend.
    """
    # Fallback mock data for dashboard rendering
    decisions = [
        Decision(
            id="dec_1",
            title="Use PostgreSQL instead of MongoDB",
            decision_type="Database",
            what="Use PostgreSQL",
            reason="Need ACID compliance for billing.",
            author="alice",
            contributors=[],
            date="2023-10-01",
            affected_systems=["billing"],
            source_pr_url="https://github.com/org/repo/pull/1"
        ),
        Decision(
            id="dec_2",
            title="Remove Lodash",
            decision_type="Library",
            what="Remove Lodash",
            reason="Bundle size issues.",
            author="dave",
            contributors=["bob"],
            date="2023-10-05",
            affected_systems=["frontend"],
            source_pr_url="https://github.com/org/repo/pull/2"
        ),
        Decision(
            id="dec_3",
            title="Adopt Tailwind CSS",
            decision_type="Framework",
            what="Use Tailwind CSS",
            reason="Faster prototyping and utility classes.",
            author="ghost_user",
            contributors=[],
            date="2023-10-10",
            affected_systems=["ui-components"],
            source_pr_url="https://github.com/org/repo/pull/3"
        )
    ]
    
    if query:
        query_lower = query.lower()
        decisions = [d for d in decisions if query_lower in d.title.lower() or query_lower in d.reason.lower()]
        
    return decisions
