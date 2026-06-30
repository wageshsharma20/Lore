from typing import List

def get_active_team_members() -> List[str]:
    """
    Mock backend function representing a live DB query to the `teams` table.
    Returns the list of currently active employee usernames.
    `ghost_user` is intentionally excluded to simulate a departed author.
    """
    # In reality, this would query Postgres: SELECT username FROM users WHERE is_active=True
    return [
        "alice",
        "bob",
        "charlie",
        "dave",
        "eve"
        # "ghost_user" is omitted
    ]
