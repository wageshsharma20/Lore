import asyncio
import json
import os
import logging
from typing import List, AsyncGenerator
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from google import genai
from google.genai import types

from ..services.cognee_client import CogneeClient

router = APIRouter(prefix="/api/chat", tags=["chat"])
logger = logging.getLogger(__name__)

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

async def real_rag_pipeline(messages: List[ChatMessage]) -> AsyncGenerator[str, None]:
    """
    Real RAG pipeline: searches Cognee knowledge graph, feeds results to Gemini,
    and streams the synthesized answer back chunk by chunk.
    """
    last_msg = messages[-1].content if messages else ""

    # 1. Status: Searching the graph
    yield f"data: {json.dumps({'type': 'status', 'message': 'Searching decision graph...'})}\n\n"

    client = CogneeClient()
    try:
        graph_results = await client.search(last_msg, search_type="hybrid")
    except Exception as e:
        logger.error(f"Cognee search failed in chat: {e}")
        graph_results = []

    if not graph_results:
        yield f"data: {json.dumps({'type': 'status', 'message': ''})}\n\n"
        no_result = "I couldn't find any relevant architectural decisions in the knowledge graph for that query. Try syncing your GitHub repository first."
        for word in no_result.split(" "):
            yield f"data: {json.dumps({'type': 'chunk', 'text': word + ' '})}\n\n"
            await asyncio.sleep(0.03)
        yield f"data: {json.dumps({'type': 'done'})}\n\n"
        return

    # 2. Status: Found decisions
    yield f"data: {json.dumps({'type': 'status', 'message': f'Found {len(graph_results)} related decisions. Generating answer...'})}\n\n"

    # Build conversation history for Gemini
    history_text = ""
    if len(messages) > 1:
        for m in messages[:-1]:
            history_text += f"{m.role.upper()}: {m.content}\n"

    context_str = json.dumps(graph_results, indent=2, default=str)

    prompt = (
        f"You are Lore, an AI assistant with deep knowledge of this engineering team's architectural decisions. "
        f"Answer the user's question based ONLY on the following decision records retrieved from the knowledge graph.\n\n"
        f"KNOWLEDGE GRAPH CONTEXT:\n{context_str}\n\n"
        f"CONVERSATION HISTORY:\n{history_text}\n"
        f"USER QUESTION: {last_msg}\n\n"
        f"Provide a clear, concise answer. Cite the specific decision author and date when relevant. "
        f"If the context does not contain a relevant answer, say so honestly."
    )

    gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY", "dummy-key"))

    # 3. Clear status — start streaming
    yield f"data: {json.dumps({'type': 'status', 'message': ''})}\n\n"

    try:
        async for chunk in await gemini_client.aio.models.generate_content_stream(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction="You are Lore, an engineering knowledge assistant. Be concise and cite sources.",
                temperature=0.2,
            ),
        ):
            if chunk.text:
                yield f"data: {json.dumps({'type': 'chunk', 'text': chunk.text})}\n\n"
    except Exception as e:
        logger.error(f"Gemini streaming failed in chat: {e}")
        error_msg = f"I encountered an error generating the answer: {str(e)}"
        yield f"data: {json.dumps({'type': 'chunk', 'text': error_msg})}\n\n"

    yield f"data: {json.dumps({'type': 'done'})}\n\n"


@router.post("")
async def chat_endpoint(req: ChatRequest):
    """
    Streams the response for a chat message using the real Cognee + Gemini RAG pipeline.
    """
    return StreamingResponse(
        real_rag_pipeline(req.messages),
        media_type="text/event-stream"
    )
