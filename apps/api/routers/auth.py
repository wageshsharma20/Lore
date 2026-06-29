import httpx
from fastapi import APIRouter
from fastapi.responses import RedirectResponse
from ..core.config import settings

router = APIRouter()

# Temporary in-memory store for Hackathon OAuth tokens since SQLAlchemy isn't set up yet
MOCK_DB_TOKENS = {}

@router.get("/auth/jira")
async def jira_auth_start():
    """
    Redirects the user to Atlassian OAuth for authorization.
    """
    auth_url = (
        "https://auth.atlassian.com/authorize"
        "?audience=api.atlassian.com"
        f"&client_id={settings.JIRA_CLIENT_ID}"
        "&scope=read:jira-work read:jira-user offline_access"
        f"&redirect_uri={settings.APP_URL}/auth/jira/callback"
        "&response_type=code"
        "&prompt=consent"
    )
    return RedirectResponse(auth_url)

@router.get("/auth/jira/callback")
async def jira_auth_callback(code: str):
    """
    Exchanges the authorization code for an access token and stores it.
    """
    try:
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://auth.atlassian.com/oauth/token",
                json={
                    "grant_type": "authorization_code",
                    "client_id": settings.JIRA_CLIENT_ID,
                    "client_secret": settings.JIRA_CLIENT_SECRET,
                    "code": code,
                    "redirect_uri": f"{settings.APP_URL}/auth/jira/callback"
                },
                timeout=10.0
            )
            
            if token_response.status_code != 200:
                return {"error": "Failed to exchange token", "details": token_response.text}
                
            tokens = token_response.json()
            
            # Simulate saving to DB (team_id=1 for now)
            MOCK_DB_TOKENS["team_1"] = tokens
            
            return {"status": "success", "message": "Jira OAuth linked successfully"}
            
    except Exception as e:
        return {"error": str(e)}
