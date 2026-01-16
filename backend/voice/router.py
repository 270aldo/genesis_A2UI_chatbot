"""
Voice WebSocket Router

FastAPI router for voice mode WebSocket endpoint.

Endpoint: /ws/voice
Protocol: Bidirectional WebSocket with JSON messages

Client → Server:
  - audio_chunk: PCM audio data (base64)
  - end_turn: User finished speaking
  - cancel: User interrupted
  - text: Hybrid text input

Server → Client:
  - state: Voice state change (idle, listening, processing, speaking)
  - audio_chunk: PCM audio response (base64)
  - transcript: Real-time transcript text
  - audio_level: Audio level for UI animation
  - widget: Widget payload to render
  - error: Error message
  - end_response: Response complete signal
"""

import logging
from uuid import uuid4

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

from .session import VoiceSession, VoiceSessionConfig

logger = logging.getLogger(__name__)

# Create router
voice_router = APIRouter(tags=["voice"])


@voice_router.websocket("/ws/voice")
async def voice_endpoint(
    websocket: WebSocket,
    session_id: str = Query(default=None, description="Session ID for context"),
    user_id: str = Query(default="default", description="User ID"),
    language: str = Query(default="es", description="Primary language (es/en)"),
):
    """
    WebSocket endpoint for voice mode.

    Establishes a bidirectional audio stream with Gemini Live API
    for real-time voice conversations with GENESIS.

    Query Parameters:
        session_id: Optional session ID for context continuity
        user_id: User identifier
        language: Primary language preference (es/en)

    Protocol:
        See module docstring for message formats.
    """
    await websocket.accept()
    logger.info(f"Voice WebSocket connected: user={user_id}, session={session_id}")

    # Generate session ID if not provided
    effective_session_id = session_id or str(uuid4())

    # Create session config
    config = VoiceSessionConfig(
        session_id=effective_session_id,
        user_id=user_id,
        language=language,
    )

    # TODO: Load user context from clipboard/database
    # For now, use empty context
    user_context = None

    # Create and run voice session
    session = VoiceSession(
        websocket=websocket,
        config=config,
        user_context=user_context,
    )

    try:
        await session.run()
    except WebSocketDisconnect:
        logger.info(f"Voice WebSocket disconnected: session={effective_session_id}")
    except Exception as e:
        logger.error(f"Voice session error: {e}")
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass  # Connection may already be closed
    finally:
        await session.cleanup()


@voice_router.get("/voice/health")
async def voice_health():
    """
    Health check for voice service.

    Returns:
        Status and configuration info
    """
    return {
        "status": "ok",
        "service": "voice",
        "features": {
            "bidirectional_audio": True,
            "widget_generation": True,
            "languages": ["es", "en"],
            "model": "gemini-live-2.5-flash-preview",
        },
    }
