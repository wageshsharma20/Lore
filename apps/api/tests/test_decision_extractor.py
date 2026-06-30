import pytest
from apps.api.services.claude import extract_decisions
from apps.api.services.github import PRData

from unittest.mock import patch, AsyncMock

@pytest.mark.asyncio
@patch("apps.api.services.claude.AsyncAnthropic")
async def test_decision_extractor_outputs(mock_anthropic_class):
    mock_client = AsyncMock()
    mock_anthropic_class.return_value = mock_client
    
    # Mock Claude response with tool use
    class MockBlock:
        type = "tool_use"
        name = "record_decisions"
        input = {
            "decisions": [
                {
                    "title": "Migrate to Postgres",
                    "decision": "Use PostgreSQL instead of MongoDB.",
                    "reason_summary": "Need ACID compliance for billing.",
                    "decision_author": "alice",
                    "contributing_authors": [],
                    "alternatives_considered": [],
                    "consequences": [],
                    "confidence_score": 0.9
                }
            ]
        }
    
    class MockResponse:
        content = [MockBlock()]
        
    mock_client.messages.create.return_value = MockResponse()

    pr_data = PRData(
        title="Migrate to Postgres",
        body="We are switching to Postgres because we need ACID compliance for billing.",
        author="alice",
        diff="...",
        diff_summary="",
        pr_number=101,
        commits=[],
        changed_files=[],
        reviewers=[],
        labels=[],
        linked_issues=[],
        jira_keys=[],
        slack_thread_urls=[],
        merged_at=None,
        repo_full_name="test/repo"
    )

    decisions = await extract_decisions(pr_data, [], [])
    
    assert len(decisions) > 0, "Should extract at least one decision"
    
    for dec in decisions:
        assert dec.decision_author is not None and dec.decision_author != "", "Author field must always be populated"
        assert dec.reason_summary is not None and dec.reason_summary != "", "Reason must never be empty"
