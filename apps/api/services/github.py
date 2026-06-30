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

# Stubs for GitHub PR Status API and Comment API
async def set_pr_status(repo: str, sha: str, state: str, description: str, target_url: str = None):
    """
    Sets the commit status (e.g. pending, success, failure) for the PR Blocker check.
    state: "pending" | "success" | "failure" | "error"
    """
    # Real implementation would call:
    # POST /repos/{repo}/statuses/{sha}
    pass

@dataclass
class Conflict:
    past_decision: dict
    conflicting_technology: str
    severity: str

async def post_pr_blocker_comment(repo: str, pr_number: int, conflicts: List[Conflict], app_url: str):
    """
    Posts a comment on the PR detailing the blocked intent.
    Must include the original decision reason and the author of that decision.
    """
    lines = [
        "## ❌ PR Blocked by Lore\n",
        "I found past decisions that conflict with this PR. Please review before merging.\n\n"
    ]

    for c in conflicts:
        d = c.past_decision
        
        # The exact requirement from PDF: must cite reason + author.
        author = d.get('made_by', {}).get('name', 'Unknown Author') if isinstance(d.get('made_by'), dict) else d.get('decision_author', 'Unknown Author')
        reason = d.get('reason_summary', d.get('reason', 'No reason provided.'))
        title = d.get('title', 'Unknown Decision')
        
        lines.append(f"### {title}")
        lines.append(f"You are introducing `{c.conflicting_technology}`, which violates a prior architectural constraint:")
        lines.append(f"\n> **@{author} decided:** {reason}\n")
        lines.append(f"[View full decision ->]({app_url}/decisions/{d.get('id', '')})\n")
        lines.append("---\n")

    lines.append(
        f"[To override, request sign-off from your tech lead]({app_url}/pr-check/{pr_number})"
    )
    
    # Real implementation would call:
    # POST /repos/{repo}/issues/{pr_number}/comments
    pass
