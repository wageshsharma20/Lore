import pytest
from unittest.mock import patch, AsyncMock
from apps.api.services.claude import extract_decisions, detect_architectural_intent
from apps.api.services.github import PRData
from apps.api.tasks.pr_tasks import _async_process_merged_pr
from apps.api.tasks.pr_blocker import _async_run_pr_blocker_check

@pytest.fixture
def sample_pr_data():
    return PRData(
        title="Remove Tailwind",
        body="Bundle size is too big.",
        author="alice",
        diff="--- a/package.json\n+++ b/package.json\n- \"tailwindcss\": \"^3.0.0\",\n",
        diff_summary="Removed tailwindcss",
        pr_number=123,
        commits=[],
        changed_files=[],
        reviewers=[],
        labels=[],
        linked_issues=[],
        jira_keys=[],
        slack_thread_urls=[],
        merged_at="2026-06-29T12:00:00Z",
        repo_full_name="org/repo"
    )

@pytest.mark.asyncio
async def test_decision_extractor_author_populated(sample_pr_data):
    """Test Decision Extractor (assert author field always populated)."""
    with patch("apps.api.services.claude.AsyncAnthropic") as mock_anthropic:
        mock_instance = AsyncMock()
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
        
        mock_message = AsyncMock()
        mock_message.content = [mock_block]
        mock_instance.messages.create.return_value = mock_message
        mock_anthropic.return_value = mock_instance

        decisions = await extract_decisions(sample_pr_data, [], [])
        
        assert len(decisions) == 1
        assert decisions[0].decision_author == "alice"
        assert decisions[0].title == "Remove Tailwind"

@pytest.mark.asyncio
async def test_intent_detector(sample_pr_data):
    """Test Intent Detector returns True when Claude replies YES."""
    with patch("apps.api.services.claude.AsyncAnthropic") as mock_anthropic:
        mock_instance = AsyncMock()
        mock_text = AsyncMock()
        mock_text.text = "YES - This is an architectural change."
        
        mock_message = AsyncMock()
        mock_message.content = [mock_text]
        mock_instance.messages.create.return_value = mock_message
        mock_anthropic.return_value = mock_instance

        result = await detect_architectural_intent(sample_pr_data)
        assert result is True

@pytest.mark.asyncio
async def test_intent_detector_negative(sample_pr_data):
    """Test Intent Detector returns False when Claude replies NO."""
    with patch("apps.api.services.claude.AsyncAnthropic") as mock_anthropic:
        mock_instance = AsyncMock()
        mock_text = AsyncMock()
        mock_text.text = "NO - Just a typo fix."
        
        mock_message = AsyncMock()
        mock_message.content = [mock_text]
        mock_instance.messages.create.return_value = mock_message
        mock_anthropic.return_value = mock_instance

        result = await detect_architectural_intent(sample_pr_data)
        assert result is False

@pytest.mark.asyncio
async def test_cognee_roundtrip_made_by_edge(sample_pr_data):
    """Test Cognee roundtrip (assert MADE_BY edge exists)."""
    with patch("apps.api.tasks.pr_tasks.detect_architectural_intent", return_value=True), \
         patch("apps.api.tasks.pr_tasks.extract_decisions") as mock_extract, \
         patch("apps.api.tasks.pr_tasks.CogneeClient") as mock_cognee:
        
        # Mock extracted decision
        mock_decision = AsyncMock()
        mock_decision.title = "Remove Tailwind"
        mock_decision.decision = "Removed Tailwind"
        mock_decision.reason_summary = "Bundle size"
        mock_decision.decision_author = "bob"
        mock_decision.contributing_authors = ["charlie"]
        mock_decision.alternatives_considered = []
        mock_decision.consequences = []
        mock_decision.confidence_score = 0.95
        
        mock_extract.return_value = [mock_decision]
        
        # Mock cognee client
        mock_client = AsyncMock()
        mock_client.add = AsyncMock()
        mock_client.cognify = AsyncMock()
        mock_cognee.return_value = mock_client
        
        payload = {
            "number": 123,
            "title": "Remove Tailwind",
            "html_url": "https://github.com/org/repo/pull/123"
        }
        
        await _async_process_merged_pr(payload)
        
        # Assert Cognee .add was called
        mock_client.add.assert_called_once()
        db_payload, _ = mock_client.add.call_args
        data = db_payload[0]
        
        # Assert MADE_BY edge exists implicitly via nested Developer node
        assert "made_by" in data
        assert data["made_by"] == {"type": "Developer", "name": "bob"}
        assert data["contributing_authors"] == [{"type": "Developer", "name": "charlie"}]

@pytest.mark.asyncio
async def test_pr_blocker_comment_content():
    """Test PR Blocker comment content (assert reason + author present)."""
    with patch("apps.api.tasks.pr_blocker.set_pr_status", new_callable=AsyncMock) as mock_status, \
         patch("apps.api.tasks.pr_blocker.post_pr_blocker_comment", new_callable=AsyncMock) as mock_comment, \
         patch("apps.api.tasks.pr_blocker.find_conflicts_in_graph", new_callable=AsyncMock) as mock_find:
        
        # Mock the conflict to include reason and author
        mock_conflict = AsyncMock()
        mock_conflict.is_conflict = True
        mock_conflict.conflict_reason = "Adding it back is bad"
        mock_conflict.severity = "high"
        mock_conflict.past_decision = {
            "title": "Remove Tailwind",
            "reason_summary": "Bundle size was getting too large",
            "decision_author": "alice"
        }
        
        mock_find.return_value = [mock_conflict]
        
        payload = {
            "pull_request": {
                "number": 2,
                "base": {"repo": {"full_name": "org/repo"}},
                "head": {"sha": "fake"}
            }
        }
        
        await _async_run_pr_blocker_check(payload)
        
        # Verify comment was posted
        mock_comment.assert_called_once()
        args, _ = mock_comment.call_args
        
        # Extract the list of conflicts passed to the comment formatting
        conflicts = args[2]
        assert len(conflicts) == 1
        
        # Assert reason + author are present in the conflict object passed to the commenter
        conflict_data = conflicts[0]
        past_decision = conflict_data.past_decision
        
        assert past_decision["decision_author"] == "alice"
        assert past_decision["reason_summary"] == "Bundle size was getting too large"
