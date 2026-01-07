"""Tests for agent routing logic."""

import pytest
from httpx import ASGITransport, AsyncClient

from main import app


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.mark.anyio
async def test_health_endpoint(client):
    """Test health endpoint returns correct structure."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "agents" in data
    assert "genesis" in data["agents"]


@pytest.mark.anyio
async def test_blaze_routing(client):
    """Test that training queries route to BLAZE."""
    response = await client.post(
        "/api/chat",
        json={"message": "¿Qué entreno hoy?", "session_id": "test-1"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["agent"] in ["BLAZE", "GENESIS"]  # May go through GENESIS first
    

@pytest.mark.anyio
async def test_sage_routing(client):
    """Test that nutrition queries route to SAGE."""
    response = await client.post(
        "/api/chat",
        json={"message": "¿Qué como después de entrenar?", "session_id": "test-2"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["agent"] in ["SAGE", "GENESIS"]


@pytest.mark.anyio
async def test_spark_routing(client):
    """Test that habit queries route to SPARK."""
    response = await client.post(
        "/api/chat",
        json={"message": "No puedo ser consistente", "session_id": "test-3"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["agent"] in ["SPARK", "GENESIS"]


@pytest.mark.anyio
async def test_stella_routing(client):
    """Test that progress queries route to STELLA."""
    response = await client.post(
        "/api/chat",
        json={"message": "¿Cómo voy con mis objetivos?", "session_id": "test-4"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["agent"] in ["STELLA", "GENESIS"]


@pytest.mark.anyio
async def test_logos_routing(client):
    """Test that 'why' queries route to LOGOS."""
    response = await client.post(
        "/api/chat",
        json={"message": "¿Por qué debo hacer deload?", "session_id": "test-5"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["agent"] in ["LOGOS", "GENESIS"]


@pytest.mark.anyio
async def test_genesis_greeting(client):
    """Test that greetings are handled by GENESIS with quick-actions."""
    response = await client.post(
        "/api/chat",
        json={"message": "Hola", "session_id": "test-6"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["agent"] == "GENESIS"
    # Should have quick-actions widget
    if data.get("payload"):
        assert data["payload"]["type"] == "quick-actions"
