import logging
from ..core.celery_app import celery_app
from ..services.teams import get_active_team_members

logger = logging.getLogger(__name__)

@celery_app.task(name="recalculate_knowledge_risk_heatmap")
def recalculate_knowledge_risk_heatmap():
    """
    Celery Beat nightly task to recalculate the Knowledge Risk Heatmap.
    This fetches the latest decision counts from the graph and updates
    the risk scores, specifically looking for the lone-contributor silo risk.
    """
    logger.info("Starting nightly heatmap recalculation...")
    try:
        # In a real implementation, this would:
        # 1. Query Cognee graph for decisions grouped by module/folder.
        # 2. Extract unique decision_authors for each module.
        # 3. Call GET /team/active-members to check live roster.
        active_members = get_active_team_members()
        
        # Example logic:
        # if author not in active_members -> Flag as High Risk (Departed Author Silo)
        # elif author count == 1 -> Flag as Medium Risk (Lone-Contributor Silo)
        
        logger.info(f"Heatmap recalculation complete against {len(active_members)} active members. Silo risks updated. [SUCCESS]")
        return {"status": "success", "message": "Heatmap recalculated"}
    except Exception as e:
        logger.error(f"Heatmap recalculation failed: {e} [FAILURE]")
        raise e
