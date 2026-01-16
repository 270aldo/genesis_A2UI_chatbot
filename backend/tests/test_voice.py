"""
Tests for Voice Engine Module

Tests cover:
- audio_utils: PCM encoding/decoding, level calculation
- gemini_live: Client initialization, event types
- session: State management, config
- router: WebSocket endpoint, health check
"""

import base64
import struct
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from voice.audio_utils import (
    encode_audio_base64,
    decode_audio_base64,
    calculate_audio_level,
    chunk_audio,
    validate_audio_format,
    create_silence,
    SAMPLE_RATE,
    BYTES_PER_CHUNK,
    BYTES_PER_SAMPLE,
)
from voice.gemini_live import (
    GeminiLiveClient,
    GeminiEvent,
    GeminiEventType,
    VOICE_WIDGET_TOOL,
    build_voice_system_prompt,
)
from voice.session import (
    VoiceSession,
    VoiceSessionConfig,
    VoiceState,
    PendingWidget,
)


# =============================================================================
# Audio Utils Tests
# =============================================================================

class TestAudioEncoding:
    """Tests for audio encoding/decoding functions."""

    def test_encode_decode_roundtrip(self):
        """Test that encode/decode preserves data."""
        original = b"\x00\x01\x02\x03\x04\x05"
        encoded = encode_audio_base64(original)
        decoded = decode_audio_base64(encoded)
        assert decoded == original

    def test_encode_empty(self):
        """Test encoding empty bytes."""
        encoded = encode_audio_base64(b"")
        assert encoded == ""

    def test_decode_empty(self):
        """Test decoding empty string."""
        decoded = decode_audio_base64("")
        assert decoded == b""

    def test_encode_returns_string(self):
        """Test that encode returns a string."""
        result = encode_audio_base64(b"test")
        assert isinstance(result, str)

    def test_decode_returns_bytes(self):
        """Test that decode returns bytes."""
        encoded = base64.b64encode(b"test").decode()
        result = decode_audio_base64(encoded)
        assert isinstance(result, bytes)


class TestAudioLevel:
    """Tests for audio level calculation."""

    def test_silence_returns_zero(self):
        """Test that silence returns ~0 level."""
        silence = b"\x00" * 100
        level = calculate_audio_level(silence)
        assert level == 0.0

    def test_loud_audio_high_level(self):
        """Test that loud audio returns high level."""
        # Create max amplitude samples
        samples = [32767] * 50  # Max 16-bit value
        audio = struct.pack(f"<{len(samples)}h", *samples)
        level = calculate_audio_level(audio)
        assert level > 0.9

    def test_empty_returns_zero(self):
        """Test that empty input returns 0."""
        assert calculate_audio_level(b"") == 0.0
        assert calculate_audio_level(b"\x00") == 0.0

    def test_level_in_range(self):
        """Test that level is always 0-1."""
        # Various audio samples
        test_cases = [
            b"\x00" * 100,
            struct.pack("<50h", *([1000] * 50)),
            struct.pack("<50h", *([15000] * 50)),
        ]
        for audio in test_cases:
            level = calculate_audio_level(audio)
            assert 0.0 <= level <= 1.0


class TestAudioChunking:
    """Tests for audio chunking functions."""

    def test_chunk_audio_correct_size(self):
        """Test that chunks are correct size."""
        audio = b"\x00" * (BYTES_PER_CHUNK * 3)
        chunks = chunk_audio(audio)
        assert len(chunks) == 3
        for chunk in chunks:
            assert len(chunk) == BYTES_PER_CHUNK

    def test_chunk_audio_partial_last(self):
        """Test handling of partial last chunk."""
        audio = b"\x00" * (BYTES_PER_CHUNK * 2 + 100)
        chunks = chunk_audio(audio)
        assert len(chunks) == 3
        assert len(chunks[-1]) == 100

    def test_chunk_audio_empty(self):
        """Test chunking empty audio."""
        chunks = chunk_audio(b"")
        assert chunks == []


class TestAudioValidation:
    """Tests for audio format validation."""

    def test_validate_empty_fails(self):
        """Test that empty audio fails validation."""
        assert validate_audio_format(b"") is False

    def test_validate_too_small_fails(self):
        """Test that too small audio fails."""
        assert validate_audio_format(b"\x00") is False

    def test_validate_misaligned_fails(self):
        """Test that misaligned audio fails."""
        # 3 bytes is not a multiple of 2 (sample width)
        assert validate_audio_format(b"\x00\x00\x00") is False

    def test_validate_correct_passes(self):
        """Test that correct audio passes."""
        # 4 bytes = 2 samples (16-bit each)
        assert validate_audio_format(b"\x00\x00\x00\x00") is True


