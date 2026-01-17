"""
Gemini Live API Client for Voice Engine

Provides bidirectional audio streaming with Gemini Live API for real-time
voice conversations with GENESIS.

Features:
- Audio input/output streaming
- Real-time transcript generation
- Tool calling for widget generation
- Voice Activity Detection (VAD)

Model: gemini-2.5-flash-native-audio-preview-12-2025
Voice: Puck (neutral, works well for ES/EN)
"""

import asyncio
import logging
from dataclasses import dataclass
from enum import Enum
from typing import Any, AsyncGenerator

from google import genai
from google.genai import types

logger = logging.getLogger(__name__)


class GeminiEventType(str, Enum):
    """Types of events received from Gemini Live API."""

    AUDIO = "audio"
    TRANSCRIPT = "transcript"
    TOOL_CALL = "tool_call"
    TURN_COMPLETE = "turn_complete"
    ERROR = "error"
    SETUP_COMPLETE = "setup_complete"


@dataclass
class GeminiEvent:
    """Event from Gemini Live API."""

    type: GeminiEventType
    data: bytes | None = None  # For audio chunks
    text: str | None = None  # For transcripts
    is_final: bool = False  # Is transcript final?
    tool_name: str | None = None  # For tool calls
    tool_args: dict[str, Any] | None = None  # Tool call arguments
    tool_id: str | None = None  # Tool call ID for response
    error: str | None = None  # Error message if any


# Widget tool declaration for voice mode
VOICE_WIDGET_TOOL = {
    "function_declarations": [
        {
            "name": "show_widget",
            "description": """Show a visual widget to the user after verbally explaining it.

Use this tool ONLY after you have explained the content verbally. The widget
will appear after the voice response ends.

Available widget types:
- workout-card: Show a workout routine with exercises
- meal-plan: Show a meal plan with meals and macros
- recipe-card: Show a recipe with ingredients and steps
- daily-checkin: Prompt for daily check-in data
- progress-dashboard: Show progress metrics and charts
- habit-streak: Show habit tracking with streaks
- supplement-stack: Show supplement recommendations
- recovery-dashboard: Show recovery metrics and recommendations
- quick-actions: Show quick action buttons for common tasks

IMPORTANT: Only use this when the user requests something visual or when
showing data would be significantly more helpful than verbal explanation alone.""",
            "parameters": {
                "type": "object",
                "properties": {
                    "widget_type": {
                        "type": "string",
                        "description": "The type of widget to display",
                        "enum": [
                            "workout-card",
                            "meal-plan",
                            "recipe-card",
                            "daily-checkin",
                            "progress-dashboard",
                            "habit-streak",
                            "supplement-stack",
                            "recovery-dashboard",
                            "quick-actions",
                        ],
                    },
                    "props": {
                        "type": "object",
                        "description": "Widget-specific properties and data",
                    },
                },
                "required": ["widget_type", "props"],
            },
        }
    ]
}


