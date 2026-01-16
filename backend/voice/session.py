"""
Voice Session Manager

Bridges WebSocket connection from client with Gemini Live API,
managing the bidirectional audio streaming and state.

Responsibilities:
- WebSocket <-> Gemini Live bidirectional bridge
- Audio chunk routing
- State management (idle, listening, processing, speaking)
- Widget payload queuing and delivery
- Session cleanup
"""

import asyncio
import logging
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

from fastapi import WebSocket

from .audio_utils import decode_audio_base64, encode_audio_base64, calculate_audio_level
from .gemini_live import (
    GeminiLiveClient,
    GeminiEvent,
    GeminiEventType,
    build_voice_system_prompt,
)

logger = logging.getLogger(__name__)


class VoiceState(str, Enum):
    """Voice session states for UI feedback."""

    IDLE = "idle"
    LISTENING = "listening"
    PROCESSING = "processing"
    SPEAKING = "speaking"
    ERROR = "error"


@dataclass
class VoiceSessionConfig:
    """Configuration for a voice session."""

    session_id: str
    user_id: str = "default"
    language: str = "es"
    voice_name: str | None = None


@dataclass
class PendingWidget:
    """Widget waiting to be delivered after voice response."""

    widget_type: str
    props: dict[str, Any]


@dataclass
class VoiceSessionState:
    """Internal state of a voice session."""

    current_state: VoiceState = VoiceState.IDLE
    transcript: str = ""
    pending_widgets: list[PendingWidget] = field(default_factory=list)
    is_speaking: bool = False
    audio_level: float = 0.0


