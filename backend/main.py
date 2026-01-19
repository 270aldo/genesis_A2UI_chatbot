"""
NGX A2UI Backend - FastAPI Server (V4 Architecture)

Main entry point for the unified GENESIS chatbot backend.
Exposes /api/chat endpoint that connects to ADK agent.

V4: Single GENESIS agent with internal specialization (no sub_agents).
"""

import base64
import json
import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from agent import root_agent
from schemas.clipboard import MessageRole
from schemas.request import ChatRequest, EventsRequest
from schemas.response import AgentResponse
from services.auth import resolve_user_id_from_request
from services.session_store import get_or_create_session, set_session, session_store
from wearables import wearables_router
from voice import voice_router

MAX_ATTACHMENTS = 4


def _decode_base64(data: str) -> bytes:
    if not data:
        return b""
    if data.startswith("data:") and "," in data:
        data = data.split(",", 1)[1]
    try:
        return base64.b64decode(data)
    except Exception:
        return b""


def _build_image_part(attachment) -> types.Part | None:
    """Best-effort conversion for base64 image attachments into Gemini Parts."""
    data = _decode_base64(attachment.data)
    if not data:
        return None

    mime_type = getattr(attachment, "mime_type", None) or "image/jpeg"

    for method_name in ("from_bytes", "from_data"):
        method = getattr(types.Part, method_name, None)
        if callable(method):
            try:
                return method(data=data, mime_type=mime_type)
            except TypeError:
                try:
                    return method(data=data, mimeType=mime_type)
                except Exception:
                    pass

    blob_cls = getattr(types, "Blob", None)
    if blob_cls:
        try:
            return types.Part(inline_data=blob_cls(data=data, mime_type=mime_type))
        except Exception:
            try:
                return types.Part(inline_data=blob_cls(data=data, mimeType=mime_type))
            except Exception:
                pass

    try:
        return types.Part(inline_data={"mime_type": mime_type, "data": data})
    except Exception:
        return types.Part(text=f"[attachment:{getattr(attachment, 'name', 'image')}]")


# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Session service for conversation memory
session_service = InMemorySessionService()

