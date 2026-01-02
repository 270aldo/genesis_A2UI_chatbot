"""Request schemas for chat API."""

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """Request body for /api/chat endpoint."""
    
    message: str = Field(
        ...,
        description="User message to process",
        min_length=1,
        max_length=10000,
        examples=["¿Qué entreno hoy?", "Hola", "¿Por qué debo hacer deload?"],
    )
    
    session_id: str = Field(
        default="default",
        description="Session ID for conversation continuity",
        examples=["user-123-session-456"],
    )
