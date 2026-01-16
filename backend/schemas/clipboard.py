"""NGX GENESIS V3 - Session Clipboard Schema.

The clipboard is the centralized state that the Orchestrator maintains
for each user session. It's passed to CORES with each request, making
them stateless.

Architecture:
- Redis Memorystore: Active sessions (sub-ms latency, TTL-based expiry)
- Supabase: Durable persistence (conversation history, user profiles)
"""

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class MessageRole(str, Enum):
    """Role of a message in the conversation."""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class ConversationMessage(BaseModel):
    """A single message in the conversation history."""
    role: MessageRole
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    agent: str | None = None  # Which CORE/agent handled this
    widget_type: str | None = None  # Widget generated (if any)


class WearableSnapshot(BaseModel):
    """Latest metrics from connected wearables."""
    hrv_rmssd: float | None = None  # Heart Rate Variability (ms)
    resting_hr: int | None = None  # Resting heart rate (bpm)
    sleep_score: float | None = None  # 0-100
    sleep_hours: float | None = None
    recovery_score: float | None = None  # 0-100 (platform-specific)
    readiness_score: float | None = None  # 0-100 (NGX calculated)
    stress_level: int | None = None  # 1-10
    body_battery: int | None = None  # 0-100 (Garmin)
    strain: float | None = None  # 0-21 (Whoop)
    steps_today: int | None = None
    active_calories: int | None = None
    last_sync: datetime | None = None
    source: str | None = None  # "garmin", "oura", "whoop", "apple"


class RoutingDecision(BaseModel):
    """Record of a routing decision made by the orchestrator."""
    query: str
    selected_core: str
    confidence: float = 1.0
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    reason: str | None = None


class UserProfile(BaseModel):
    """User profile and preferences."""
    user_id: str
    name: str | None = None
    age: int | None = None
    gender: str | None = None  # "male", "female", "other", None

    # Fitness profile
    fitness_level: str | None = None  # "beginner", "intermediate", "advanced"
    primary_goal: str | None = None  # "strength", "weight_loss", "endurance"
    available_equipment: list[str] = Field(default_factory=list)
    injuries: list[str] = Field(default_factory=list)
    training_days_per_week: int | None = None

    # Nutrition profile
    dietary_restrictions: list[str] = Field(default_factory=list)
    allergies: list[str] = Field(default_factory=list)
    calorie_target: int | None = None
    protein_target_g: int | None = None

    # Health profile
    tracks_cycle: bool = False
    cycle_day: int | None = None
    cycle_phase: str | None = None  # "menstrual", "follicular", "ovulatory", "luteal"

    # Preferences
    preferred_language: str = "es"  # Spanish default
    voice_enabled: bool = False
    notification_preferences: dict[str, bool] = Field(default_factory=dict)

    # Wearables
    connected_wearables: list[str] = Field(default_factory=list)

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class SessionClipboard(BaseModel):
    """Session clipboard - centralized state for the Orchestrator.

    This is the single source of truth passed to CORES with each request.
    CORES are stateless - they receive this clipboard, process the request,
    and return a response without maintaining any internal state.

    Storage:
    - Primary: Redis (active sessions, TTL 30 min)
    - Fallback: Supabase (durable, for session recovery)
    """

    # Identifiers
    session_id: str
    user_id: str

    # User context
    user_profile: UserProfile | None = None

    # Conversation state
    session_context: list[ConversationMessage] = Field(
        default_factory=list,
        description="Last N messages in conversation"
    )

    # Wearable data
    wearable_snapshot: WearableSnapshot | None = None

    # Routing history (for analytics and debugging)
    routing_history: list[RoutingDecision] = Field(
        default_factory=list,
        description="Recent routing decisions"
    )

    # Session metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_activity: datetime = Field(default_factory=datetime.utcnow)

    # Active context (what user is currently doing)
    active_workout_id: str | None = None
    active_meal_plan_id: str | None = None
    current_intent: str | None = None

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

    def add_message(self, role: MessageRole, content: str, agent: str | None = None, widget_type: str | None = None) -> None:
        """Add a message to the conversation history."""
        message = ConversationMessage(
            role=role,
            content=content,
            agent=agent,
            widget_type=widget_type,
        )
        self.session_context.append(message)

        # Keep only last 20 messages in clipboard (full history in Supabase)
        if len(self.session_context) > 20:
            self.session_context = self.session_context[-20:]

        self.last_activity = datetime.utcnow()

    def add_routing_decision(self, query: str, core: str, confidence: float = 1.0, reason: str | None = None) -> None:
        """Record a routing decision."""
        decision = RoutingDecision(
            query=query,
            selected_core=core,
            confidence=confidence,
            reason=reason,
        )
        self.routing_history.append(decision)

        # Keep only last 10 routing decisions
        if len(self.routing_history) > 10:
            self.routing_history = self.routing_history[-10:]

    def get_context_summary(self) -> str:
        """Generate a summary of the current context for CORE prompts."""
        summary_parts = []

        if self.user_profile:
            profile = self.user_profile
            if profile.name:
                summary_parts.append(f"Usuario: {profile.name}")
            if profile.fitness_level:
                summary_parts.append(f"Nivel: {profile.fitness_level}")
            if profile.primary_goal:
                summary_parts.append(f"Objetivo: {profile.primary_goal}")
            if profile.injuries:
                summary_parts.append(f"Lesiones/limitaciones: {', '.join(profile.injuries)}")

        if self.wearable_snapshot and self.wearable_snapshot.readiness_score:
            ws = self.wearable_snapshot
            summary_parts.append(f"Readiness Score NGX: {ws.readiness_score:.0f}/100")
            if ws.hrv_rmssd:
                summary_parts.append(f"HRV: {ws.hrv_rmssd:.1f}ms")
            if ws.sleep_score:
                summary_parts.append(f"Sueño: {ws.sleep_score:.0f}/100")

        if self.active_workout_id:
            summary_parts.append(f"Entrenamiento activo: {self.active_workout_id}")

        if self.session_context:
            recent = self.session_context[-3:]
            context_str = " | ".join([f"{m.role.value}: {m.content[:50]}..." for m in recent])
            summary_parts.append(f"Contexto reciente: {context_str}")

        return "\n".join(summary_parts) if summary_parts else "Sin contexto previo"

    def to_redis_dict(self) -> dict[str, Any]:
        """Serialize for Redis storage."""
        return self.model_dump(mode="json")

    @classmethod
    def from_redis_dict(cls, data: dict[str, Any]) -> "SessionClipboard":
        """Deserialize from Redis storage."""
        return cls.model_validate(data)
