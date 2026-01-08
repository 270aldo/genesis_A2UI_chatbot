"""Pytest configuration for NGX A2UI Backend tests."""

import os
import sys
from pathlib import Path

import pytest
from dotenv import load_dotenv

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Load .env file BEFORE any imports that might use env vars
load_dotenv(project_root / ".env")

# Check if real API key is available
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
HAS_REAL_API_KEY = bool(GOOGLE_API_KEY and GOOGLE_API_KEY != "test-key")

# Set test environment variables only if not already set
if not GOOGLE_API_KEY:
    os.environ.setdefault("GOOGLE_API_KEY", "test-key")
os.environ.setdefault("LOG_LEVEL", "WARNING")


def pytest_configure(config):
    """Add custom markers."""
    config.addinivalue_line(
        "markers", "integration: tests that require real API key"
    )


@pytest.fixture(scope="session")
def anyio_backend():
    """Configure anyio backend for async tests."""
    return "asyncio"


@pytest.fixture
async def integration_client():
    """Client for integration tests that properly handles startup/shutdown."""
    from httpx import ASGITransport, AsyncClient
    from main import app, lifespan
    import main

    # Use the lifespan context manager to initialize the runner
    async with lifespan(app):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            yield ac


# Skip integration tests if no real API key
def pytest_collection_modifyitems(config, items):
    """Skip integration tests without real API key."""
    if HAS_REAL_API_KEY:
        return

    skip_integration = pytest.mark.skip(reason="Requires real GOOGLE_API_KEY")
    for item in items:
        if "integration" in item.keywords:
            item.add_marker(skip_integration)
