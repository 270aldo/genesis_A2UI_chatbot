"""
Voice Session Manager

Bridges WebSocket connection from client with Gemini Live API (STT/LLM)
and ElevenLabs API (TTS), managing the bidirectional audio streaming and state.

Architecture:
  User Audio -> Gemini Live (STT + LLM) -> Text -> ElevenLabs (TTS) -> Client Audio

Responsibilities:
- WebSocket <-> Gemini/ElevenLabs bridge
- Audio chunk routing
- State management
- Widget payload queuing
- Session cleanup
"""

import asyncio
import logging
from dataclasses import dataclass, field
from enum import Enum
from typing import TYPE_CHECKING, Any, AsyncGenerator

from fastapi import WebSocket

from .audio_utils import decode_audio_base64, encode_audio_base64, calculate_audio_level
from .gemini_live import (
    GeminiLiveClient,
    GeminiEvent,
    GeminiEventType,
    build_voice_system_prompt,
)
from .elevenlabs_client import ElevenLabsClient

if TYPE_CHECKING:
    from schemas.clipboard import SessionClipboard

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
    voice_name: str | None = None  # ElevenLabs voice ID


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

    Orchestrates the flow between:
    1. Client WebSocket (Audio In/Out)
    2. Gemini Live API (STT + Intelligence)
    3. ElevenLabs API (TTS)
    """

    # Delay before sending widget after voice ends (ms)
    WIDGET_DELAY_MS = 500

    def __init__(
        self,
        websocket: WebSocket,
        config: VoiceSessionConfig,
        user_context: dict[str, Any] | None = None,
        clipboard: "SessionClipboard | None" = None,
    ):
        self.websocket = websocket
        self.config = config
        self.user_context = user_context or {}
        self.clipboard = clipboard  # For conversation persistence
        self.state = VoiceSessionState()

        # Clients
        self.gemini_client = GeminiLiveClient()
        self.elevenlabs_client = ElevenLabsClient()

        # Queues for text-to-speech pipeline
        self.tts_text_queue: asyncio.Queue[str | None] = asyncio.Queue()

        # Conversation tracking for persistence
        self._current_turn_user_text: str = ""
        self._current_turn_assistant_text: str = ""

        self._running = False
        self._ws_open = True  # Track WebSocket state for safe sending
        self._tasks: list[asyncio.Task] = []

    @property
    def session_id(self) -> str:
        return self.config.session_id

    @property
    def current_state(self) -> VoiceState:
        return self.state.current_state

    async def run(self) -> None:
        """Main session loop."""
        try:
            # Build system prompt
            system_prompt = build_voice_system_prompt(
                user_context=self.user_context,
                language=self.config.language,
            )

            # Connect to Gemini Live API in TEXT-only output mode
            # We want Gemini to listen to audio but respond with text + tools
            await self.gemini_client.connect(
                system_instruction=system_prompt,
                response_modalities=["TEXT"],  # Critical for TTS handoff
            )

            self._running = True

            # Send initial state
            await self._send_state(VoiceState.IDLE)

            # Create tasks
            self._tasks = [
                asyncio.create_task(self._receive_from_client()),
                asyncio.create_task(self._receive_from_gemini()),
                asyncio.create_task(self._process_tts_pipeline()),
            ]

            # Wait for any task to complete/fail
            await asyncio.gather(*self._tasks)

        except Exception as e:
            # Check if this is a normal WebSocket close
            error_str = str(e)
            is_normal_close = "(1000," in error_str or "(1001," in error_str

            if self._running and not is_normal_close:
                logger.error(f"Voice session error: {e}")
                await self._send_error(str(e))
        finally:
            await self.cleanup()

    async def cleanup(self) -> None:
        """Clean up resources."""
        self._running = False
        self._ws_open = False  # Mark WebSocket as closed to prevent further sends

        # Cancel all tasks
        for task in self._tasks:
            if not task.done():
                task.cancel()

        # Disconnect clients
        if self.gemini_client.is_connected:
            await self.gemini_client.disconnect()

        logger.info(f"Voice session {self.session_id} cleaned up")

    # === Pipeline Components ===

    async def _receive_from_client(self) -> None:
        """Handle incoming WebSocket messages."""
        try:
            while self._running:
                message = await self.websocket.receive_json()
                msg_type = message.get("type")

                if msg_type == "audio_chunk":
                    audio_b64 = message.get("data", "")
                    audio_bytes = decode_audio_base64(audio_b64)

                    if self.state.current_state == VoiceState.IDLE:
                        await self._send_state(VoiceState.LISTENING)

                    # UI Audio feedback
                    level = calculate_audio_level(audio_bytes)
                    if level > 0.01:
                        await self._send_audio_level(level)

                    await self.gemini_client.send_audio(audio_bytes)

                elif msg_type == "end_turn":
                    await self._send_state(VoiceState.PROCESSING)
                    await self.gemini_client.end_audio_stream()

                elif msg_type == "cancel":
                    await self._handle_interruption()

                elif msg_type == "text":
                    text = message.get("text", "")
                    if text:
                        # Capture user text for persistence (hybrid mode)
                        self._current_turn_user_text = text
                        await self._send_state(VoiceState.PROCESSING)
                        await self.gemini_client.send_text(text)

        except Exception as e:
            # Check if this is a normal WebSocket close (code 1000 or 1001)
            error_str = str(e)
            is_normal_close = "(1000," in error_str or "(1001," in error_str
            if is_normal_close:
                self._ws_open = False
                logger.debug(f"Client disconnected normally: {e}")
            elif self._running:
                self._ws_open = False
                logger.error(f"Error receiving from client: {e}")
                raise

    async def _receive_from_gemini(self) -> None:
        """Handle Gemini events and route to TTS."""
        try:
            async for event in self.gemini_client.receive():
                if not self._running:
                    break

                if event.type == GeminiEventType.TRANSCRIPT:
                    # Gemini sends text chunks. We queue them for ElevenLabs.
                    if event.text:
                        # Accumulate assistant text for persistence
                        self._current_turn_assistant_text += event.text
                        await self.tts_text_queue.put(event.text)
                        # Also forward to client for UI transcript
                        await self._send_transcript(event.text, event.is_final)

                elif event.type == GeminiEventType.TOOL_CALL:
                    if event.tool_name == "show_widget":
                        await self._handle_widget_tool(event)

                elif event.type == GeminiEventType.TURN_COMPLETE:
                    # Signal end of text generation for this turn
                    await self.tts_text_queue.put(None) # Sentinel for TTS
                    
                elif event.type == GeminiEventType.ERROR:
                    logger.error(f"Gemini error: {event.error}")

        except Exception as e:
            if self._running:
                logger.error(f"Error receiving from Gemini: {e}")
                raise

    async def _process_tts_pipeline(self) -> None:
        """
        Consumes text from Gemini and streams audio from ElevenLabs.
        This runs continuously.
        """
        
        async def text_generator() -> AsyncGenerator[str, None]:
            """Yields text chunks for a single turn."""
            while self._running:
                chunk = await self.tts_text_queue.get()
                if chunk is None: # End of turn
                    break
                yield chunk

        while self._running:
            # Wait for the first chunk of text to start a TTS stream
            first_chunk = await self.tts_text_queue.get()
            
            # Flush queue if we got a None (end marker) unexpectedly
            if first_chunk is None:
                continue
                
            # Put it back or use a generator that starts with it
            async def text_gen_with_first():
                yield first_chunk
                async for chunk in text_generator():
                    yield chunk

            # Start speaking state
            self.state.is_speaking = True
            await self._send_state(VoiceState.SPEAKING)

            try:
                # Stream audio from ElevenLabs
                # Pass voice_name from config if set (defaults to GENESIS official in client)
                async for audio_chunk in self.elevenlabs_client.stream_audio(
                    text_gen_with_first(),
                    voice_id=self.config.voice_name
                ):
                    if not self._running:
                        break
                    await self._send_audio(audio_chunk)
                    
            except Exception as e:
                logger.error(f"TTS Streaming error: {e}")
            finally:
                # Turn complete logic
                self.state.is_speaking = False
                await self._send_state(VoiceState.IDLE)

                # Determine widget type for persistence
                widget_type = None
                if self.state.pending_widgets:
                    widget_type = self.state.pending_widgets[0].widget_type

                # Deliver widgets after speaking
                if self.state.pending_widgets:
                    await asyncio.sleep(self.WIDGET_DELAY_MS / 1000)
                    await self._deliver_pending_widgets()

                # Persist conversation turn to clipboard
                await self._persist_voice_conversation(widget_type=widget_type)

    async def _handle_interruption(self) -> None:
        """Handle user interruption."""
        # 1. Clear pending TTS text
        while not self.tts_text_queue.empty():
            try:
                self.tts_text_queue.get_nowait()
            except asyncio.QueueEmpty:
                break
        
        # 2. Clear pending widgets
        self.state.pending_widgets.clear()
        
        # 3. Reset state
        self.state.is_speaking = False
        await self._send_state(VoiceState.IDLE)
        
        # Note: ElevenLabs WS doesn't have a "cancel" message, 
        # but stopping sending text effectively stops it.
        # Ideally we would cancel the current _process_tts_pipeline task iteration.

    # === Helpers ===

    async def _handle_widget_tool(self, event: GeminiEvent) -> None:
        if not event.tool_args:
            return

        widget_type = event.tool_args.get("widget_type")
        props = event.tool_args.get("props", {})

        if widget_type:
            self.state.pending_widgets.append(
                PendingWidget(widget_type=widget_type, props=props)
            )
            # Send success to Gemini so it continues flow
            if event.tool_id:
                await self.gemini_client.send_tool_response(
                    tool_id=event.tool_id,
                    tool_name="show_widget",
                    result={"status": "queued"}
                )

    async def _deliver_pending_widgets(self) -> None:
        for widget in self.state.pending_widgets:
            success = await self._safe_send({
                "type": "widget",
                "payload": {"type": widget.widget_type, "props": widget.props}
            })
            if not success:
                break  # WebSocket closed, stop trying
        self.state.pending_widgets.clear()

    async def _persist_voice_conversation(self, widget_type: str | None = None) -> None:
        """Persist voice conversation turn to SessionClipboard."""
        if not self.clipboard:
            return

        # Import here to avoid circular imports
        from schemas.clipboard import MessageRole
        from services.session_store import set_session

        try:
            # Add user message if we captured it
            if self._current_turn_user_text.strip():
                self.clipboard.add_message(
                    role=MessageRole.USER,
                    content=self._current_turn_user_text.strip(),
                    agent="GENESIS",
                )

            # Add assistant response
            if self._current_turn_assistant_text.strip():
                self.clipboard.add_message(
                    role=MessageRole.ASSISTANT,
                    content=self._current_turn_assistant_text.strip(),
                    agent="GENESIS",
                    widget_type=widget_type,
                )

            # Persist to storage
            await set_session(self.clipboard)

            # Reset for next turn
            self._current_turn_user_text = ""
            self._current_turn_assistant_text = ""

            logger.debug(f"Persisted voice conversation turn for session {self.session_id}")

        except Exception as e:
            logger.warning(f"Failed to persist voice conversation: {e}")

    # === WebSocket Senders ===

    async def _safe_send(self, data: dict) -> bool:
        """Safely send JSON to WebSocket, returns False if WebSocket is closed."""
        if not self._ws_open:
            return False
        try:
            await self.websocket.send_json(data)
            return True
        except Exception:
            self._ws_open = False
            return False

    async def _send_state(self, state: VoiceState) -> None:
        self.state.current_state = state
        await self._safe_send({"type": "state", "value": state.value})

    async def _send_audio(self, audio_bytes: bytes) -> None:
        encoded = encode_audio_base64(audio_bytes)
        await self._safe_send({"type": "audio_chunk", "data": encoded})

    async def _send_transcript(self, text: str, is_final: bool) -> None:
        await self._safe_send({"type": "transcript", "text": text, "final": is_final})

    async def _send_audio_level(self, level: float) -> None:
        await self._safe_send({"type": "audio_level", "value": level})

    async def _send_error(self, message: str) -> None:
        self.state.current_state = VoiceState.ERROR
        await self._safe_send({"type": "error", "message": message})
