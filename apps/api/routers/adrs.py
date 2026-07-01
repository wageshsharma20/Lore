from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, List
from ..services.cognee_client import CogneeClient
import logging
import os

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["ADRs"])

class ApprovalResponse(BaseModel):
    status: str
    decision_id: str
    memify_result: Dict[str, Any]

class ADRResponse(BaseModel):
    id: str
    title: str
    status: str
    author: str
    date: str
    content: str
    decisionId: str

@router.get("/adrs", response_model=List[ADRResponse])
async def list_adrs():
    """
    Returns a list of approved ADRs. 
    Currently just returns an empty list as approved ADRs are tracked directly in the GitHub repo.
    """
    return []

@router.get("/adrs/{adr_id}", response_model=ADRResponse)
async def get_adr(adr_id: str):
    """Gets a specific approved ADR."""
    raise HTTPException(status_code=404, detail="ADR not found")

@router.post("/adrs/{decision_id}/approve", response_model=ApprovalResponse)
async def approve_adr(decision_id: str):
    """Ratifies a decision (ADR) and calls Cognee's memify to enrich the memory node."""
    logger.info(f"ADR {decision_id} approved. Triggering memify.")
    client = CogneeClient()
    
    try:
        # Enrich the node before cognifying
        memify_res = await client.memify(decision_id)
        
        # Re-cognify the dataset to update the graph based on the approval
        cognify_res = await client.cognify("architecture_decisions")
        return ApprovalResponse(
            status="success",
            decision_id=decision_id,
            memify_result={"memify": memify_res, "cognify": cognify_res}
        )
    except Exception as e:
        logger.error(f"Failed to memify/cognify after approving decision {decision_id}: {e}")
        raise HTTPException(
            status_code=500, 
            detail={"error": True, "code": 500, "detail": str(e)}
        )
