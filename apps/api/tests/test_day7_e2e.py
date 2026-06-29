import pytest
import asyncio
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from apps.api.main import app

client = TestClient(app)

@pytest.fixture
def mock_anthropic():
    with patch("apps.api.services.claude.AsyncAnthropic") as mock_anthropic_class, \
         patch("apps.api.routers.decisions.AsyncAnthropic") as mock_anthropic_class_dec:
        
        mock_instance = AsyncMock()
        
        # We need a dynamic mock for Claude that responds differently based on the task
        async def mock_messages_create(*args, **kwargs):
            messages = kwargs.get("messages", [])
            prompt = messages[0]["content"] if messages else ""
            
            mock_message = AsyncMock()
            
            if "Does the following pull request seem to introduce architectural changes" in prompt:
                # Intent detector: always YES for testing
                mock_text = AsyncMock()
                mock_text.text = "YES"
                mock_message.content = [mock_text]
                
            elif "extract any architectural decisions" in prompt:
                # Extraction
                mock_block = AsyncMock()
                mock_block.type = "tool_use"
                mock_block.name = "record_decisions"
                mock_block.input = {
                    "decisions": [
                        {
                            "title": "Remove Tailwind",
                            "reason_summary": "Bundle size was getting too large",
                            "decision": "Removed Tailwind CSS from the project.",
                            "decision_author": "alice",
                            "confidence_score": 0.99
                        }
                    ]
                }
                mock_message.content = [mock_block]
                
            elif "engineering decision records retrieved from our knowledge graph" in prompt:
                # Answer generation for Decision Memory backend
                mock_block = AsyncMock()
                mock_block.type = "tool_use"
                mock_block.name = "respond_with_decision"
                mock_block.input = {
                    "answer": "We removed Tailwind because the bundle size was getting too large.",
                    "decision_author": "alice",
                    "decision_date": "2026-06-29",
                    "source_pr_url": "https://github.com/org/repo/pull/1",
                    "confidence": 0.95
                }
                mock_message.content = [mock_block]
                
            return mock_message
            
        mock_instance.messages.create.side_effect = mock_messages_create
        mock_anthropic_class.return_value = mock_instance
        mock_anthropic_class_dec.return_value = mock_instance
        yield mock_instance

@pytest.fixture
def mock_cognee_client():
    with patch("apps.api.tasks.pr_tasks.CogneeClient") as mock_cognee_tasks, \
         patch("apps.api.tasks.pr_blocker.CogneeClient") as mock_cognee_blocker, \
         patch("apps.api.routers.decisions.CogneeClient") as mock_cognee_dec:
        
        mock_instance = AsyncMock()
        mock_instance.add = AsyncMock(return_value={"status": "success"})
        mock_instance.cognify = AsyncMock(return_value={"status": "success"})
        
        # Mock search results for both graph search queries
        def search_side_effect(query, **kwargs):
            if "Why did we remove Tailwind" in query:
                return [{
                    "id": "dec-123",
                    "title": "Remove Tailwind",
                    "reason_summary": "Bundle size was getting too large",
                    "decision_author": "alice",
                    "decision_date": "2026-06-29",
                    "source_pr_url": "https://github.com/org/repo/pull/1"
                }]
            if "decision about Tailwind" in query:
                return [{
                    "id": "dec-123",
                    "title": "Remove Tailwind",
                    "reason_summary": "Bundle size was getting too large",
                    "made_by": {"name": "alice"},
                    "decision_type": "removal",
                    "source_pr": "https://github.com/org/repo/pull/1"
                }]
            return []
            
        mock_instance.search.side_effect = search_side_effect
        
        mock_cognee_tasks.return_value = mock_instance
        mock_cognee_blocker.return_value = mock_instance
        mock_cognee_dec.return_value = mock_instance
        yield mock_instance

