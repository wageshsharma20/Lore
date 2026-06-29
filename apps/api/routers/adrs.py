from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any
from ..services.cognee_client import CogneeClient
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class ApprovalResponse(BaseModel):
    status: str
    decision_id: str
    memify_result: Dict[str, Any]

@router.post("/adrs/{decision_id}/approve", response_model=ApprovalResponse)
async def approve_adr(decision_id: str):
    """
    Ratifies a decision (ADR) and calls Cognee's memify to enrich the memory node.
    """
    logger.info(f"ADR {decision_id} approved. Triggering memify.")
    client = CogneeClient()
    
    try:
        # Re-cognify the dataset to update the graph based on the approval (if we added state)
        # Note: the true fix is ensuring ingestion correctly uses cognify in pr_tasks,
        # but if we enrich data here, we cognify the dataset again.
        result = await client.cognify("architecture_decisions")
        return ApprovalResponse(
            status="success",
            decision_id=decision_id,
            memify_result=result
        )
    except Exception as e:
        logger.error(f"Failed to cognify after approving decision {decision_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
