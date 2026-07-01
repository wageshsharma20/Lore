from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, List
from ..services.cognee_client import CogneeClient
import logging
import os
from google import genai
from google.genai import types

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
    Returns a list of approved ADRs dynamically parsed from the memory graph.
    """
    client = CogneeClient()
    try:
        results = await client.search("approved architectural decision records", search_type="hybrid")
    except Exception as e:
        logger.error(f"Failed to fetch ADRs: {e}")
        return []
    
    if not results:
        return []
        
    gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY", "dummy-key"))
    
    class ADRList(BaseModel):
        adrs: List[ADRResponse]
        
    prompt = (
        f"Parse the following decisions into a list of formal ADRs.\n\n{results}\n\n"
        f"Map the author to 'author', the decision_date to 'date', the 'reason_summary' and 'decision' to 'content', "
        f"and standardise the 'status' to 'approved' if they seem ratified."
    )
    
    try:
        response = await gemini_client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ADRList,
                temperature=0.1
            )
        )
        parsed = ADRList.model_validate_json(response.text)
        return parsed.adrs
    except Exception as e:
        logger.error(f"Gemini ADR parsing failed: {e}")
        return []

@router.get("/adrs/{adr_id}", response_model=ADRResponse)
async def get_adr(adr_id: str):
    """Gets a specific approved ADR dynamically."""
    adrs = await list_adrs()
    for adr in adrs:
        if adr.id == adr_id or adr.decisionId == adr_id:
            return adr
    raise HTTPException(status_code=404, detail="ADR not found in graph")

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
