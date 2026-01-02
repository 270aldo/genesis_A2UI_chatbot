"""Response schemas for chat API."""

from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


class WidgetPayload(BaseModel):
    """Widget payload for A2UI rendering."""
    
    type: str = Field(
        ...,
        description="Widget type for A2UIMediator",
        examples=["workout-card", "meal-plan", "progress-dashboard"],
    )
    
    props: dict[str, Any] = Field(
        ...,
        description="Widget-specific properties",
    )


class AgentResponse(BaseModel):
    """
    Response from chat endpoint.
    
    CRITICAL: This format MUST match exactly what the frontend expects.
    Do not modify without updating the React frontend.
    """
    
    text: str = Field(
        ...,
        description="Text response from agent",
        examples=["¡BLAZE activado! Tu sesión de fuerza está lista."],
    )
    
    agent: Literal["GENESIS", "BLAZE", "SAGE", "SPARK", "STELLA", "LOGOS"] = Field(
        ...,
        description="Agent that generated the response (UPPERCASE)",
        examples=["BLAZE", "GENESIS"],
    )
    
    payload: Optional[WidgetPayload] = Field(
        default=None,
        description="Optional widget payload for A2UI rendering",
    )
