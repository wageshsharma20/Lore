import re
from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional

@dataclass
class PRData:
    pr_number: int
    title: str
    body: str               # PR description
    diff: str               # Full unified diff
    diff_summary: str       # AI-summarized if diff is too large
    commits: List[str]      # All commit messages
    changed_files: List[str]
    author: str
    reviewers: List[str]
    labels: List[str]
    linked_issues: List[str]  # Extracted from body: "Fixes #123"
    jira_keys: List[str]      # Extracted from body: "PROJ-123"
    slack_thread_urls: List[str]
    merged_at: Optional[datetime]
    repo_full_name: str       # "myorg/myrepo"

def extract_jira_keys(text: str) -> List[str]:
    """Matches standard Jira issue keys like PROJ-123."""
    if not text: return []
    return list(set(re.findall(r'\b[A-Z][A-Z0-9]+-\d+\b', text)))

def extract_github_issue_refs(text: str) -> List[str]:
    """Matches GitHub issue linking keywords like Fixes #123."""
    if not text: return []
    return list(set(re.findall(r'(?:fixes|closes|resolves)\s+#(\d+)', text, re.IGNORECASE)))

def extract_slack_urls(text: str) -> List[str]:
    """Matches Slack thread URLs."""
    if not text: return []
    return list(set(re.findall(r'https://[a-z0-9-]+\.slack\.com/archives/[^\s]+', text)))

# Note: The actual collect_pr_data implementation would require an HTTP client (like httpx)
# and authentication with the GitHub App to fetch the diff and commits. 
# We'll scaffold the async function structure here:

async def collect_pr_data(pr_payload: dict) -> PRData:
    """
    Given a GitHub pull_request webhook payload, fetches the necessary rich data (diffs, commits)
    to build a complete PRData object.
    """
    repo = pr_payload["base"]["repo"]["full_name"]
    pr_number = pr_payload["number"]
    
    # In a fully integrated implementation, we would use an httpx.AsyncClient here with our GitHub App JWT.
    # For now, we mock the HTTP responses that would normally populate diff and commits.
    diff = "--- a/mock.py\n+++ b/mock.py\n@@ -1,1 +1,1 @@\n-old\n+new"
    commit_messages = ["mock commit message"]
    changed_files = ["mock.py"]
    
    body = pr_payload.get("body") or ""
    merged_at_str = pr_payload.get("merged_at")
    merged_at = datetime.fromisoformat(merged_at_str.replace("Z", "+00:00")) if merged_at_str else None
    
    return PRData(
        pr_number=pr_number,
        title=pr_payload["title"],
        body=body,
        diff=diff,
        diff_summary="",
        commits=commit_messages,
        changed_files=changed_files,
        author=pr_payload["user"]["login"],
        reviewers=[r["user"]["login"] for r in pr_payload.get("requested_reviewers", [])],
        labels=[l["name"] for l in pr_payload.get("labels", [])],
        linked_issues=extract_github_issue_refs(body),
        jira_keys=extract_jira_keys(body),
        slack_thread_urls=extract_slack_urls(body),
        merged_at=merged_at,
        repo_full_name=repo
    )
