import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from apps.api.main import app

client = TestClient(app)

@pytest.fixture
def mock_cognee_client():
    with patch("apps.api.routers.decisions.CogneeClient") as mock_client_class:
        mock_instance = AsyncMock()
        # Mock search results for GRAPH_COMPLETION
        mock_instance.search.return_value = [
            {
                "id": "dec-123",
                "title": "Use AWS",
                "reason_summary": "We chose AWS for better scaling",
                "decision_author": "rishi",
                "decision_date": "2026-06-01",
                "source_pr": "https://github.com/org/repo/pull/1"
            }
        ]
        mock_client_class.return_value = mock_instance
        yield mock_instance

@pytest.fixture
def mock_anthropic():
    with patch("apps.api.routers.decisions.AsyncAnthropic") as mock_anthropic_class:
        mock_instance = AsyncMock()
        
        # Mocking the Claude tool use response
        mock_message = AsyncMock()
        mock_block = AsyncMock()
        mock_block.type = "tool_use"
        mock_block.name = "respond_with_decision"
        mock_block.input = {
            "answer": "We chose AWS because of better scaling.",
            "decision_author": "rishi",
            "decision_date": "2026-06-01",
            "source_pr_url": "https://github.com/org/repo/pull/1",
            "confidence": 0.95
        }
        mock_message.content = [mock_block]
        mock_instance.messages.create.return_value = mock_message
        
        mock_anthropic_class.return_value = mock_instance
        yield mock_instance

@pytest.fixture
def mock_github_api():
    with patch("apps.api.tasks.pr_blocker.set_pr_status", new_callable=AsyncMock) as mock_status, \
         patch("apps.api.tasks.pr_blocker.post_pr_blocker_comment", new_callable=AsyncMock) as mock_comment:
        yield mock_status, mock_comment

@pytest.fixture
def mock_pr_cognee():
    with patch("apps.api.tasks.pr_blocker.CogneeClient") as mock_client_class:
        mock_instance = AsyncMock()
        mock_instance.search.return_value = [
            {
                "id": "dec-123",
                "title": "Remove Tailwind",
                "reason_summary": "Bundle size was getting too large",
                "made_by": {"name": "alice"},
                "decision_date": "2026-06-03",
                "decision_type": "removal",
                "source_pr": "https://github.com/org/repo/pull/2"
            }
        ]
        mock_client_class.return_value = mock_instance
        yield mock_instance

def test_decision_search_endpoint(mock_cognee_client, mock_anthropic):
    response = client.get("/decisions/search?q=Why did we use AWS")
    assert response.status_code == 200
    
    data = response.json()
    assert "answer" in data
    assert data["decision_author"] == "rishi"
    assert data["decision_date"] == "2026-06-01"
    assert data["source_pr_url"] == "https://github.com/org/repo/pull/1"
    assert data["confidence"] == 0.95
    
    mock_cognee_client.search.assert_called_once_with("Why did we use AWS", search_type="GRAPH_COMPLETION")

@pytest.mark.asyncio
async def test_pr_blocker_task(mock_github_api, mock_pr_cognee):
    from apps.api.tasks.pr_blocker import _async_run_pr_blocker_check
    
    mock_status, mock_comment = mock_github_api
    
    pr_payload = {
        "number": 42,
        "title": "Add tailwind back",
        "body": "We need tailwind for the new dashboard",
        "base": {"repo": {"full_name": "org/repo"}},
        "head": {"sha": "abcdef"}
    }
    
    await _async_run_pr_blocker_check(pr_payload)
    
    # 1. Should have called set status pending
    mock_status.assert_any_call(
        "org/repo", "abcdef", "pending",
        "Lore is checking decision history...",
        "http://localhost:3000/pr-check/42"
    )
    
    # 2. Should have found conflicts and called set status failure
    mock_status.assert_any_call(
        "org/repo", "abcdef", "failure",
        "1 past decision(s) may conflict with this PR",
        "http://localhost:3000/pr-check/42"
    )
    
    # 3. Should have called post_pr_blocker_comment
    mock_comment.assert_called_once()
    args, _ = mock_comment.call_args
    assert args[0] == "org/repo"
    assert args[1] == 42
    
    conflicts = args[2]
    assert len(conflicts) == 1
    assert conflicts[0].conflicting_technology == "Tailwind"
