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

@router.get("/members/{member_id}/active", response_model=bool)
async def is_active_member(member_id: str):
    """Check if a team member is currently active."""
    active_members = get_active_team_members()
    clean_id = member_id.replace("@", "")
    return clean_id in active_members


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

class ModuleRiskFactors(BaseModel):
    codeChurn: float
    complexity: float
    testCoverage: float
    issueVolume: float
    dependencyDepth: float
    age: float

class ModuleRiskData(BaseModel):
    id: str
    name: str
    size: int
    factors: ModuleRiskFactors
    loneContributor: Optional[str] = None
    overallRisk: int

class PRConflict(BaseModel):
    decision_title: str
    decision_author: str
    decision_date: str
    reason: str
    severity: str

class PRCheckResult(BaseModel):
    pr_number: str
    status: str           # "blocked" | "passed" | "unknown"
    conflicts: List[PRConflict]
    checked_at: str

# Risk weights — must match frontend riskEngine.ts
RISK_WEIGHTS = {
    "codeChurn": 0.25,
    "testCoverage": 0.20,
    "complexity": 0.15,
    "issueVolume": 0.15,
    "dependencyDepth": 0.15,
    "age": 0.10,
}

# Simple in-memory decision cache to avoid burning tokens on every reload.
# In production, this would be Redis.
_DASHBOARD_CACHE: dict = {"decisions": None}

async def fetch_and_parse_decisions() -> List[Decision]:
    """Helper to fetch from Cognee and parse with Gemini. Uses in-memory cache."""
    if _DASHBOARD_CACHE["decisions"] is not None:
        return _DASHBOARD_CACHE["decisions"]

    client = CogneeClient()
    try:
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
    """Returns the Heatmap Summary data dynamically calculated from Cognee graph."""
    decisions = await fetch_and_parse_decisions()
    active_members = get_active_team_members()

    total = len(decisions)
    red = 0
    yellow = 0

    for d in decisions:
        clean_author = d.author.replace("@", "")
        if active_members and clean_author not in active_members:
            red += 1
        elif not d.contributors:
            yellow += 1

    green = max(0, total - red - yellow)

    return HeatmapSummary(
        total_decisions=total,
        red_silos=red,
        yellow_warnings=yellow,
        green_healthy=green
    )


@router.get("/decisions", response_model=List[Decision])
async def get_decisions(query: Optional[str] = None):
    """Returns all decisions from the knowledge graph, with optional text search."""
    decisions = await fetch_and_parse_decisions()

    if query:
        query_lower = query.lower()
        decisions = [d for d in decisions if query_lower in d.title.lower() or query_lower in d.reason.lower()]

    return decisions


@router.post("/dashboard/refresh")
async def refresh_dashboard_cache(token_payload: dict = Depends(verify_token)):
    """Clear the dashboard cache to force a fresh fetch from Cognee."""
    _DASHBOARD_CACHE["decisions"] = None
    return {"status": "Cache cleared"}


# ─── NEW: Risk Heatmap Modules Endpoint ───────────────────────────────────────

