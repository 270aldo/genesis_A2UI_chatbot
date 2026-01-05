"""
NGX A2UI Backend - FastAPI Server

Main entry point for the multiagent chatbot backend.
Exposes /api/chat endpoint that connects to ADK agents.
"""

import json
import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from agent import root_agent
from schemas.request import ChatRequest
from schemas.response import AgentResponse

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
    """Initialize ADK runner on startup."""
    global runner
    logger.info("Initializing ADK Runner with GENESIS agent...")
    runner = Runner(
        agent=root_agent,
        app_name="ngx-a2ui",
        session_service=session_service,
    )
    logger.info("ADK Runner initialized successfully")
    logger.info(f"Available agents: genesis, {', '.join([a.name for a in root_agent.sub_agents])}")
    yield
    logger.info("Shutting down...")


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


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "agents": ["genesis"] + [a.name for a in root_agent.sub_agents],
        "model": "gemini-2.5-flash",
        "version": "0.1.0",
    }


@app.post("/api/chat", response_model=AgentResponse)
async def chat(request: ChatRequest):
    """
    Main chat endpoint.
    
    Receives user message, routes through GENESIS orchestrator,
    returns response with optional widget payload.
    """
    try:
        logger.info(f"Chat request: {request.message[:50]}...")
        
        # Get or create session
        session = await session_service.get_session(
            app_name="ngx-a2ui",
            user_id="default",
            session_id=request.session_id,
        )
        
        if session is None:
            session = await session_service.create_session(
                app_name="ngx-a2ui",
                user_id="default",
                session_id=request.session_id,
            )
        
        # Invoke agent - run_async returns an async generator
        # Create Content object from user message
        user_content = types.Content(
            role="user",
            parts=[types.Part(text=request.message)]
        )

        final_result = None
        all_events = []
        async for event in runner.run_async(
            user_id="default",
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
        
        return response
        
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
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

        # Check for author attribute to determine agent
        if hasattr(event, 'author') and event.author:
            agent = event.author.upper()

        # Check for agent_name attribute
        if hasattr(event, 'agent_name') and event.agent_name:
            agent = event.agent_name.upper()

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
                agent = parsed.get("agent", agent).upper()
                if "payload" in parsed:
                    payload = parsed.get("payload")
            except json.JSONDecodeError:
                pass
    # Scenario 2: Pure JSON starting with {
    elif json_text.startswith("{"):
        try:
            parsed = json.loads(json_text)
            text = parsed.get("text", text)
            agent = parsed.get("agent", agent).upper()
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
                    agent = parsed.get("agent", agent).upper()
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
