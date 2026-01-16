"""
GENESIS Voice Engine Module

Provides real-time voice interaction with GENESIS via Gemini Live API.

Module Structure:
- audio_utils.py: Audio encoding/decoding utilities
- gemini_live.py: Gemini Live API client with bidirectional streaming
- session.py: Voice session manager (WebSocket <-> Gemini bridge)
- router.py: FastAPI WebSocket router (/ws/voice)

Usage:
    from voice import voice_router
    app.include_router(voice_router)
"""

from .router import voice_router

__all__ = [
    "voice_router",
]
