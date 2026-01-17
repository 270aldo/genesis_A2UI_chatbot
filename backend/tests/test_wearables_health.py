"""Smoke test for wearables health endpoint."""

import pytest
from httpx import ASGITransport, AsyncClient

from main import app


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio
async def test_wearables_health():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/wearables/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "providers" in data