class TestSilenceGeneration:
    """Tests for silence generation."""

    def test_create_silence_duration(self):
        """Test that silence has correct duration."""
        silence = create_silence(100)  # 100ms
        expected_samples = int(SAMPLE_RATE * 0.1)
        expected_bytes = expected_samples * BYTES_PER_SAMPLE
        assert len(silence) == expected_bytes

    def test_create_silence_is_zeros(self):
        """Test that silence is all zeros."""
        silence = create_silence(10)
        assert all(b == 0 for b in silence)


# =============================================================================
# Gemini Live Client Tests
# =============================================================================

class TestGeminiEventTypes:
    """Tests for Gemini event types."""

    def test_event_types_exist(self):
        """Test that all event types are defined."""
        assert GeminiEventType.AUDIO == "audio"
        assert GeminiEventType.TRANSCRIPT == "transcript"
        assert GeminiEventType.TOOL_CALL == "tool_call"
        assert GeminiEventType.TURN_COMPLETE == "turn_complete"
        assert GeminiEventType.ERROR == "error"

    def test_event_creation(self):
        """Test creating GeminiEvent objects."""
        event = GeminiEvent(
            type=GeminiEventType.AUDIO,
            data=b"test_audio",
        )
        assert event.type == GeminiEventType.AUDIO
        assert event.data == b"test_audio"

    def test_event_with_tool_call(self):
        """Test creating tool call event."""
        event = GeminiEvent(
            type=GeminiEventType.TOOL_CALL,
            tool_name="show_widget",
            tool_args={"widget_type": "workout-card", "props": {}},
            tool_id="call_123",
        )
        assert event.tool_name == "show_widget"
        assert event.tool_args["widget_type"] == "workout-card"


class TestVoiceWidgetTool:
    """Tests for voice widget tool declaration."""

    def test_tool_has_function_declarations(self):
        """Test that tool has function declarations."""
        assert "function_declarations" in VOICE_WIDGET_TOOL
        assert len(VOICE_WIDGET_TOOL["function_declarations"]) == 1

    def test_show_widget_declaration(self):
        """Test show_widget function declaration."""
        func = VOICE_WIDGET_TOOL["function_declarations"][0]
        assert func["name"] == "show_widget"
        assert "parameters" in func

    def test_widget_types_enum(self):
        """Test that widget types are defined."""
        func = VOICE_WIDGET_TOOL["function_declarations"][0]
        widget_types = func["parameters"]["properties"]["widget_type"]["enum"]

        expected_types = [
            "workout-card",
            "meal-plan",
            "recipe-card",
            "daily-checkin",
            "progress-dashboard",
            "habit-streak",
            "supplement-stack",
            "recovery-dashboard",
            "quick-actions",
        ]

        for wt in expected_types:
            assert wt in widget_types


class TestSystemPromptBuilder:
    """Tests for system prompt builder."""

    def test_build_prompt_basic(self):
        """Test building basic prompt."""
        prompt = build_voice_system_prompt()
        assert "GENESIS" in prompt
        assert "voz" in prompt.lower() or "voice" in prompt.lower()

    def test_build_prompt_with_context(self):
        """Test building prompt with user context."""
        context = {
            "name": "Carlos",
            "goals": ["muscle_gain", "fat_loss"],
            "fitness_level": "intermediate",
        }
        prompt = build_voice_system_prompt(user_context=context)
        assert "Carlos" in prompt
        assert "muscle_gain" in prompt or "Objetivos" in prompt

    def test_build_prompt_language(self):
        """Test that prompt is in Spanish by default."""
        prompt = build_voice_system_prompt(language="es")
        # Should contain Spanish keywords
        assert "responde" in prompt.lower() or "usuario" in prompt.lower()


class TestGeminiLiveClient:
    """Tests for GeminiLiveClient."""

    def test_client_initialization(self):
        """Test client can be initialized."""
        client = GeminiLiveClient()
        assert client.session is None
        assert client.is_connected is False

    def test_client_model_constant(self):
        """Test model constant is set."""
        assert GeminiLiveClient.MODEL == "gemini-live-2.5-flash-preview"

    def test_client_voice_constant(self):
        """Test default voice is set."""
        assert GeminiLiveClient.DEFAULT_VOICE == "Puck"


