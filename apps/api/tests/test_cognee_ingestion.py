import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from apps.api.main import app
from apps.api.tasks.pr_tasks import _async_process_merged_pr
from apps.api.services.claude import ExtractedDecision
from apps.api.services.cognee_client import CogneeClient

client = TestClient(app)

@pytest.mark.asyncio
async def test_made_by_edge_creation_payload():
    """
    Tests that the process_merged_pr_task generates a payload
    that explicitly models the MADE_BY edge via nested objects for Cognee.
    """
    # Mock PR Payload
    pr_payload = {
        "action": "closed",
        "pull_request": {
            "merged": True,
            "number": 42,
            "title": "Use Redis for caching",
            "body": "Decided to use Redis",
            "user": {"login": "alice_dev"},
            "html_url": "https://github.com/org/repo/pull/42"
        }
    }

    # Mock the Claude extractor
    mock_decision = ExtractedDecision(
        title="Use Redis for caching",
        reason_summary="Faster reads",
        decision="Implement Redis backend",
        alternatives_considered=["Memcached"],
        consequences=["More memory used"],
        decision_author="alice_dev",
        contributing_authors=["bob_dev", "charlie_dev"],
        confidence_score=0.9
    )

    with patch('apps.api.tasks.pr_tasks.detect_architectural_intent', new_callable=AsyncMock) as mock_detect:
        with patch('apps.api.tasks.pr_tasks.extract_decisions', new_callable=AsyncMock) as mock_extract:
            with patch.object(CogneeClient, 'add', new_callable=AsyncMock) as mock_cognee_add:
                mock_detect.return_value = True
                mock_extract.return_value = [mock_decision]
                
                # Run the task
                result = await _async_process_merged_pr(pr_payload["pull_request"])
                
                assert result["status"] == "success"
                assert result["decisions_extracted"] == 1
                
                # Assert that cognee.add was called with the nested object schema
                mock_cognee_add.assert_called_once()
                call_args = mock_cognee_add.call_args[0][0]
                
                assert call_args["title"] == "Use Redis for caching"
                
                # Check for explicit node structuring to generate the MADE_BY edge
                assert "made_by" in call_args
                assert call_args["made_by"]["type"] == "Developer"
                assert call_args["made_by"]["name"] == "alice_dev"
                
                # Check contributing authors formatting
                assert len(call_args["contributing_authors"]) == 2
                assert call_args["contributing_authors"][0]["type"] == "Developer"
                assert call_args["contributing_authors"][0]["name"] == "bob_dev"
                assert call_args["contributing_authors"][1]["type"] == "Developer"
                assert call_args["contributing_authors"][1]["name"] == "charlie_dev"


@pytest.mark.asyncio
async def test_cognify_called_on_adr_approval():
    """
    Tests that approving an ADR triggers the Cognee cognify function.
    """
    test_decision_id = "dec-12345"
    
    with patch.object(CogneeClient, 'cognify', new_callable=AsyncMock) as mock_cognify:
        mock_cognify.return_value = {"status": "success", "result": "Graph updated"}
        
        response = client.post(f"/adrs/{test_decision_id}/approve")
        
        assert response.status_code == 200
        assert response.json()["status"] == "success"
        
        # Verify cognify was called
        mock_cognify.assert_called_once_with("architecture_decisions")

@pytest.mark.asyncio
async def test_ask_graph_completion():
    """
    Tests that Ask Lore endpoint queries GRAPH_COMPLETION and streams SSE
    """
    with patch.object(CogneeClient, 'search', new_callable=AsyncMock) as mock_search:
        # Mock what Cognee returns for GRAPH_COMPLETION
        mock_search.return_value = ["We removed Redis because of memory overhead."]
        
        # TestClient doesn't fully support async generators for streaming easily with .post,
        # but with httpx it streams the response back. We can read the text.
        response = client.post("/ask", json={"query": "Why did we remove Redis?"})
        
        assert response.status_code == 200
        text = response.text
        assert "Searching Graph..." in text
        assert "Generating..." in text
        assert "We removed Redis" in text
        
        mock_search.assert_called_once_with("Why did we remove Redis?", search_type="GRAPH_COMPLETION")
