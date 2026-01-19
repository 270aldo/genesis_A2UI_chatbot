"""Tests for V4 unified GENESIS agent across all domains.

These tests require a real GOOGLE_API_KEY to run the ADK agents.
Mark with @pytest.mark.integration to skip when no API key is available.

V4 Architecture: All responses come from GENESIS with internal specialization.
Former specialists (TEMPO, ATLAS, WAVE, etc.) are now internal domains.
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


# Training Domain - Cardio
@pytest.mark.anyio
@pytest.mark.integration
async def test_training_cardio(integration_client):
    """Test that cardio queries are handled by GENESIS (Training domain)."""
    response = await integration_client.post(
        "/api/chat",
        json={"message": "Quiero hacer cardio hoy", "session_id": "test-cardio-1"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["agent"] == "GENESIS"


@pytest.mark.anyio
@pytest.mark.integration
async def test_training_hiit(integration_client):
    """Test that HIIT queries are handled by GENESIS (Training domain)."""
    response = await integration_client.post(
        "/api/chat",
        json={"message": "Dame un entrenamiento HIIT", "session_id": "test-hiit-1"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["agent"] == "GENESIS"


# Recovery Domain - Pain/Mobility
@pytest.mark.anyio
@pytest.mark.integration
async def test_recovery_pain(integration_client):
    """Test that pain queries are handled by GENESIS (Recovery domain)."""
    response = await integration_client.post(
        "/api/chat",
        json={"message": "Me duele la espalda baja", "session_id": "test-pain-1"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["agent"] == "GENESIS"


@pytest.mark.anyio
@pytest.mark.integration
async def test_recovery_mobility(integration_client):
    """Test that mobility queries are handled by GENESIS (Recovery domain)."""
    response = await integration_client.post(
        "/api/chat",
        json={"message": "Necesito mejorar mi movilidad de cadera", "session_id": "test-mobility-1"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["agent"] == "GENESIS"


# Recovery Domain - HRV/Recovery
@pytest.mark.anyio
@pytest.mark.integration
async def test_recovery_fatigue(integration_client):
    """Test that recovery queries are handled by GENESIS (Recovery domain)."""
    response = await integration_client.post(
        "/api/chat",
        json={"message": "Estoy muy cansado, necesito recuperarme", "session_id": "test-recovery-1"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["agent"] == "GENESIS"


@pytest.mark.anyio
@pytest.mark.integration
async def test_recovery_hrv(integration_client):
    """Test that HRV queries are handled by GENESIS (Recovery domain)."""
    response = await integration_client.post(
        "/api/chat",
        json={"message": "Mi HRV está bajo, debería descansar?", "session_id": "test-hrv-1"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["agent"] == "GENESIS"


# Nutrition Domain - Metabolism
@pytest.mark.anyio
@pytest.mark.integration
async def test_nutrition_metabolism(integration_client):
    """Test that metabolic health queries are handled by GENESIS (Nutrition domain)."""
    response = await integration_client.post(
        "/api/chat",
        json={"message": "Quiero mejorar mi metabolismo", "session_id": "test-metabolism-1"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["agent"] == "GENESIS"


# Nutrition Domain - Macros
@pytest.mark.anyio
@pytest.mark.integration
async def test_nutrition_macros(integration_client):
    """Test that macro tracking queries are handled by GENESIS (Nutrition domain)."""
    response = await integration_client.post(
        "/api/chat",
        json={"message": "Cuantos gramos de proteina debo comer?", "session_id": "test-macros-1"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["agent"] == "GENESIS"


@pytest.mark.anyio
@pytest.mark.integration
async def test_nutrition_preworkout(integration_client):
    """Test that pre-workout nutrition queries are handled by GENESIS."""
    response = await integration_client.post(
        "/api/chat",
        json={"message": "Que como antes de entrenar?", "session_id": "test-preworkout-1"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["agent"] == "GENESIS"


# Nutrition Domain - Supplements
@pytest.mark.anyio
@pytest.mark.integration
async def test_nutrition_supplements(integration_client):
    """Test that supplement queries are handled by GENESIS (Nutrition domain)."""
    response = await integration_client.post(
        "/api/chat",
        json={"message": "Que suplementos me recomiendas?", "session_id": "test-supps-1"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["agent"] == "GENESIS"


@pytest.mark.anyio
@pytest.mark.integration
async def test_nutrition_creatine(integration_client):
    """Test that creatine questions are handled by GENESIS."""
    response = await integration_client.post(
        "/api/chat",
        json={"message": "Como tomo la creatina?", "session_id": "test-creatine-1"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["agent"] == "GENESIS"


# Recovery Domain - Cycle/Hormonal
@pytest.mark.anyio
@pytest.mark.integration
async def test_recovery_cycle(integration_client):
    """Test that cycle queries are handled by GENESIS (Recovery domain)."""
    response = await integration_client.post(
        "/api/chat",
        json={"message": "Estoy en mi fase luteal, como debo entrenar?", "session_id": "test-cycle-1"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["agent"] == "GENESIS"


@pytest.mark.anyio
@pytest.mark.integration
async def test_recovery_hormones(integration_client):
    """Test that hormonal queries are handled by GENESIS."""
    response = await integration_client.post(
        "/api/chat",
        json={"message": "Como afecta mi ciclo menstrual al entrenamiento?", "session_id": "test-hormones-1"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["agent"] == "GENESIS"