# =============================================================================
# Voice Session Tests
# =============================================================================

class TestVoiceSessionConfig:
    """Tests for VoiceSessionConfig."""

    def test_config_creation(self):
        """Test creating session config."""
        config = VoiceSessionConfig(
            session_id="test-123",
            user_id="user-456",
            language="en",
        )
        assert config.session_id == "test-123"
        assert config.user_id == "user-456"
        assert config.language == "en"

    def test_config_defaults(self):
        """Test config default values."""
        config = VoiceSessionConfig(session_id="test")
        assert config.user_id == "default"
        assert config.language == "es"
        assert config.voice_name is None


class TestVoiceState:
    """Tests for VoiceState enum."""

    def test_all_states_exist(self):
        """Test that all states are defined."""
        states = [VoiceState.IDLE, VoiceState.LISTENING,
                  VoiceState.PROCESSING, VoiceState.SPEAKING,
                  VoiceState.ERROR]
        assert len(states) == 5

    def test_state_values(self):
        """Test state string values."""
        assert VoiceState.IDLE.value == "idle"
        assert VoiceState.LISTENING.value == "listening"
        assert VoiceState.PROCESSING.value == "processing"
        assert VoiceState.SPEAKING.value == "speaking"
        assert VoiceState.ERROR.value == "error"


class TestPendingWidget:
    """Tests for PendingWidget dataclass."""

    def test_widget_creation(self):
        """Test creating pending widget."""
        widget = PendingWidget(
            widget_type="workout-card",
            props={"title": "Test Workout"},
        )
        assert widget.widget_type == "workout-card"
        assert widget.props["title"] == "Test Workout"


class TestVoiceSession:
    """Tests for VoiceSession class."""

    @pytest.fixture
    def mock_websocket(self):
        """Create mock WebSocket."""
        ws = AsyncMock()
        ws.send_json = AsyncMock()
        ws.receive_json = AsyncMock()
        return ws

    @pytest.fixture
    def session_config(self):
        """Create test session config."""
        return VoiceSessionConfig(
            session_id="test-session",
            user_id="test-user",
        )

    def test_session_initialization(self, mock_websocket, session_config):
        """Test session initialization."""
        session = VoiceSession(
            websocket=mock_websocket,
            config=session_config,
        )
        assert session.session_id == "test-session"
        assert session.current_state == VoiceState.IDLE

    def test_session_with_context(self, mock_websocket, session_config):
        """Test session with user context."""
        context = {"name": "Test User", "goals": ["strength"]}
        session = VoiceSession(
            websocket=mock_websocket,
            config=session_config,
            user_context=context,
        )
        assert session.user_context == context


# =============================================================================
# Router Tests (Integration)
# =============================================================================

class TestVoiceRouter:
    """Tests for voice router endpoints."""

    @pytest.fixture
    def test_client(self):
        """Create test client."""
        from fastapi.testclient import TestClient
        from main import app
        return TestClient(app)

    def test_health_endpoint(self, test_client):
        """Test voice health endpoint."""
        response = test_client.get("/voice/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "voice"
        assert "features" in data

    def test_health_features(self, test_client):
        """Test voice health features info."""
        response = test_client.get("/voice/health")
        features = response.json()["features"]
        assert features["bidirectional_audio"] is True
        assert features["widget_generation"] is True
        assert "es" in features["languages"]
        assert "en" in features["languages"]


# =============================================================================
# Integration Tests
# =============================================================================

class TestVoiceIntegration:
    """Integration tests for voice module."""

    def test_full_import_chain(self):
        """Test that all imports work together."""
        from voice import voice_router
        from voice.audio_utils import encode_audio_base64
        from voice.gemini_live import GeminiLiveClient
        from voice.session import VoiceSession

        assert voice_router is not None
        assert callable(encode_audio_base64)
        assert GeminiLiveClient is not None
        assert VoiceSession is not None

    def test_constants_consistency(self):
        """Test that constants are consistent across modules."""
        from voice.audio_utils import SAMPLE_RATE
        from voice.gemini_live import GeminiLiveClient

        # Input sample rate should match audio utils
        assert SAMPLE_RATE == 16000
        # Client should expect 16kHz input
        assert "16000" in GeminiLiveClient.INPUT_MIME_TYPE

    def test_main_app_includes_voice_router(self):
        """Test that main app includes voice router."""
        from main import app

        routes = [r.path for r in app.routes]
        assert "/ws/voice" in routes
        assert "/voice/health" in routes
