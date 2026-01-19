"""Tests for V4 unified GENESIS agent.

These tests require a real GOOGLE_API_KEY to run the ADK agents.
Mark with @pytest.mark.integration to skip when no API key is available.

V4 Architecture: All responses come from GENESIS with internal specialization.
"""

import pytest
from httpx import ASGITransport, AsyncClient

from main import app


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def client():
    """Basic client for non-integration tests."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.mark.anyio
async def test_health_endpoint(client):
    """Test health endpoint returns correct structure (V4 architecture)."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "agents" in data
    assert data["agents"]["genesis"] == "active"
    assert data["architecture"] == "V4-unified"


@pytest.mark.anyio
@pytest.mark.integration
async def test_training_domain(integration_client):
    """Test that training queries are handled by GENESIS."""
    response = await integration_client.post(
        "/api/chat",
        json={"message": "¿Qué entreno hoy?", "session_id": "test-1"}
    )
    assert response.status_code == 200
    data = response.json()
    # V4: All responses come from GENESIS
    assert data["agent"] == "GENESIS"


@pytest.mark.anyio
@pytest.mark.integration
async def test_nutrition_domain(integration_client):
    """Test that nutrition queries are handled by GENESIS."""
    response = await integration_client.post(
        "/api/chat",
        json={"message": "¿Qué como después de entrenar?", "session_id": "test-2"}
    )
    assert response.status_code == 200
    data = response.json()
    # V4: All responses come from GENESIS
    assert data["agent"] == "GENESIS"


@pytest.mark.anyio
@pytest.mark.integration
async def test_habits_domain(integration_client):
    """Test that habit queries are handled by GENESIS."""
    response = await integration_client.post(
        "/api/chat",
        json={"message": "No puedo ser consistente", "session_id": "test-3"}
    )
    assert response.status_code == 200
    data = response.json()
    # V4: All responses come from GENESIS
    assert data["agent"] == "GENESIS"


@pytest.mark.anyio
@pytest.mark.integration
async def test_analytics_domain(integration_client):
    """Test that progress queries are handled by GENESIS."""
    response = await integration_client.post(
        "/api/chat",
        json={"message": "¿Cómo voy con mis objetivos?", "session_id": "test-4"}
    )
    assert response.status_code == 200
    data = response.json()
    # V4: All responses come from GENESIS
    assert data["agent"] == "GENESIS"


@pytest.mark.anyio
@pytest.mark.integration
async def test_education_domain(integration_client):
    """Test that 'why' queries are handled by GENESIS."""
    response = await integration_client.post(
        "/api/chat",
        json={"message": "¿Por qué debo hacer deload?", "session_id": "test-5"}
    )
    assert response.status_code == 200
    data = response.json()
    # V4: All responses come from GENESIS
    assert data["agent"] == "GENESIS"


@pytest.mark.anyio
@pytest.mark.integration
async def test_genesis_greeting(integration_client):
    """Test that greetings are handled by GENESIS with quick-actions."""
    response = await integration_client.post(
        "/api/chat",
        json={"message": "Hola", "session_id": "test-6"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["agent"] == "GENESIS"
    # Should have quick-actions widget
    if data.get("payload"):
        assert data["payload"]["type"] in ["quick-actions", "genesis-quick-actions"]


@pytest.mark.anyio
@pytest.mark.integration
async def test_recovery_domain(integration_client):
    """Test that recovery queries are handled by GENESIS."""
    response = await integration_client.post(
        "/api/chat",
        json={"message": "¿Cómo está mi HRV hoy?", "session_id": "test-7"}
    )
    assert response.status_code == 200
    data = response.json()
    # V4: All responses come from GENESIS
    assert data["agent"] == "GENESIS"
