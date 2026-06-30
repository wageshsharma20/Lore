import pytest
from unittest.mock import patch, AsyncMock
from apps.api.tasks.pr_blocker import _async_run_pr_blocker_check
from apps.api.services.github import Conflict

@pytest.mark.asyncio
@patch("apps.api.tasks.pr_blocker.set_pr_status")
@patch("apps.api.tasks.pr_blocker.post_pr_blocker_comment")
@patch("apps.api.tasks.pr_blocker.find_conflicts_in_graph")
@patch("apps.api.tasks.pr_blocker.detect_pr_intent")
async def test_pr_blocker_formatting(mock_detect, mock_conflicts, mock_post_comment, mock_set_status):
    class MockIntent:
        action = "add"
        technologies = ["Tailwind"]
    mock_detect.return_value = MockIntent()
    
    mock_conflict = Conflict(
        past_decision={
            "id": "123",
            "title": "Remove Tailwind",
            "reason_summary": "Bundle size issues.",
            "decision_author": "bob"
        },
        conflicting_technology="Tailwind",
        severity="high"
    )
    
    mock_conflicts.return_value = [mock_conflict]
    
    pr_payload = {
        "number": 1,
        "base": {"repo": {"full_name": "org/repo"}},
        "head": {"sha": "abc1234"}
    }
    
    await _async_run_pr_blocker_check(pr_payload)
    
    # Assert post_pr_blocker_comment was called
    assert mock_post_comment.called
    
    # Check that the arguments passed into post_pr_blocker_comment are correct
    conflicts_arg = mock_post_comment.call_args[0][2]
    assert len(conflicts_arg) == 1
    assert conflicts_arg[0].past_decision["reason_summary"] == "Bundle size issues."
    assert conflicts_arg[0].past_decision["decision_author"] == "bob"