# ADK Runner
runner: Runner = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize ADK runner and session store on startup."""
    global runner

    # Initialize SessionStore (Redis + Supabase)
    logger.info("Connecting to SessionStore...")
    await session_store.connect()

    # Initialize ADK Runner
    logger.info("Initializing ADK Runner with GENESIS agent (V4)...")
    runner = Runner(
        agent=root_agent,
        app_name="ngx-a2ui",
        session_service=session_service,
    )
    logger.info("ADK Runner initialized successfully")
    # V4: Single unified GENESIS agent (no sub_agents)
    logger.info(f"Active agent: {root_agent.name} (unified architecture)")

    yield

    # Cleanup
    logger.info("Disconnecting from SessionStore...")
    await session_store.disconnect()
    logger.info("Shutdown complete")


# FastAPI app
app = FastAPI(
    title="NGX A2UI Backend",
    description="Multiagent backend for NGX GENESIS chatbot",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS configuration
cors_origins = json.loads(os.getenv("CORS_ORIGINS", '["*"]'))
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include voice router for WebSocket endpoint
app.include_router(voice_router)
app.include_router(wearables_router)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "agents": {
            "genesis": "active",  # V4: Unified agent
        },
        "model": "gemini-2.5-flash",
        "version": "0.2.0",  # V4 architecture
        "architecture": "V4-unified",
    }


@app.post("/api/chat", response_model=AgentResponse)
async def chat(request: ChatRequest, raw_request: Request):
    """
    Main chat endpoint.
    
    Receives user message, routes through GENESIS orchestrator,
    returns response with optional widget payload.
    """
    try:
        logger.info(f"Chat request: {request.message[:50]}...")
        
        # Get or create ADK session
        user_id = resolve_user_id_from_request(raw_request, request.user_id)

        session = await session_service.get_session(
            app_name="ngx-a2ui",
            user_id=user_id,
            session_id=request.session_id,
        )
        
        if session is None:
            session = await session_service.create_session(
                app_name="ngx-a2ui",
                user_id=user_id,
                session_id=request.session_id,
            )
        
        # Persist clipboard state (independent of ADK session)
        clipboard = await get_or_create_session(request.session_id, user_id)
        clipboard.add_message(
            MessageRole.USER,
            request.message,
            agent="GENESIS",
        )
        await set_session(clipboard)

        # Invoke agent - run_async returns an async generator
        # Create Content object from user message + optional attachments
        parts: list[types.Part] = []
        if request.attachments:
            for attachment in request.attachments[:MAX_ATTACHMENTS]:
                part = _build_image_part(attachment)
                if part is not None:
                    parts.append(part)

        parts.append(types.Part(text=request.message))

        user_content = types.Content(
            role="user",
            parts=parts,
        )

        final_result = None
        all_events = []
        async for event in runner.run_async(
            user_id=user_id,
            session_id=request.session_id,
            new_message=user_content,
        ):
            # Capture all events for debugging
            all_events.append(event)
            logger.debug(f"Event type: {type(event).__name__}, content: {event}")
            final_result = event

        logger.info(f"Received {len(all_events)} events from ADK")

        # Parse response - try to extract from all events
        response = parse_agent_response(all_events)
        logger.info(f"Response from {response.agent}: {response.text[:50]}...")

        widget_type = response.payload.type if response.payload else None
        clipboard.add_message(
            MessageRole.ASSISTANT,
            response.text,
            agent=response.agent,
            widget_type=widget_type,
        )
        await set_session(clipboard)
        
        return response
        
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


async def forward_telemetry_to_supabase(events: list) -> int:
    """
    Forward telemetry events to Supabase widget_events table.

    Returns the number of events successfully inserted.
    """
    if not session_store.supabase:
        logger.debug("Supabase not configured, skipping telemetry persistence")
        return 0

    try:
        # Transform events to Supabase format
        records = []
        for event in events:
            record = {
                "event_type": event.type,
                "category": event.category,
                "timestamp": event.timestamp or datetime.utcnow().isoformat(),
                "session_id": event.session_id,
                "user_id": event.user_id,
                "data": event.data or {},
            }
            records.append(record)

        if records:
            result = session_store.supabase.table("widget_events").insert(records).execute()
            return len(result.data) if result.data else 0

        return 0
    except Exception as e:
        logger.warning(f"Failed to persist telemetry to Supabase: {e}")
        return 0


@app.post("/api/events")
async def receive_events(request: EventsRequest):
    """
    Telemetry endpoint for frontend events.

    Receives batched events from TelemetryService and:
    1. Logs them for debugging
    2. Forwards to Supabase (when configured)

    Events include:
    - widget_* - Widget lifecycle (shown, dismissed, completed, etc.)
    - session_* - Workout session events
    - user_* - User actions (check-ins, logging)
    - navigation_* - Screen views
    - ai_* - Agent interactions
    - error - Error tracking
    - performance - Performance metrics
    """
    try:
        event_count = len(request.events)
        logger.info(f"Received {event_count} telemetry events")

        # Log event summary for debugging
        categories = {}
        for event in request.events:
            cat = event.category
            categories[cat] = categories.get(cat, 0) + 1

        logger.debug(f"Event categories: {categories}")

        # Forward to Supabase when configured
        persisted = await forward_telemetry_to_supabase(request.events)
        if persisted > 0:
            logger.debug(f"Persisted {persisted} events to Supabase")

        return {
            "status": "ok",
            "received": event_count,
            "persisted": persisted,
            "categories": categories,
        }

    except Exception as e:
        logger.error(f"Events error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


def parse_agent_response(events: list) -> AgentResponse:
    """
    Parse ADK agent events to frontend-compatible format.

    Frontend expects exactly:
    {
        "text": str,
        "agent": str (UPPERCASE),
        "payload": Optional[{"type": str, "props": dict}]
    }
    """
    text_parts = []
    agent = "GENESIS"
    payload = None

    for event in events:
        # Check for content attribute (ModelResponse events)
        if hasattr(event, 'content') and event.content:
            content = event.content
            if hasattr(content, 'parts'):
                for part in content.parts:
                    if hasattr(part, 'text') and part.text:
                        text_parts.append(part.text)
                    # Check for function call results (widget generation)
                    if hasattr(part, 'function_response'):
                        try:
                            result = part.function_response.response
                            if isinstance(result, dict) and 'type' in result:
                                payload = {"type": result["type"], "props": result.get("props", {})}
                        except Exception:
                            pass

        # V3: Keep agent as GENESIS - unified identity
        # Internal routing is hidden from users
        pass

    # Combine all text parts
    text = "\n".join(text_parts) if text_parts else ""

    # Try to parse JSON response from agent
    # Handle multiple scenarios: pure JSON, markdown code blocks, or mixed text + JSON
    json_text = text.strip()

    # Scenario 1: Markdown code block ```json ... ```
    if "```json" in json_text or "```\n{" in json_text:
        import re
        # Extract JSON from code block
        match = re.search(r'```(?:json)?\s*(\{[\s\S]*?\})\s*```', json_text)
        if match:
            try:
                parsed = json.loads(match.group(1))
                # Extract text before the code block as prefix
                prefix = json_text[:json_text.find("```")].strip()
                parsed_text = parsed.get("text", "")
                text = f"{prefix}\n\n{parsed_text}".strip() if prefix else parsed_text
                # V3: Don't override agent from parsed JSON - always GENESIS
                if "payload" in parsed:
                    payload = parsed.get("payload")
            except json.JSONDecodeError:
                pass
    # Scenario 2: Pure JSON starting with {
    elif json_text.startswith("{"):
        try:
            parsed = json.loads(json_text)
            text = parsed.get("text", text)
            # V3: Don't override agent from parsed JSON - always GENESIS
            if "payload" in parsed:
                payload = parsed.get("payload")
        except json.JSONDecodeError:
            pass
    # Scenario 3: Text followed by JSON (find last JSON object)
    elif "{" in json_text and "}" in json_text:
        # Find the last complete JSON object in the text
        import re
        # Look for JSON that has "text" and "agent" keys (our expected format)
        matches = list(re.finditer(r'\{[^{}]*"(?:text|agent)"[^{}]*\{?[^{}]*\}?[^{}]*\}', json_text))
        if matches:
            try:
                # Try to parse the last JSON-like structure
                last_match = matches[-1].group()
                # Find the actual JSON boundaries
                start = json_text.rfind('{"')
                if start == -1:
                    start = json_text.rfind('{\n')
                if start != -1:
                    # Try to find matching closing brace
                    depth = 0
                    end = start
                    for i, char in enumerate(json_text[start:]):
                        if char == '{':
                            depth += 1
                        elif char == '}':
                            depth -= 1
                            if depth == 0:
                                end = start + i + 1
                                break

                    json_str = json_text[start:end]
                    parsed = json.loads(json_str)
                    prefix = json_text[:start].strip()
                    parsed_text = parsed.get("text", "")
                    text = f"{prefix}\n\n{parsed_text}".strip() if prefix else parsed_text
                    # V3: Don't override agent from parsed JSON - always GENESIS
                    if "payload" in parsed:
                        payload = parsed.get("payload")
            except (json.JSONDecodeError, ValueError):
                pass

    return AgentResponse(
        text=text or "Respuesta procesada",
        agent=agent,
        payload=payload,
    )


if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
    )
