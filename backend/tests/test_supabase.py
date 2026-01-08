"""Tests for Supabase integration."""

import os
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

# Skip if no Supabase configured
SUPABASE_CONFIGURED = bool(
    os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_ANON_KEY")
)


@pytest.fixture
def mock_supabase():
    """Mock Supabase client for unit tests."""
    mock = MagicMock()
    mock.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = MagicMock(
        data={"id": "test-user", "name": "Test"}
    )
    mock.table.return_value.insert.return_value.execute.return_value = MagicMock(
        data={"id": "new-record"}
    )
    return mock


class TestSupabaseClient:
    """Unit tests for Supabase client functions."""

    @pytest.mark.skipif(not SUPABASE_CONFIGURED, reason="Supabase not configured")
    def test_supabase_client_initialization(self):
        """Test that Supabase client initializes correctly."""
        from services.supabase_client import supabase
        assert supabase is not None

    def test_get_user_context_mock_fallback(self):
        """Test get_user_context falls back to mock store when Supabase unavailable."""
        from tools.user_context import get_user_context

        # Should return mock context even without Supabase
        context = get_user_context("profile")
        assert context is not None
        assert isinstance(context, dict)

    def test_update_user_context_today(self):
        """Test updating daily context."""
        from tools.user_context import update_user_context

        result = update_user_context("today", {"water_ml": 500})
        assert "actualizado" in result.lower() or "registr" in result.lower()

    def test_update_user_context_streak(self):
        """Test updating streak."""
        from tools.user_context import update_user_context

        result = update_user_context("streak", {"increment": "workout"})
        assert "racha" in result.lower() or "streak" in result.lower()

    def test_update_user_context_hydration(self):
        """Test logging hydration."""
        from tools.user_context import update_user_context

        result = update_user_context("hydration", {"amount_ml": 250})
        assert "hidratación" in result.lower() or "250" in result


class TestSupabaseFunctions:
    """Tests for individual Supabase helper functions."""

    @pytest.mark.anyio
    @pytest.mark.skipif(not SUPABASE_CONFIGURED, reason="Supabase not configured")
    async def test_get_user_context_from_db_structure(self):
        """Test get_user_context_from_db returns expected structure."""
        from services.supabase_client import get_user_context_from_db

        context = await get_user_context_from_db("test-user")

        # Should have expected keys
        expected_keys = ["checkin", "pain_zones", "recent_sessions", "cycle_phase", "streak"]
        for key in expected_keys:
            assert key in context, f"Missing key: {key}"

    @pytest.mark.anyio
    async def test_save_checkin_mock(self, mock_supabase):
        """Test save_checkin with mocked Supabase."""
        # Configure mock to return a proper dict
        mock_supabase.table.return_value.upsert.return_value.execute.return_value.data = [{"id": "test"}]

        with patch("services.supabase_client.supabase", mock_supabase):
            from services.supabase_client import save_checkin

            result = await save_checkin("test-user", {
                "sleep_quality": 4,
                "energy_level": 3,
                "stress_level": 2
            })

            # Should call upsert
            mock_supabase.table.assert_called()

    @pytest.mark.anyio
    async def test_save_hydration_mock(self, mock_supabase):
        """Test save_hydration with mocked Supabase."""
        with patch("services.supabase_client.supabase", mock_supabase):
            from services.supabase_client import save_hydration

            result = await save_hydration("test-user", 500)

            # Should not raise
            assert result is None or isinstance(result, dict)


class TestMockStore:
    """Tests for mock store fallback."""

    def test_mock_store_get_context_profile(self):
        """Test mock store returns profile context."""
        from services.mock_store import store

        context = store.get_context("profile")
        assert "name" in context or context == {}

    def test_mock_store_get_context_today(self):
        """Test mock store returns today context."""
        from services.mock_store import store

        context = store.get_context("today")
        assert isinstance(context, dict)

    def test_mock_store_update_today(self):
        """Test mock store updates today context."""
        from services.mock_store import store

        store.update_today({"test_field": "test_value"})
        context = store.get_context("today")
        assert context.get("test_field") == "test_value"

    def test_mock_store_increment_streak(self):
        """Test mock store increments streak."""
        from services.mock_store import store

        initial = store.get_context("streak").get("workout", 0)
        store.increment_streak("workout")
        updated = store.get_context("streak").get("workout", 0)
        assert updated == initial + 1
