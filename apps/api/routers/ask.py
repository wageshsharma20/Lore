from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict, Any, List
from ..services.cognee_client import CogneeClient
import logging
import json
import asyncio

logger = logging.getLogger(__name__)

router = APIRouter()

class AskRequest(BaseModel):
    query: str

@router.post("/ask")
async def ask_lore(request: AskRequest):
    """Queries the Knowledge Graph using the hybrid graph-vector pipeline and streams SSE."""
    logger.info(f"Querying graph: {request.query}")
    
    async def event_generator():
        client = CogneeClient()
        try:
            # Yield initial status
            yield f'data: {json.dumps({"status": "Searching Graph..."})}\n\n'
            
            # This is the blocking call under the hood that takes a few seconds
            search_results = await client.search(request.query, search_type="hybrid")
            
            # Yield generation status
            yield f'data: {json.dumps({"status": "Generating..."})}\n\n'
            
            answer_text = ""
            if isinstance(search_results, list) and search_results:
                if isinstance(search_results[0], str):
                    answer_text = "\n".join(search_results)
                else:
                    answer_text = str(search_results[0])
            else:
                answer_text = "No relevant context found in the graph."
                
            # Stream the text in chunks to simulate token-by-token if desired
            # or just send the final answer. Let's send in a few chunks to make the UI look good.
            chunk_size = 20
            for i in range(0, len(answer_text), chunk_size):
                chunk = answer_text[i:i+chunk_size]
                yield f'data: {json.dumps({"chunk": chunk})}\n\n'
                await asyncio.sleep(0.05) # slight delay to mimic streaming
                
            # Yield a completion event
            yield f'data: {json.dumps({"status": "Complete"})}\n\n'

        except Exception as e:
            logger.error(f"Failed to query graph: {e}")
            yield f'data: {json.dumps({"error": True, "code": 500, "detail": str(e)})}\n\n'

    return StreamingResponse(event_generator(), media_type="text/event-stream")
