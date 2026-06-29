import pytest
import os
from unittest.mock import patch
from apps.api.services.cognee_client import CogneeClient

@pytest.fixture
def mock_env(monkeypatch):
    monkeypatch.setenv("COGNEE_MODE", "cloud")
    monkeypatch.setenv("COGNEE_API_KEY", "test_key")

@pytest.mark.asyncio
async def test_cognee_client_cloud_mode(mock_env):
    """Test that the client correctly initializes in cloud mode and routes requests via httpx."""
    client = CogneeClient()
    assert client.mode == "cloud"
    assert client.api_key == "test_key"
    from unittest.mock import AsyncMock, MagicMock
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        # The response itself is synchronous methods (like .json())
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"status": "success"}
        mock_post.return_value = mock_response
        
        res = await client.add({"test": "data"})
        assert res.get("status") == "success"
        mock_post.assert_called_once()

@pytest.mark.asyncio
async def test_cognee_client_local_mode(monkeypatch):
    """Test that the client falls back to local mode correctly."""
    monkeypatch.setenv("COGNEE_MODE", "local")
    client = CogneeClient()
    assert client.mode == "local"
    # Depending on whether `cognee` is installed, it either warns or sets _local_cognee.
    # We just ensure it doesn't crash.