@router.get("/heatmap/modules", response_model=List[ModuleRiskData])
async def get_heatmap_modules():
    """
    Derives per-module risk scores from real Cognee graph data.
    Groups decisions by inferred module/component, then calculates
    risk factors and detects lone-contributor knowledge silos.
    """
    decisions = await fetch_and_parse_decisions()
    active_members = get_active_team_members()

    if not decisions:
        return []

    # Group decisions by affected_systems / inferred module
    module_map: dict[str, dict] = {}
    for d in decisions:
        systems = d.affected_systems if d.affected_systems else ["General"]
        for system in systems:
            key = system.strip()
            if key not in module_map:
                module_map[key] = {"decisions": [], "authors": []}
            module_map[key]["decisions"].append(d)
            module_map[key]["authors"].append(d.author.replace("@", ""))

    modules: List[ModuleRiskData] = []
    for idx, (module_name, data) in enumerate(module_map.items()):
        module_decisions = data["decisions"]
        authors = data["authors"]
        n = len(module_decisions)

        # Heuristic risk factor scoring from decision metadata
        unique_authors = set(authors)
        lone_contributor_name = None

        # Silo detection: if 80%+ of decisions are from one author, it's a silo
        if n >= 2:
            for author in unique_authors:
                ratio = authors.count(author) / n
                if ratio >= 0.8:
                    # Only flag if author is not active
                    if active_members and author not in active_members:
                        lone_contributor_name = f"@{author}"
                    elif not active_members:
                        lone_contributor_name = f"@{author}"

        # Derive risk factors from decision characteristics
        code_churn = min(100, n * 15)                            # More decisions = more churn
        complexity = min(100, len(unique_authors) * 10 + n * 5) # Many authors + decisions = complex
        test_coverage = max(0, 100 - n * 10)                    # More decisions = likely less test coverage
        issue_volume = min(100, n * 12)
        dependency_depth = min(100, len(unique_authors) * 15)
        age = min(100, n * 8)

        # Weighted risk score (mirrors frontend formula exactly)
        base_risk = (
            code_churn * RISK_WEIGHTS["codeChurn"] +
            test_coverage * RISK_WEIGHTS["testCoverage"] +
            complexity * RISK_WEIGHTS["complexity"] +
            issue_volume * RISK_WEIGHTS["issueVolume"] +
            dependency_depth * RISK_WEIGHTS["dependencyDepth"] +
            age * RISK_WEIGHTS["age"]
        )
        overall_risk = round(base_risk)

        # Silo risk penalty
        if lone_contributor_name:
            is_still_active = active_members and lone_contributor_name.replace("@", "") in active_members
            overall_risk = 100 if not is_still_active else min(overall_risk + 30, 90)

        modules.append(ModuleRiskData(
            id=f"mod-{idx}",
            name=module_name,
            size=max(500, n * 400),  # Size proportional to decision count
            factors=ModuleRiskFactors(
                codeChurn=code_churn,
                complexity=complexity,
                testCoverage=test_coverage,
                issueVolume=issue_volume,
                dependencyDepth=dependency_depth,
                age=age,
            ),
            loneContributor=lone_contributor_name,
            overallRisk=overall_risk,
        ))

    return modules


# ─── NEW: PR Check Endpoint ───────────────────────────────────────────────────

@router.get("/pr-check/{pr_number}", response_model=PRCheckResult)
async def get_pr_check(pr_number: str, title: Optional[str] = None, body: Optional[str] = None):
    """
    Searches the Cognee knowledge graph for decisions that may conflict
    with the given PR. Uses Gemini to assess conflict severity.
    """
    from datetime import datetime, timezone

    query_text = f"{title or ''} {body or pr_number}".strip()
    if not query_text:
        query_text = f"PR {pr_number}"

    client = CogneeClient()
    try:
        results = await client.search(query_text, search_type="hybrid")
    except Exception as e:
        logger.error(f"Cognee search failed for PR check {pr_number}: {e}")
        return PRCheckResult(
            pr_number=pr_number,
            status="unknown",
            conflicts=[],
            checked_at=datetime.now(timezone.utc).isoformat(),
        )

    if not results:
        return PRCheckResult(
            pr_number=pr_number,
            status="passed",
            conflicts=[],
            checked_at=datetime.now(timezone.utc).isoformat(),
        )

    # Ask Gemini to assess whether any retrieved decisions conflict with this PR
    gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY", "dummy-key"))

    class ConflictList(BaseModel):
        conflicts: List[PRConflict]
        overall_status: str  # "blocked" or "passed"

    prompt = (
        f"You are reviewing Pull Request #{pr_number}.\n"
        f"PR Title: {title or 'Unknown'}\n"
        f"PR Description: {body or 'No description provided'}\n\n"
        f"The following architectural decisions exist in the knowledge graph:\n"
        f"{json.dumps(results, indent=2, default=str)}\n\n"
        f"Identify ONLY real conflicts — cases where this PR re-introduces something explicitly banned, "
        f"or removes something that was explicitly mandated. Ignore unrelated decisions. "
        f"If no real conflicts exist, return an empty conflicts array and status='passed'."
    )

    try:
        response = await gemini_client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ConflictList,
                temperature=0.1,
            )
        )
        parsed = ConflictList.model_validate_json(response.text)
        return PRCheckResult(
            pr_number=pr_number,
            status=parsed.overall_status,
            conflicts=parsed.conflicts,
            checked_at=datetime.now(timezone.utc).isoformat(),
        )
    except Exception as e:
        logger.error(f"Gemini PR check analysis failed: {e}")
        return PRCheckResult(
            pr_number=pr_number,
            status="unknown",
            conflicts=[],
            checked_at=datetime.now(timezone.utc).isoformat(),
        )
