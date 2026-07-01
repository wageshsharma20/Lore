import re
import httpx
import logging
from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional

logger = logging.getLogger(__name__)

@dataclass
class PRData:
    pr_number: int
    title: str
    body: str
    diff: str
    diff_summary: str
    commits: List[str]
    changed_files: List[str]
    author: str
    reviewers: List[str]
    labels: List[str]
    linked_issues: List[str]
    jira_keys: List[str]
    slack_thread_urls: List[str]
    merged_at: Optional[datetime]
    repo_full_name: str

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

async def collect_pr_data(pr_payload: dict, github_token: Optional[str] = None) -> PRData:
    """
    Given a GitHub pull_request webhook payload, fetches the rich data (diffs, commits)
    needed to build a complete PRData object using the GitHub REST API.
    Falls back to partial data from the webhook payload if the API call fails.
    """
    repo = pr_payload["base"]["repo"]["full_name"]
    pr_number = pr_payload["number"]
    body = pr_payload.get("body") or ""
    merged_at_str = pr_payload.get("merged_at")
    merged_at = datetime.fromisoformat(merged_at_str.replace("Z", "+00:00")) if merged_at_str else None

    diff = ""
    commit_messages: List[str] = []
    changed_files: List[str] = []

    if github_token:
        headers = {
            "Authorization": f"Bearer {github_token}",
            "Accept": "application/vnd.github.v3+json",
        }
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                # Fetch the unified diff
                diff_resp = await client.get(
                    f"https://api.github.com/repos/{repo}/pulls/{pr_number}",
                    headers={**headers, "Accept": "application/vnd.github.v3.diff"},
                )
                if diff_resp.status_code == 200:
                    diff = diff_resp.text

                # Fetch commit messages
                commits_resp = await client.get(
                    f"https://api.github.com/repos/{repo}/pulls/{pr_number}/commits",
                    headers=headers,
                )
                if commits_resp.status_code == 200:
                    commit_messages = [c["commit"]["message"] for c in commits_resp.json()]

                # Fetch changed files
                files_resp = await client.get(
                    f"https://api.github.com/repos/{repo}/pulls/{pr_number}/files",
                    headers=headers,
                )
                if files_resp.status_code == 200:
                    changed_files = [f["filename"] for f in files_resp.json()]

        except Exception as e:
            logger.error(f"GitHub API call failed for PR #{pr_number}: {e}")
    else:
        logger.warning(f"No GitHub token available. PR #{pr_number} data will be incomplete.")
        diff = f"# No diff available — GitHub token not configured.\n# PR: {pr_payload.get('html_url', '')}"
        commit_messages = [pr_payload.get("title", "")]

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


@dataclass
class Conflict:
    past_decision: dict
    conflicting_technology: str
    severity: str

async def set_pr_status(repo: str, sha: str, state: str, description: str, target_url: str = None, github_token: str = None):
    """
    Sets the commit status (pending/success/failure/error) for the PR Blocker check
    via the GitHub Commit Status API.
    """
    if not github_token:
        logger.warning(f"Cannot set PR status for {repo}@{sha}: no GitHub token available.")
        return

    payload = {
        "state": state,
        "description": description[:140],  # GitHub limit
        "context": "Lore / architectural-compliance",
    }
    if target_url:
        payload["target_url"] = target_url

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"https://api.github.com/repos/{repo}/statuses/{sha}",
                json=payload,
                headers={
                    "Authorization": f"Bearer {github_token}",
                    "Accept": "application/vnd.github.v3+json",
                },
            )
            if resp.status_code not in (200, 201):
                logger.error(f"Failed to set PR status: {resp.status_code} {resp.text}")
            else:
                logger.info(f"Set PR status '{state}' on {repo}@{sha[:8]}")
    except Exception as e:
        logger.error(f"Exception setting PR status: {e}")


async def post_pr_blocker_comment(repo: str, pr_number: int, conflicts: List[Conflict], app_url: str, github_token: str = None):
    """
    Posts a comment on the PR detailing which past decisions are being violated.
    """
    if not github_token:
        logger.warning(f"Cannot post PR comment on {repo}#{pr_number}: no GitHub token available.")
        return

    lines = [
        "## ❌ PR Blocked by Lore\n",
        "I found past architectural decisions that conflict with this PR. Please review before merging.\n\n"
    ]

    for c in conflicts:
        d = c.past_decision
        author = (
            d.get("made_by", {}).get("name", "Unknown Author")
            if isinstance(d.get("made_by"), dict)
            else d.get("decision_author", "Unknown Author")
        )
        reason = d.get("reason_summary", d.get("reason", "No reason provided."))
        title = d.get("title", "Unknown Decision")

        lines.append(f"### {title}")
        lines.append(f"You are introducing `{c.conflicting_technology}`, which violates a prior architectural constraint:")
        lines.append(f"\n> **@{author} decided:** {reason}\n")
        lines.append(f"[View full decision →]({app_url}/decisions/{d.get('id', '')})\n")
        lines.append("---\n")

    lines.append(f"[To override, request sign-off from your tech lead]({app_url}/pr-check/{pr_number})")

    comment_body = "\n".join(lines)

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"https://api.github.com/repos/{repo}/issues/{pr_number}/comments",
                json={"body": comment_body},
                headers={
                    "Authorization": f"Bearer {github_token}",
                    "Accept": "application/vnd.github.v3+json",
                },
            )
            if resp.status_code not in (200, 201):
                logger.error(f"Failed to post PR comment: {resp.status_code} {resp.text}")
            else:
                logger.info(f"Posted PR blocker comment on {repo}#{pr_number}")
    except Exception as e:
        logger.error(f"Exception posting PR comment: {e}")
