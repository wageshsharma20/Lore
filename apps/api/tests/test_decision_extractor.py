import pytest
import os
from apps.api.services.gemini_service import extract_decisions
from apps.api.services.github import PRData
from unittest.mock import patch, AsyncMock
import json
from apps.api.services.gemini_service import ExtractedDecision, ExtractedDecisions

@pytest.mark.asyncio
@patch("apps.api.services.gemini_service.get_llm_client")
async def test_decision_extractor_outputs(mock_get_llm_client):
    os.environ["GROQ_API_KEY"] = "test-key"
    mock_client = AsyncMock()
    mock_get_llm_client.return_value = mock_client
    
    # Mock Instructor response
    mock_response = ExtractedDecisions(
        decisions=[
            ExtractedDecision(
                title="Migrate to Postgres",
                decision="Use PostgreSQL instead of MongoDB.",
                reason_summary="Need ACID compliance for billing.",
                decision_author="alice",
                contributing_authors=[],
                alternatives_considered=[],
                consequences=[],
                confidence_score=0.9,
                source_pr="test/repo/101"
            )
        ]
    )
    
    mock_client.chat.completions.create.return_value = mock_response


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
