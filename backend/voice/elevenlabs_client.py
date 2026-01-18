"""
ElevenLabs Client for Streaming TTS

Handles real-time text-to-speech streaming using ElevenLabs WebSockets.
Optimized for low latency conversational responses.
"""

import asyncio
import base64
import json
import logging
import os
from typing import AsyncGenerator

import websockets

logger = logging.getLogger(__name__)

class ElevenLabsClient:
    """
    Client for ElevenLabs streaming Text-to-Speech via WebSockets.
    """

    # WebSocket URL for streaming
    # Added output_format=pcm_16000 to match frontend/audio_utils.py expectations
    WS_URL = "wss://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream-input?model_id={model_id}&output_format=pcm_16000"
    
    # Default configuration
    DEFAULT_MODEL = "eleven_turbo_v2_5" # Best for latency + multilingual
    DEFAULT_VOICE_ID = "JWPjqRAYp7xSgMn6QeWa" # GENESIS_oficial
    
    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or os.getenv("ELEVENLABS_API_KEY")
        if not self.api_key:
            logger.warning("ELEVENLABS_API_KEY not set. TTS will fail.")
            
    async def stream_audio(
        self, 
        text_iterator: AsyncGenerator[str, None],
        voice_id: str | None = None,
        model_id: str | None = None
    ) -> AsyncGenerator[bytes, None]:
        """
        Stream audio from ElevenLabs as text is generated.
        
        Args:
            text_iterator: Async generator yielding text chunks (from LLM)
            voice_id: Voice ID to use
            model_id: Model ID to use
            
        Yields:
            Audio chunks (bytes) - PCM 16kHz raw bytes
        """
        if not self.api_key:
            raise ValueError("ELEVENLABS_API_KEY is required")

        voice = voice_id or self.DEFAULT_VOICE_ID
        model = model_id or self.DEFAULT_MODEL
        
        url = self.WS_URL.format(voice_id=voice, model_id=model)
        
        try:
            async with websockets.connect(url) as ws:
                # 1. Send BOS (Beginning of Stream) message with auth
                bos_message = {
                    "text": " ",
                    "voice_settings": {
                        "stability": 0.5,
                        "similarity_boost": 0.75
                    },
                    "xi_api_key": self.api_key,
                    "authorization": f"Bearer {self.api_key}"
                }
                await ws.send(json.dumps(bos_message))
                
                # 2. Create tasks for sending text and receiving audio
                
                async def send_text():
                    async for text_chunk in text_iterator:
                        if text_chunk and text_chunk.strip():
                            # Send text chunk with try_trigger_generation
                            # This tells ElevenLabs to try to generate audio immediately for this chunk
                            await ws.send(json.dumps({
                                "text": text_chunk, 
                                "try_trigger_generation": True
                            }))
                    # Send EOS (End of Stream)
                    await ws.send(json.dumps({"text": ""}))

                async def receive_audio():
                    async for message in ws:
                        data = json.loads(message)
                        if data.get("audio"):
                            # Audio is base64 encoded PCM 16kHz
                            chunk = base64.b64decode(data["audio"])
                            yield chunk
                        if data.get("isFinal"):
                            break

                # Run sender in background, yield from receiver
                sender_task = asyncio.create_task(send_text())
                
                try:
                    async for audio_chunk in receive_audio():
                        yield audio_chunk
                finally:
                    # Ensure sender task is cleaned up/awaited if it finished or cancelled
                    if not sender_task.done():
                        sender_task.cancel()
                    else:
                        await sender_task
                    
        except Exception as e:
            logger.error(f"ElevenLabs streaming error: {e}")
            raise
