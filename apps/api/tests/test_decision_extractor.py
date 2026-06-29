import pytest
import datetime
from unittest.mock import AsyncMock, MagicMock
from apps.api.services.github import PRData
from apps.api.services.claude import extract_decisions, ExtractedDecision

@pytest.mark.asyncio
async def test_extract_decisions_author_population():
    # 1. Setup the synthetic PR Data
    pr_data = PRData(
        pr_number=101,
        title="Migrate database from MySQL to PostgreSQL",
        body="We are switching to Postgres to utilize pgvector for our AI features.",
        diff="--- a/db.py\n+++ b/db.py\n- db = MySQL()\n+ db = Postgres()",
        diff_summary="",
        commits=["feat: switch to postgres"],
        changed_files=["db.py"],
        author="Rishii12",
        reviewers=[],
        labels=["database"],
        linked_issues=[],
        jira_keys=["LORE-42"],
        slack_thread_urls=[],
        merged_at=datetime.datetime.now(),
        repo_full_name="topoteretes/lore"
    )

    # 2. Mock the Anthropic Client response
    mock_client = AsyncMock()
    
    # Create the mock ToolUseBlock that Claude would return
    mock_tool_use = MagicMock()
    mock_tool_use.type = "tool_use"
    mock_tool_use.name = "record_decisions"
    mock_tool_use.input = {
        "decisions": [
            {
                "title": "Migrate to PostgreSQL",
                "context": "Need pgvector for AI features",
                "decision": "Replaced MySQL with PostgreSQL across the stack.",
                "alternatives_considered": ["MongoDB", "Neo4j"],
                "consequences": ["Requires data migration script"],
                "author": "wrong_author", # The AI hallucinates a wrong author
                "confidence_score": 0.95
            }
        ]
    }
    
    # Setup the mock message structure
    mock_message = MagicMock()
    mock_message.content = [mock_tool_use]
    mock_client.messages.create.return_value = mock_message

    # 3. Create synthetic Jira context
    from apps.api.services.jira import JiraTicket
    jira_tickets = [
        JiraTicket(
            key="LORE-42",
            summary="Setup pgvector for embeddings",
            description="We need pgvector to do semantic search over the graph.",
            status="In Progress",
            priority="High",
            assignee="John Doe",
            reporter="Jane Smith"
        )
    ]

    slack_threads = [
        "Jane Smith (10:00 AM): I think we need to switch to pgvector to get the graph embeddings working.",
        "John Doe (10:05 AM): Agreed. I'll make the PR for the Postgres migration now."
    ]

    # 4. Execute the function
    extracted = await extract_decisions(pr_data, jira_tickets=jira_tickets, slack_threads=slack_threads, client=mock_client)

    # 5. Assertions
    assert len(extracted) == 1
    decision = extracted[0]
    
    assert isinstance(decision, ExtractedDecision)
    assert decision.title == "Migrate to PostgreSQL"
    assert decision.confidence_score == 0.95
    
    # CRITICAL HACKATHON REQUIREMENT: 
    # Ensure our logic overrides the AI's hallucinated author with the actual PR author
    assert decision.author == "Rishii12"
    assert decision.author != "wrong_author"

from apps.api.services.claude import summarize_diff

@pytest.mark.asyncio
async def test_summarize_diff_short_optimization():
    # 1. Short diff should immediately return without calling the API
    short_diff = "--- a/test.py\n+++ b/test.py\n+print('hello')"
    result = await summarize_diff(short_diff)
    assert result == short_diff
