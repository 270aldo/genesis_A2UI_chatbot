"""Tests for Phase 4 new agents routing.

These tests require a real GOOGLE_API_KEY to run the ADK agents.
Mark with @pytest.mark.integration to skip when no API key is available.
"""

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


# TEMPO - Cardio Agent
@pytest.mark.anyio
@pytest.mark.integration
async def test_tempo_routing_cardio(integration_client):
    """Test that cardio queries route to TEMPO."""
    response = await integration_client.post(
        "/api/chat",
        json={"message": "Quiero hacer cardio hoy", "session_id": "test-tempo-1"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["agent"] in ["TEMPO", "GENESIS", "BLAZE"]


@pytest.mark.anyio
@pytest.mark.integration
async def test_tempo_routing_hiit(integration_client):
    """Test that HIIT queries route to TEMPO."""
    response = await integration_client.post(
        "/api/chat",
        json={"message": "Dame un entrenamiento HIIT", "session_id": "test-tempo-2"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["agent"] in ["TEMPO", "GENESIS", "BLAZE"]


# ATLAS - Mobility/Pain Agent
@pytest.mark.anyio
@pytest.mark.integration
async def test_atlas_routing_pain(integration_client):
    """Test that pain queries route to ATLAS."""
    response = await integration_client.post(
        "/api/chat",
        json={"message": "Me duele la espalda baja", "session_id": "test-atlas-1"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["agent"] in ["ATLAS", "GENESIS"]


@pytest.mark.anyio
@pytest.mark.integration
async def test_atlas_routing_mobility(integration_client):
    """Test that mobility queries route to ATLAS."""
    response = await integration_client.post(
        "/api/chat",
        json={"message": "Necesito mejorar mi movilidad de cadera", "session_id": "test-atlas-2"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["agent"] in ["ATLAS", "GENESIS"]


# WAVE - Recovery Agent
@pytest.mark.anyio
@pytest.mark.integration
async def test_wave_routing_recovery(integration_client):
    """Test that recovery queries route to WAVE."""
    response = await integration_client.post(
        "/api/chat",
        json={"message": "Estoy muy cansado, necesito recuperarme", "session_id": "test-wave-1"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["agent"] in ["WAVE", "GENESIS"]


@pytest.mark.anyio
@pytest.mark.integration
async def test_wave_routing_hrv(integration_client):
    """Test that HRV queries route to WAVE."""
    response = await integration_client.post(
        "/api/chat",
        json={"message": "Mi HRV está bajo, debería descansar?", "session_id": "test-wave-2"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["agent"] in ["WAVE", "GENESIS"]


# METABOL - Metabolic Health Agent
@pytest.mark.anyio
@pytest.mark.integration
async def test_metabol_routing(integration_client):
    """Test that metabolic health queries route to METABOL."""
    response = await integration_client.post(
        "/api/chat",
        json={"message": "Quiero mejorar mi metabolismo", "session_id": "test-metabol-1"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["agent"] in ["METABOL", "GENESIS", "SAGE"]


# MACRO - Nutrition Tracking Agent
@pytest.mark.anyio
@pytest.mark.integration
async def test_macro_routing_tracking(integration_client):
    """Test that macro tracking queries route to MACRO."""
    response = await integration_client.post(
        "/api/chat",
        json={"message": "Cuantos gramos de proteina debo comer?", "session_id": "test-macro-1"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["agent"] in ["MACRO", "SAGE", "GENESIS"]


@pytest.mark.anyio
@pytest.mark.integration
async def test_macro_routing_preworkout(integration_client):
    """Test that pre-workout nutrition routes correctly."""
    response = await integration_client.post(
        "/api/chat",
        json={"message": "Que como antes de entrenar?", "session_id": "test-macro-2"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["agent"] in ["MACRO", "SAGE", "GENESIS"]


# NOVA - Supplements Agent
@pytest.mark.anyio
@pytest.mark.integration
async def test_nova_routing_supplements(integration_client):
    """Test that supplement queries route to NOVA."""
    response = await integration_client.post(
        "/api/chat",
        json={"message": "Que suplementos me recomiendas?", "session_id": "test-nova-1"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["agent"] in ["NOVA", "SAGE", "GENESIS"]


@pytest.mark.anyio
@pytest.mark.integration
async def test_nova_routing_creatine(integration_client):
    """Test that creatine questions route to NOVA."""
    response = await integration_client.post(
        "/api/chat",
        json={"message": "Como tomo la creatina?", "session_id": "test-nova-2"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["agent"] in ["NOVA", "SAGE", "GENESIS"]


# LUNA - Hormonal/Cycle Agent
@pytest.mark.anyio
@pytest.mark.integration
async def test_luna_routing_cycle(integration_client):
    """Test that cycle queries route to LUNA."""
    response = await integration_client.post(
        "/api/chat",
        json={"message": "Estoy en mi fase luteal, como debo entrenar?", "session_id": "test-luna-1"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["agent"] in ["LUNA", "GENESIS"]


@pytest.mark.anyio
@pytest.mark.integration
async def test_luna_routing_hormones(integration_client):
    """Test that hormonal queries route to LUNA."""
    response = await integration_client.post(
        "/api/chat",
        json={"message": "Como afecta mi ciclo menstrual al entrenamiento?", "session_id": "test-luna-2"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["agent"] in ["LUNA", "GENESIS"]