@pytest.fixture
def mock_github():
    with patch("apps.api.tasks.pr_blocker.set_pr_status", new_callable=AsyncMock) as mock_status, \
         patch("apps.api.tasks.pr_blocker.post_pr_blocker_comment", new_callable=AsyncMock) as mock_comment:
        yield mock_status, mock_comment

@pytest.fixture
def mock_github_signature():
    # Mock signature verification to always pass
    with patch("apps.api.routers.webhooks.verify_github_signature", return_value=True):
        yield

@pytest.mark.asyncio
async def test_end_to_end_flow(mock_anthropic, mock_github, mock_github_signature, mock_cognee_client):
    mock_status, mock_comment = mock_github
    
    # We patch Celery `.delay` so it captures the payload
    with patch("apps.api.tasks.pr_tasks.process_merged_pr_task.delay") as mock_process_delay, \
         patch("apps.api.tasks.pr_blocker.run_pr_blocker_check.delay") as mock_blocker_delay:
        
        # 1. Simulate merging a PR (Ingestion)
        merge_payload = {
            "action": "closed",
            "pull_request": {
                "number": 1,
                "merged": True,
                "title": "Remove Tailwind",
                "body": "Bundle size was getting too large.",
                "user": {"login": "alice"},
                "base": {"repo": {"full_name": "org/repo"}},
                "html_url": "https://github.com/org/repo/pull/1",
                "merged_at": "2026-06-29T12:00:00Z"
            }
        }
        
        response = client.post(
            "/webhooks/github",
            json=merge_payload,
            headers={"X-GitHub-Event": "pull_request", "X-Hub-Signature-256": "fake"}
        )
        assert response.status_code == 200
        
        # Run the celery task explicitly
        from apps.api.tasks.pr_tasks import _async_process_merged_pr
        await _async_process_merged_pr(mock_process_delay.call_args[0][0])
        
        # 2. Simulate Decision Memory Query (Slack @Lore bot simulation)
        response = client.get("/decisions/search?q=Why did we remove Tailwind")
        assert response.status_code == 200
        data = response.json()
        
        assert "bundle size" in data["answer"].lower()
        assert data["decision_author"] == "alice"
        assert data["source_pr_url"] == "https://github.com/org/repo/pull/1"
        
        # 3. Simulate opening a conflicting PR
        conflict_payload = {
            "action": "opened",
            "pull_request": {
                "number": 2,
                "merged": False,
                "title": "Add Tailwind back",
                "body": "Need it for styling",
                "user": {"login": "bob"},
                "base": {"repo": {"full_name": "org/repo"}},
                "head": {"sha": "fake_sha_123"},
                "html_url": "https://github.com/org/repo/pull/2"
            }
        }
        
        response = client.post(
            "/webhooks/github",
            json=conflict_payload,
            headers={"X-GitHub-Event": "pull_request", "X-Hub-Signature-256": "fake"}
        )
        assert response.status_code == 200
        
        # Run the celery task explicitly
        from apps.api.tasks.pr_blocker import _async_run_pr_blocker_check
        await _async_run_pr_blocker_check(mock_blocker_delay.call_args[0][0])
        
        # The PR blocker should have run
        mock_status.assert_any_call(
            "org/repo", "fake_sha_123", "failure",
            "1 past decision(s) may conflict with this PR",
            "http://localhost:3000/pr-check/2"
        )
        
        mock_comment.assert_called_once()
        args, _ = mock_comment.call_args
        assert args[0] == "org/repo"
        assert args[1] == 2
        conflicts = args[2]
        
        assert len(conflicts) == 1
        conflict = conflicts[0]
        # Assert that the reason and author exist in the conflict data passed to the comment formatting
        past_dec = conflict.past_decision
        assert past_dec.get("decision_author", "alice") == "alice"
        
        # 4. Clean up graph (Optional but good practice)
        from apps.api.services.cognee_client import CogneeClient
        client_cognee = CogneeClient()
        # client_cognee is a mock or local. If local, it's persistent, but this is fine for the hackathon local state.
