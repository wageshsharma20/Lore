from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
import os
import json
import logging
from anthropic import AsyncAnthropic

from ..services.cognee_client import CogneeClient

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
    Decision Memory Backend: Graph search + Claude answer endpoint.
    Returns a specific JSON schema with attribution.
    """
    logger.info(f"Searching decisions for query: {q}")
    client = CogneeClient()
    
    try:
        graph_results = await client.search(q, search_type="GRAPH_COMPLETION")
    except Exception as e:
        logger.error(f"Graph search failed: {e}")
        raise HTTPException(status_code=500, detail="Graph search failed")

    if not graph_results:
        return DecisionSearchResponse(
            answer="No relevant architectural decisions found for your query.",
            decision_author="Unknown",
            decision_date="Unknown",
            source_pr_url="Unknown",
            confidence=0.0
        )

    # Use Claude to formulate the exact schema
    anthropic_client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY", "dummy-key"))
    
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
        response = await anthropic_client.messages.create(
            model="claude-3-5-sonnet-20240620",
            max_tokens=512,
            system="You are an AI assistant parsing architectural decisions.",
            messages=[{"role": "user", "content": prompt}],
            tools=[
                {
                    "name": "respond_with_decision",
                    "description": "Return the final answer and metadata about the decision.",
                    "input_schema": DecisionSearchResponse.model_json_schema()
                }
            ],
            tool_choice={"type": "tool", "name": "respond_with_decision"}
        )
        
        for block in response.content:
            if block.type == "tool_use" and block.name == "respond_with_decision":
                return DecisionSearchResponse(**block.input)
                
        # Fallback if no tool use found
        return DecisionSearchResponse(
            answer="Could not parse the decision records clearly.",
            decision_author="Unknown",
            decision_date="Unknown",
            source_pr_url="Unknown",
            confidence=0.0
        )

    except Exception as e:
        logger.error(f"Claude answer generation failed: {e}")
        raise HTTPException(status_code=500, detail="Answer generation failed")
