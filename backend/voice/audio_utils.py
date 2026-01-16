"""
Audio Utilities for Voice Engine

Handles PCM audio encoding, decoding, and processing for WebSocket transport.

Audio Format Specifications:
- Format: PCM 16-bit signed, little-endian
- Sample rate: 16000 Hz (16kHz)
- Channels: 1 (mono)
- Chunk duration: ~100ms per chunk

Transport:
- Audio is base64-encoded for JSON WebSocket messages
"""

import base64
import struct
from dataclasses import dataclass


# Audio configuration constants
SAMPLE_RATE = 16000  # 16kHz
SAMPLE_WIDTH = 2  # 16-bit = 2 bytes
CHANNELS = 1  # Mono
CHUNK_DURATION_MS = 100  # 100ms chunks
BYTES_PER_SAMPLE = SAMPLE_WIDTH * CHANNELS
SAMPLES_PER_CHUNK = int(SAMPLE_RATE * CHUNK_DURATION_MS / 1000)
BYTES_PER_CHUNK = SAMPLES_PER_CHUNK * BYTES_PER_SAMPLE


@dataclass
class AudioChunk:
    """Represents a single audio chunk with metadata."""

    data: bytes
    sample_rate: int = SAMPLE_RATE
    sample_width: int = SAMPLE_WIDTH
    channels: int = CHANNELS

    @property
    def duration_ms(self) -> float:
        """Duration of this chunk in milliseconds."""
        return len(self.data) / BYTES_PER_SAMPLE / SAMPLE_RATE * 1000

    @property
    def sample_count(self) -> int:
        """Number of samples in this chunk."""
        return len(self.data) // BYTES_PER_SAMPLE


def encode_audio_base64(audio_bytes: bytes) -> str:
    """
    Encode raw PCM audio bytes to base64 string for WebSocket transport.

    Args:
        audio_bytes: Raw PCM audio data (16-bit signed, little-endian)

    Returns:
        Base64-encoded string
    """
    return base64.b64encode(audio_bytes).decode("utf-8")


def decode_audio_base64(encoded: str) -> bytes:
    """
    Decode base64 string back to raw PCM audio bytes.

    Args:
        encoded: Base64-encoded audio string

    Returns:
        Raw PCM audio bytes
    """
    return base64.b64decode(encoded)


def chunk_audio(audio_bytes: bytes, chunk_size: int = BYTES_PER_CHUNK) -> list[bytes]:
    """
    Split audio data into chunks of specified size.

    Args:
        audio_bytes: Raw PCM audio data
        chunk_size: Size of each chunk in bytes (default: 100ms worth)

    Returns:
        List of audio byte chunks
    """
    chunks = []
    for i in range(0, len(audio_bytes), chunk_size):
        chunk = audio_bytes[i : i + chunk_size]
        if chunk:  # Don't add empty chunks
            chunks.append(chunk)
    return chunks


def calculate_audio_level(audio_bytes: bytes) -> float:
    """
    Calculate the audio level (volume) from PCM data.
    Used for orb animation reactivity.

    Args:
        audio_bytes: Raw PCM audio data (16-bit signed, little-endian)

    Returns:
        Normalized audio level between 0.0 and 1.0
    """
    if not audio_bytes or len(audio_bytes) < 2:
        return 0.0

    # Unpack 16-bit signed samples
    num_samples = len(audio_bytes) // 2
    try:
        samples = struct.unpack(f"<{num_samples}h", audio_bytes[: num_samples * 2])
    except struct.error:
        return 0.0

    if not samples:
        return 0.0

    # Calculate RMS (Root Mean Square) for better volume representation
    sum_squares = sum(s * s for s in samples)
    rms = (sum_squares / len(samples)) ** 0.5

    # Normalize to 0-1 range (max 16-bit value is 32767)
    normalized = rms / 32767.0

    # Apply slight compression for better visual feedback
    return min(1.0, normalized * 1.5)


def validate_audio_format(audio_bytes: bytes) -> bool:
    """
    Validate that audio data appears to be valid PCM format.

    Args:
        audio_bytes: Audio data to validate

    Returns:
        True if data appears to be valid PCM audio
    """
    # Check minimum size (at least one sample)
    if not audio_bytes or len(audio_bytes) < SAMPLE_WIDTH:
        return False

    # Check alignment (must be multiple of bytes per sample)
    if len(audio_bytes) % BYTES_PER_SAMPLE != 0:
        return False

    return True


def resample_audio(audio_bytes: bytes, from_rate: int, to_rate: int) -> bytes:
    """
    Simple linear resampling of audio data.
    Note: For production, consider using a proper resampling library.

    Args:
        audio_bytes: Raw PCM audio data
        from_rate: Original sample rate
        to_rate: Target sample rate

    Returns:
        Resampled audio bytes
    """
    if from_rate == to_rate:
        return audio_bytes

    # Unpack samples
    num_samples = len(audio_bytes) // 2
    try:
        samples = list(struct.unpack(f"<{num_samples}h", audio_bytes[: num_samples * 2]))
    except struct.error:
        return audio_bytes

    # Calculate new sample count
    ratio = to_rate / from_rate
    new_num_samples = int(num_samples * ratio)

    # Linear interpolation resampling
    resampled = []
    for i in range(new_num_samples):
        src_idx = i / ratio
        idx_low = int(src_idx)
        idx_high = min(idx_low + 1, num_samples - 1)
        frac = src_idx - idx_low

        # Linear interpolation between adjacent samples
        value = int(samples[idx_low] * (1 - frac) + samples[idx_high] * frac)
        resampled.append(value)

    # Pack back to bytes
    return struct.pack(f"<{len(resampled)}h", *resampled)


def mix_audio_chunks(chunks: list[bytes]) -> bytes:
    """
    Mix multiple audio chunks together (for potential future use).

    Args:
        chunks: List of audio byte chunks (same length)

    Returns:
        Mixed audio bytes
    """
    if not chunks:
        return b""

    if len(chunks) == 1:
        return chunks[0]

    # Find minimum length
    min_len = min(len(c) for c in chunks)
    num_samples = min_len // 2

    # Unpack all chunks
    all_samples = []
    for chunk in chunks:
        try:
            samples = struct.unpack(f"<{num_samples}h", chunk[:num_samples * 2])
            all_samples.append(samples)
        except struct.error:
            continue

    if not all_samples:
        return b""

    # Mix by averaging
    mixed = []
    for i in range(num_samples):
        total = sum(samples[i] for samples in all_samples)
        avg = total // len(all_samples)
        # Clamp to 16-bit range
        mixed.append(max(-32768, min(32767, avg)))

    return struct.pack(f"<{len(mixed)}h", *mixed)


def create_silence(duration_ms: int) -> bytes:
    """
    Create silent audio of specified duration.

    Args:
        duration_ms: Duration in milliseconds

    Returns:
        Silent PCM audio bytes
    """
    num_samples = int(SAMPLE_RATE * duration_ms / 1000)
    return b"\x00" * (num_samples * BYTES_PER_SAMPLE)
