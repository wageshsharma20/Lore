import asyncio
import json
from typing import List, Dict, Any
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

router = APIRouter(prefix="/api/chat", tags=["chat"])

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

async def mock_streaming_pipeline(messages: List[ChatMessage]):
    """
    Simulates a RAG pipeline by yielding status events then chunking out a response.
    """
    last_msg = messages[-1].content.lower() if messages else ""
    
    # 1. Status: Searching
    yield f"data: {json.dumps({'type': 'status', 'message': 'Searching decision graph...'})}\n\n"
    await asyncio.sleep(1.0)
    
    # 2. Status: Found decisions
    yield f"data: {json.dumps({'type': 'status', 'message': 'Found 3 related decisions...'})}\n\n"
    await asyncio.sleep(1.0)
    
    # 3. Status: Generating
    yield f"data: {json.dumps({'type': 'status', 'message': 'Generating answer...'})}\n\n"
    await asyncio.sleep(0.5)
    
    # Send clearing status so UI knows generating is done and typing starts
    yield f"data: {json.dumps({'type': 'status', 'message': ''})}\n\n"

    # Determine answer based on query
    if 'tailwind' in last_msg:
        answer = "We removed Tailwind CSS because it was causing severe bundle bloat and class conflicts across our micro-frontends. @alice made this decision on 2024-06-03."
    elif 'postgres' in last_msg or 'database' in last_msg:
        answer = "PostgreSQL was chosen over MongoDB because our data model for the graph heavily relies on ACID compliance and strict relational integrity. @bob made this decision on 2024-01-15."
    else:
        answer = "Based on our architectural history, this decision was made to optimize system performance and maintainability. I can see from our previous messages that you are diving deep into the architecture!"
    
    # 4. Stream response chunks
    words = answer.split(' ')
    for i, word in enumerate(words):
        chunk = word + (" " if i < len(words) - 1 else "")
        yield f"data: {json.dumps({'type': 'chunk', 'text': chunk})}\n\n"
        await asyncio.sleep(0.05)
        
    # 5. Send completion event (optional, but good for signaling end)
    yield f"data: {json.dumps({'type': 'done'})}\n\n"

@router.post("")
async def chat_endpoint(req: ChatRequest):
    """
    Streams the response for a chat message using the AI RAG pipeline over the Knowledge Graph.
    """
    return StreamingResponse(
        mock_streaming_pipeline(req.messages),
        media_type="text/event-stream"
    )