class VoiceSession:
    """
    Manages a single voice conversation session.

    Bridges the WebSocket connection from the frontend with the
    Gemini Live API, handling bidirectional audio streaming.
    """

    # Delay before sending widget after voice ends (ms)
    WIDGET_DELAY_MS = 500

    def __init__(
        self,
        websocket: WebSocket,
        config: VoiceSessionConfig,
        user_context: dict[str, Any] | None = None,
    ):
        """
        Initialize voice session.

        Args:
            websocket: FastAPI WebSocket connection
            config: Session configuration
            user_context: User context from clipboard (goals, history, etc.)
        """
        self.websocket = websocket
        self.config = config
        self.user_context = user_context or {}
        self.state = VoiceSessionState()
        self.gemini_client = GeminiLiveClient()

        self._running = False
        self._client_task: asyncio.Task | None = None
        self._gemini_task: asyncio.Task | None = None

    @property
    def session_id(self) -> str:
        """Get session ID."""
        return self.config.session_id

    @property
    def current_state(self) -> VoiceState:
        """Get current voice state."""
        return self.state.current_state

    async def run(self) -> None:
        """
        Main session loop - runs until disconnected.

        Sets up bidirectional streaming between client and Gemini.
        """
        try:
            # Build system prompt with user context
            system_prompt = build_voice_system_prompt(
                user_context=self.user_context,
                language=self.config.language,
            )

            # Connect to Gemini Live API
            await self.gemini_client.connect(
                system_instruction=system_prompt,
                voice_name=self.config.voice_name,
            )

            self._running = True

            # Send initial state to client
            await self._send_state(VoiceState.IDLE)

            # Run bidirectional streaming
            await asyncio.gather(
                self._receive_from_client(),
                self._receive_from_gemini(),
            )

        except Exception as e:
            logger.error(f"Voice session error: {e}")
            await self._send_error(str(e))
        finally:
            await self.cleanup()

    async def cleanup(self) -> None:
        """Clean up session resources."""
        self._running = False

        # Cancel tasks
        if self._client_task and not self._client_task.done():
            self._client_task.cancel()
        if self._gemini_task and not self._gemini_task.done():
            self._gemini_task.cancel()

        # Disconnect from Gemini
        if self.gemini_client.is_connected:
            await self.gemini_client.disconnect()

        logger.info(f"Voice session {self.session_id} cleaned up")

    async def _receive_from_client(self) -> None:
        """
        Receive and process messages from WebSocket client.

        Handles:
        - audio_chunk: Forward PCM audio to Gemini
        - end_turn: User finished speaking
        - cancel: User interrupted
        """
        try:
            while self._running:
                message = await self.websocket.receive_json()
                msg_type = message.get("type")

                if msg_type == "audio_chunk":
                    # Decode and forward audio to Gemini
                    audio_b64 = message.get("data", "")
                    audio_bytes = decode_audio_base64(audio_b64)

                    # Update state to listening if idle
                    if self.state.current_state == VoiceState.IDLE:
                        await self._send_state(VoiceState.LISTENING)

                    # Calculate audio level for UI feedback
                    level = calculate_audio_level(audio_bytes)
                    if level > 0.01:  # Only send significant changes
                        await self._send_audio_level(level)

                    # Forward to Gemini
                    await self.gemini_client.send_audio(audio_bytes)

                elif msg_type == "end_turn":
                    # User finished speaking
                    await self._send_state(VoiceState.PROCESSING)
                    await self.gemini_client.end_audio_stream()

                elif msg_type == "cancel":
                    # User interrupted - clear pending state
                    self.state.pending_widgets.clear()
                    await self._send_state(VoiceState.IDLE)

                elif msg_type == "text":
                    # Hybrid mode - text input while in voice mode
                    text = message.get("text", "")
                    if text:
                        await self._send_state(VoiceState.PROCESSING)
                        await self.gemini_client.send_text(text)

        except Exception as e:
            if self._running:  # Only log if not intentionally stopped
                logger.error(f"Error receiving from client: {e}")
                await self._send_error(str(e))

    async def _receive_from_gemini(self) -> None:
        """
        Receive and process events from Gemini Live API.

        Handles:
        - Audio chunks: Forward to client
        - Transcripts: Forward to client
        - Tool calls: Queue widgets for delivery after response
        - Turn complete: Deliver pending widgets
        """
        try:
            async for event in self.gemini_client.receive():
                if not self._running:
                    break

                if event.type == GeminiEventType.AUDIO:
                    # Forward audio to client
                    if not self.state.is_speaking:
                        self.state.is_speaking = True
                        await self._send_state(VoiceState.SPEAKING)

                    await self._send_audio(event.data)

                elif event.type == GeminiEventType.TRANSCRIPT:
                    # Forward transcript to client
                    self.state.transcript += event.text or ""
                    await self._send_transcript(event.text or "", event.is_final)

                elif event.type == GeminiEventType.TOOL_CALL:
                    # Handle tool calls
                    if event.tool_name == "show_widget":
                        await self._handle_widget_tool(event)
                    else:
                        logger.warning(f"Unknown tool call: {event.tool_name}")

                elif event.type == GeminiEventType.TURN_COMPLETE:
                    # Response complete - deliver pending widgets
                    self.state.is_speaking = False
                    await self._send_state(VoiceState.IDLE)

                    if self.state.pending_widgets:
                        # Wait a bit before showing widget
                        await asyncio.sleep(self.WIDGET_DELAY_MS / 1000)
                        await self._deliver_pending_widgets()

                    # Reset transcript for next turn
                    self.state.transcript = ""

                elif event.type == GeminiEventType.ERROR:
                    await self._send_error(event.error or "Unknown Gemini error")

        except Exception as e:
            if self._running:
                logger.error(f"Error receiving from Gemini: {e}")
                await self._send_error(str(e))

    async def _handle_widget_tool(self, event: GeminiEvent) -> None:
        """
        Handle show_widget tool call from Gemini.

        Queues the widget for delivery after voice response completes.
        """
        if not event.tool_args:
            logger.warning("show_widget called without args")
            return

        widget_type = event.tool_args.get("widget_type")
        props = event.tool_args.get("props", {})

        if widget_type:
            # Queue widget for delivery after response
            self.state.pending_widgets.append(
                PendingWidget(widget_type=widget_type, props=props)
            )
            logger.info(f"Queued widget: {widget_type}")

            # Send tool response to Gemini
            if event.tool_id:
                await self.gemini_client.send_tool_response(
                    tool_id=event.tool_id,
                    tool_name="show_widget",
                    result={"status": "queued", "widget_type": widget_type},
                )

    async def _deliver_pending_widgets(self) -> None:
        """Deliver all pending widgets to client."""
        for widget in self.state.pending_widgets:
            await self.websocket.send_json(
                {
                    "type": "widget",
                    "payload": {
                        "type": widget.widget_type,
                        "props": widget.props,
                    },
                }
            )
            logger.info(f"Delivered widget: {widget.widget_type}")

        self.state.pending_widgets.clear()

    # === WebSocket message senders ===

    async def _send_state(self, state: VoiceState) -> None:
        """Send state update to client."""
        self.state.current_state = state
        await self.websocket.send_json({"type": "state", "value": state.value})

    async def _send_audio(self, audio_bytes: bytes) -> None:
        """Send audio chunk to client."""
        encoded = encode_audio_base64(audio_bytes)
        await self.websocket.send_json({"type": "audio_chunk", "data": encoded})

    async def _send_transcript(self, text: str, is_final: bool) -> None:
        """Send transcript update to client."""
        await self.websocket.send_json(
            {"type": "transcript", "text": text, "final": is_final}
        )

    async def _send_audio_level(self, level: float) -> None:
        """Send audio level for UI feedback."""
        await self.websocket.send_json({"type": "audio_level", "value": level})

    async def _send_error(self, message: str) -> None:
        """Send error to client."""
        self.state.current_state = VoiceState.ERROR
        await self.websocket.send_json({"type": "error", "message": message})

    async def _send_end_response(self) -> None:
        """Signal end of response to client."""
        await self.websocket.send_json({"type": "end_response"})
