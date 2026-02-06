"""Request schemas for chat API."""

from typing import List, Optional, Literal

from pydantic import BaseModel, Field, ConfigDict


class Attachment(BaseModel):
    """Attachment payload for chat requests."""

    model_config = ConfigDict(populate_by_name=True)

    type: Literal["image"] = Field(
        ..., description="Attachment type"
    )
    data: str = Field(
        ..., description="Base64-encoded data (no data URI header)"
    )
    mime_type: str = Field(
        ..., alias="mimeType", description="MIME type (e.g. image/jpeg)"
    )
    name: Optional[str] = Field(default=None, description="Original filename")
    size: Optional[int] = Field(default=None, description="File size in bytes")


class ChatEvent(BaseModel):
    """Macro-action event sent alongside a chat message."""

    type: str = Field(
        ...,
        description="Event type (e.g. workout_started, workout_completed, set_logged)",
    )
    payload: dict = Field(
        default_factory=dict,
        description="Event-specific payload data",
    )


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

    user_id: str = Field(
        default="default-user",
        description="User ID for personalization and wearable context",
        examples=["user-123"],
    )

    attachments: List[Attachment] = Field(
        default_factory=list,
        description="Optional attachments (base64)"
    )

    event: Optional[ChatEvent] = Field(
        default=None,
        description="Optional macro-action event for A2UI widget lifecycle",
    )


# ============================================
# TELEMETRY / EVENTS
# ============================================

class TelemetryEvent(BaseModel):
    """Single telemetry event from frontend."""

    model_config = ConfigDict(populate_by_name=True)

    event_id: str = Field(..., alias="eventId", description="Unique event ID (UUID)")
    event_type: str = Field(..., alias="eventType", description="Event type")
    category: str = Field(..., description="Event category (widget, session, user, etc.)")

    user_id: str = Field(..., alias="userId", description="User ID")
    session_id: Optional[str] = Field(None, alias="sessionId", description="Workout session ID")
    widget_id: Optional[str] = Field(None, alias="widgetId", description="Widget ID")
    agent_id: Optional[str] = Field(None, alias="agentId", description="Agent ID")

    timestamp: str = Field(..., description="Server timestamp (ISO)")
    client_timestamp: str = Field(..., alias="clientTimestamp", description="Client timestamp (ISO)")

    platform: str = Field(default="web", description="Platform (web, ios, android)")
    app_version: str = Field(default="1.0.0", alias="appVersion", description="App version")

    properties: Optional[dict] = Field(default=None, description="Event-specific properties")


class EventsRequest(BaseModel):
    """Request body for /api/events endpoint (telemetry batch)."""

    events: List[TelemetryEvent] = Field(
        ...,
        description="Batch of telemetry events",
        min_length=1,
        max_length=100,
    )
