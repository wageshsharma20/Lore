from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
import os
import json
import logging


from ..services.cognee_client import CogneeClient
from .auth import verify_token

router = APIRouter()
logger = logging.getLogger(__name__)

class DecisionSearchResponse(BaseModel):
    answer: str
    decision_author: str
    decision_date: str
    source_pr_url: str
    confidence: float

@router.get("/decisions/search", response_model=DecisionSearchResponse)
async def search_decisions(q: str = Query(...)):
    """
    Decision Memory Backend: Graph search + Gemini answer endpoint.
    Returns a specific JSON schema with attribution.
    """
    logger.info(f"Searching decisions for query: {q}")
    client = CogneeClient()
    
    try:
        graph_results = await client.search(q, search_type="hybrid")
    except Exception as e:
        logger.error(f"Graph search failed: {e}")
        raise HTTPException(
            status_code=500, 
            detail={"error": True, "code": 500, "detail": "Graph search failed"}
        )

    if not graph_results:
        return DecisionSearchResponse(
            answer="No relevant architectural decisions found for your query.",
            decision_author="Unknown",
            decision_date="Unknown",
            source_pr_url="Unknown",
            confidence=0.0
        )

    # Use LLM to formulate the exact schema
    from ..services.gemini_service import get_llm_client, DEFAULT_MODEL
    llm_client = get_llm_client()
    
    prompt = (
        f"Based on the following engineering decision records retrieved from our knowledge graph:\n\n"
        f"{json.dumps(graph_results, indent=2, default=str)}\n\n"
        f"Answer this question: '{q}'\n\n"
        f"Extract the primary decision's author, date, and source PR URL from the records. "
        f"If a record doesn't have an explicit 'decision_author', check if there is a 'made_by' node or just use 'Unknown'. "
        f"Similarly for 'decision_date' and 'source_pr_url'. "
        f"Estimate your confidence from 0.0 to 1.0 based on how well the records answer the question."
    )
    
    try:
        response = await llm_client.chat.completions.create(
            model=DEFAULT_MODEL,
            messages=[
                {"role": "system", "content": "You are an AI assistant parsing architectural decisions."},
                {"role": "user", "content": prompt}
            ],
            response_model=DecisionSearchResponse,
            temperature=0.1
        )
        return response
    except Exception as e:
        logger.error(f"LLM answer generation failed: {e}")
        raise HTTPException(
            status_code=500, 
            detail={"error": True, "code": 500, "detail": "Answer generation failed"}
        )

class DeprecateResponse(BaseModel):
    status: str
    decision_id: str
    forget_result: dict

@router.post("/decisions/{decision_id}/deprecate", response_model=DeprecateResponse)
async def deprecate_decision(decision_id: str, token_payload: dict = Depends(verify_token)):
    """Deprecates an overridden decision, removing it from active memory so PR Blocker stops firing."""
    logger.info(f"Deprecating decision {decision_id}. Triggering forget. Auth payload: {token_payload}")
    client = CogneeClient()
    
    try:
        deprecate_res = await client.deprecate(decision_id)
        # Re-cognify after deprecating to update graph weights
        cognify_res = await client.cognify("architecture_decisions")
        
        return DeprecateResponse(
            status="success",
            decision_id=decision_id,
            forget_result={"deprecate": deprecate_res, "cognify": cognify_res}
        )
    except Exception as e:
        logger.error(f"Failed to deprecate/cognify decision {decision_id}: {e}")
        raise HTTPException(
            status_code=500, 
            detail={"error": True, "code": 500, "detail": str(e)}
        )