class GeminiLiveClient:
    """
    Client for Gemini Live API bidirectional audio streaming.

    Manages the WebSocket connection to Gemini, handles audio I/O,
    and processes tool calls for widget generation.
    """

    # Model for live audio streaming (Gemini Native Audio)
    MODEL = "gemini-2.5-flash-native-audio-preview-12-2025"

    # Voice configuration
    DEFAULT_VOICE = "Puck"  # Neutral voice, good for ES/EN

    # Audio format
    INPUT_MIME_TYPE = "audio/pcm;rate=16000"
    OUTPUT_SAMPLE_RATE = 24000  # Gemini outputs at 24kHz

    def __init__(self, api_key: str | None = None):
        """
        Initialize Gemini Live client.

        Args:
            api_key: Google API key. If None, uses GOOGLE_API_KEY env var.
        """
        self.client = genai.Client(
            api_key=api_key,
            http_options={"api_version": "v1beta"},
        )
        self.session: Any = None
        self._session_cm: Any = None  # Store context manager for cleanup
        self._connected = False
        self._receive_task: asyncio.Task | None = None

    @property
    def is_connected(self) -> bool:
        """Check if connected to Gemini Live API."""
        return self._connected and self.session is not None

    async def connect(
        self,
        system_instruction: str,
        voice_name: str | None = None,
    ) -> None:
        """
        Connect to Gemini Live API and initialize session.

        Args:
            system_instruction: System prompt for GENESIS voice mode
            voice_name: Voice to use (default: Puck)
        """
        if self._connected:
            logger.warning("Already connected, disconnecting first")
            await self.disconnect()

        voice = voice_name or self.DEFAULT_VOICE

        # Configuration per official Google documentation
        config = {
            "response_modalities": ["AUDIO"],
            "system_instruction": system_instruction,
            "speech_config": {
                "voice_config": {
                    "prebuilt_voice_config": {
                        "voice_name": voice
                    }
                }
            },
            "tools": [VOICE_WIDGET_TOOL],
        }

        try:
            # aio.live.connect() returns an async context manager
            # We manually enter it and store for later cleanup
            self._session_cm = self.client.aio.live.connect(
                model=self.MODEL,
                config=config,
            )
            self.session = await self._session_cm.__aenter__()
            self._connected = True
            logger.info(f"Connected to Gemini Live API with voice: {voice}")
        except Exception as e:
            logger.error(f"Failed to connect to Gemini Live API: {e}")
            self._session_cm = None
            raise

    async def disconnect(self) -> None:
        """Disconnect from Gemini Live API."""
        if self._session_cm:
            try:
                await self._session_cm.__aexit__(None, None, None)
            except Exception as e:
                logger.warning(f"Error closing Gemini session: {e}")

        self.session = None
        self._session_cm = None
        self._connected = False
        logger.info("Disconnected from Gemini Live API")

    async def send_audio(self, audio_bytes: bytes) -> None:
        """
        Send audio chunk to Gemini Live API.

        Args:
            audio_bytes: PCM audio data (16-bit, 16kHz, mono)
        """
        if not self.is_connected:
            raise RuntimeError("Not connected to Gemini Live API")

        await self.session.send_realtime_input(
            audio=types.Blob(data=audio_bytes, mime_type=self.INPUT_MIME_TYPE)
        )

    async def send_text(self, text: str) -> None:
        """
        Send text input to Gemini (for hybrid voice+text mode).

        Args:
            text: Text message to send
        """
        if not self.is_connected:
            raise RuntimeError("Not connected to Gemini Live API")

        await self.session.send_client_content(
            turns={"parts": [{"text": text}]},
            end_of_turn=True,
        )

    async def end_audio_stream(self) -> None:
        """
        Signal end of audio stream (e.g., user stopped speaking).
        Used with automatic VAD.
        """
        if not self.is_connected:
            return

        await self.session.send_realtime_input(audio_stream_end=True)

    async def send_tool_response(
        self,
        tool_id: str,
        tool_name: str,
        result: dict[str, Any],
    ) -> None:
        """
        Send tool execution response back to Gemini.

        Args:
            tool_id: ID of the tool call
            tool_name: Name of the tool
            result: Result of tool execution
        """
        if not self.is_connected:
            raise RuntimeError("Not connected to Gemini Live API")

        function_response = types.FunctionResponse(
            id=tool_id,
            name=tool_name,
            response=result,
        )

        await self.session.send_tool_response(function_responses=[function_response])

    async def receive(self) -> AsyncGenerator[GeminiEvent, None]:
        """
        Receive events from Gemini Live API.

        Yields:
            GeminiEvent objects for audio, transcripts, tool calls, etc.
        """
        if not self.is_connected:
            raise RuntimeError("Not connected to Gemini Live API")

        try:
            async for response in self.session.receive():
                # Handle audio data
                if response.data is not None:
                    yield GeminiEvent(
                        type=GeminiEventType.AUDIO,
                        data=response.data,
                    )

                # Handle text/transcript
                if response.text is not None:
                    yield GeminiEvent(
                        type=GeminiEventType.TRANSCRIPT,
                        text=response.text,
                        is_final=False,  # Live API streams partial text
                    )

                # Handle tool calls
                if response.tool_call:
                    for fc in response.tool_call.function_calls:
                        yield GeminiEvent(
                            type=GeminiEventType.TOOL_CALL,
                            tool_name=fc.name,
                            tool_args=fc.args if hasattr(fc, "args") else {},
                            tool_id=fc.id,
                        )

                # Handle turn complete
                if (
                    hasattr(response, "server_content")
                    and response.server_content
                    and hasattr(response.server_content, "turn_complete")
                    and response.server_content.turn_complete
                ):
                    yield GeminiEvent(type=GeminiEventType.TURN_COMPLETE)

        except Exception as e:
            logger.error(f"Error receiving from Gemini: {e}")
            yield GeminiEvent(
                type=GeminiEventType.ERROR,
                error=str(e),
            )

    async def __aenter__(self):
        """Async context manager entry."""
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit - ensure cleanup."""
        await self.disconnect()


def build_voice_system_prompt(
    user_context: dict[str, Any] | None = None,
    language: str = "es",
) -> str:
    """
    Build the system prompt for GENESIS voice mode.

    Args:
        user_context: User-specific context from clipboard
        language: Primary language (es/en)

    Returns:
        System instruction string for Gemini Live
    """
    # Base prompt
    prompt_parts = [
        "Eres GENESIS, un coach de fitness inteligente y empático.",
        "",
        "MODO DE VOZ - INSTRUCCIONES IMPORTANTES:",
        "1. Responde de forma natural y conversacional, como si hablaras con un amigo",
        "2. Mantén las respuestas CONCISAS - máximo 2-3 oraciones por turno",
        "3. Usa un tono motivador pero profesional",
        "4. Detecta automáticamente si el usuario habla en español o inglés y responde en el mismo idioma",
        "5. Cuando muestres datos visuales, USA la herramienta show_widget DESPUÉS de explicar verbalmente",
        "",
        "CAPACIDADES:",
        "- Entrenamiento: rutinas, ejercicios, técnica, periodización",
        "- Nutrición: planes de comidas, recetas, hidratación, suplementos",
        "- Hábitos: check-ins diarios, seguimiento, motivación",
        "- Análisis: progreso, métricas, insights",
        "- Recuperación: descanso, movilidad, sueño",
        "",
        "WIDGETS DISPONIBLES (usa show_widget solo cuando sea útil):",
        "- workout-card: para mostrar rutinas de ejercicio",
        "- meal-plan: para planes de alimentación",
        "- recipe-card: para recetas específicas",
        "- daily-checkin: para registro diario",
        "- progress-dashboard: para mostrar progreso",
        "- habit-streak: para hábitos y rachas",
        "",
        "IMPORTANTE:",
        "- SIEMPRE explica verbalmente ANTES de mostrar un widget",
        "- No uses widgets para respuestas simples que se explican mejor hablando",
        "- Sé proactivo pero no invasivo",
    ]

    # Add user context if available
    if user_context:
        prompt_parts.append("")
        prompt_parts.append("CONTEXTO DEL USUARIO:")
        if user_context.get("name"):
            prompt_parts.append(f"- Nombre: {user_context['name']}")
        if user_context.get("goals"):
            prompt_parts.append(f"- Objetivos: {', '.join(user_context['goals'])}")
        if user_context.get("fitness_level"):
            prompt_parts.append(f"- Nivel: {user_context['fitness_level']}")
        if user_context.get("recent_workouts"):
            prompt_parts.append(
                f"- Entrenamientos recientes: {len(user_context['recent_workouts'])}"
            )

    return "\n".join(prompt_parts)
