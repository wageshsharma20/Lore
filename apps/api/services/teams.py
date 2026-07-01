from typing import List
import os

def get_active_team_members() -> List[str]:
    """
    Returns the list of currently active employee usernames.
    Reads from the TEAM_MEMBERS environment variable (comma-separated).
    Example: TEAM_MEMBERS="alice,bob,charlie,dave,eve"
    Falls back to an empty list if not configured.
    """
    raw = os.getenv("TEAM_MEMBERS", "")
    if not raw.strip():
        return []
    return [name.strip() for name in raw.split(",") if name.strip()]
