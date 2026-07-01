import logging
import asyncio
from typing import List, Dict, Any
from ..core.celery_app import celery_app
from ..services.teams import get_active_team_members
from ..services.cognee_client import CogneeClient
from ..routers.dashboard import ModuleRiskData, RISK_WEIGHTS, HeatmapSummary

logger = logging.getLogger(__name__)

async def _async_recalculate_knowledge_risk_heatmap():
    """
    Nightly task to recalculate the Knowledge Risk Heatmap and detect Silos.
    In a real system, this would write the results to a persistent data store or send alerts.
    """
    logger.info("Starting nightly heatmap recalculation...")
    try:
        # 1. Fetch decisions from Cognee graph
        client = CogneeClient()
        try:
            graph_results = await client.search("all architectural decisions", search_type="hybrid")
        except Exception as e:
            logger.error(f"Graph search failed in nightly heatmap calculation: {e}")
            return {"status": "error", "message": "Graph search failed"}

        if not graph_results:
            logger.info("No decisions found in the graph. Skipping recalculation.")
            return {"status": "success", "message": "No data to process"}

        # 2. Get active team members
        active_members = get_active_team_members()
        
        # We simulate the exact logic from our dashboard module calculation
        # In a real app, this task would probably save the historical module risks to a DB for tracking over time.
        
        module_map: Dict[str, Dict[str, list]] = {}
        for result in graph_results:
            if isinstance(result, str):
                continue
                
            affected_systems = result.get("affected_systems", ["General"])
            author = (result.get("made_by", {}).get("name", "") if isinstance(result.get("made_by"), dict) else result.get("decision_author", "")).replace("@", "")
            
            if not author:
                continue

            for system in affected_systems:
                key = system.strip()
                if key not in module_map:
                    module_map[key] = {"decisions": [], "authors": []}
                module_map[key]["decisions"].append(result)
                module_map[key]["authors"].append(author)

        high_risk_silos = []
        
        for module_name, data in module_map.items():
            module_decisions = data["decisions"]
            authors = data["authors"]
            n = len(module_decisions)
            unique_authors = set(authors)
            
            lone_contributor_name = None
            if n >= 2:
                for author in unique_authors:
                    ratio = authors.count(author) / n
                    if ratio >= 0.8:
                        if active_members and author not in active_members:
                            lone_contributor_name = f"@{author}"
                        elif not active_members:
                            lone_contributor_name = f"@{author}"
            
            if lone_contributor_name:
                is_still_active = active_members and lone_contributor_name.replace("@", "") in active_members
                if not is_still_active:
                    high_risk_silos.append({"module": module_name, "silo": lone_contributor_name})

        logger.info(f"Heatmap recalculation complete against {len(active_members)} active members.")
        if high_risk_silos:
            logger.warning(f"Detected {len(high_risk_silos)} high-risk departed author silos: {high_risk_silos}")
            # Real app might fire a Slack alert here

        return {"status": "success", "message": f"Heatmap recalculated. Found {len(high_risk_silos)} silos."}

    except Exception as e:
        logger.error(f"Heatmap recalculation failed: {e} [FAILURE]")
        raise e

@celery_app.task(name="recalculate_knowledge_risk_heatmap")
def recalculate_knowledge_risk_heatmap():
    """
    Celery Beat nightly task to recalculate the Knowledge Risk Heatmap.
    This fetches the latest decision counts from the graph and updates
    the risk scores, specifically looking for the lone-contributor silo risk.
    """
    return asyncio.run(_async_recalculate_knowledge_risk_heatmap())
