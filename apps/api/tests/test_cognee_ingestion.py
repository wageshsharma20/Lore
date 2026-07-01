import pytest
from unittest.mock import patch, AsyncMock
from apps.api.tasks.pr_tasks import _async_process_merged_pr
from apps.api.routers.adrs import approve_adr

@pytest.mark.asyncio
@patch("apps.api.tasks.pr_tasks.CogneeClient")
@patch("apps.api.tasks.pr_tasks.extract_decisions")
@patch("apps.api.tasks.pr_tasks.detect_architectural_intent")
async def test_cognee_ingestion_made_by_edge(mock_detect, mock_extract, mock_cognee_class):
    mock_detect.return_value = True
    
    # Mocking the decision extraction
    class MockDecision:
        title = "Test Decision"
        decision = "We decided to do X."
        reason_summary = "Because Y."
        decision_author = "alice"
        contributing_authors = ["bob"]
        alternatives_considered = []
        consequences = []
        confidence_score = 0.9
        
    mock_extract.return_value = [MockDecision()]
    
    mock_client = AsyncMock()
    mock_cognee_class.return_value = mock_client
    
    pr_payload = {
        "title": "A PR", "body": "...", "number": 123, 
        "user": {"login": "alice"}, "base": {"repo": {"full_name": "org/repo"}}
    }
    
    await _async_process_merged_pr(pr_payload)
    
    assert mock_client.add.called
    added_payload = mock_client.add.call_args[0][0]
    
    # Assert MADE_BY edge implicitly created by having made_by as a dict
    assert "made_by" in added_payload
    assert added_payload["made_by"] == {"type": "Developer", "name": "alice"}
    
    # Assert cognify was called
    assert mock_client.cognify.called

@pytest.mark.asyncio
@patch("apps.api.routers.adrs.CogneeClient")
async def test_memify_called_on_adr_approval(mock_cognee_class):
    mock_client = AsyncMock()
    mock_cognee_class.return_value = mock_client
    
    # Mock the return values of memify and cognify
    mock_client.memify.return_value = {"status": "success"}
    mock_client.cognify.return_value = {"status": "success"}
    
    response = await approve_adr(decision_id="dec_123")
    
    assert mock_client.memify.called
    assert mock_client.memify.call_args[0][0] == "dec_123"
    assert mock_client.cognify.called
    assert response.status == "success"
