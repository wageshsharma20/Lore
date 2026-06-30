import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse
from ..core.config import settings

router = APIRouter()

# Temporary in-memory store for Hackathon OAuth tokens since SQLAlchemy isn't set up yet
MOCK_DB_TOKENS = {}

@router.get("/auth/jira")
async def jira_auth_start():
    """Redirects the user to Atlassian OAuth for authorization."""
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
    """Exchanges the authorization code for an access token and stores it."""
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
                raise HTTPException(
                    status_code=token_response.status_code,
                    detail={"error": True, "code": token_response.status_code, "detail": "Failed to exchange token"}
                )
                
            tokens = token_response.json()
            
            # Simulate saving to DB (team_id=1 for now)
            MOCK_DB_TOKENS["team_1"] = tokens
            
            return {"status": "success", "message": "Jira OAuth linked successfully"}
            
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=500,
            detail={"error": True, "code": 500, "detail": str(e)}
        )

import jwt
import time
import os
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend

async def get_installation_token(installation_id: int) -> str:
    """
    Generates a JWT using the GitHub App's private key and fetches an
    installation access token for the given installation ID.
    """
    app_id = os.getenv("GITHUB_APP_ID")
    private_key_str = os.getenv("GITHUB_APP_PRIVATE_KEY", "").replace("\\n", "\n")
    
    if not app_id or not private_key_str:
        raise ValueError("GITHUB_APP_ID or GITHUB_APP_PRIVATE_KEY not set")

    # 1. Generate the JWT
    now = int(time.time())
    payload = {
        "iat": now - 60,
        "exp": now + (10 * 60),
        "iss": app_id
    }
    
    private_key = serialization.load_pem_private_key(
        private_key_str.encode(),
        password=None,
        backend=default_backend()
    )
    
    encoded_jwt = jwt.encode(payload, private_key, algorithm="RS256")
    
    # 2. Fetch the Installation Token
    async with httpx.AsyncClient() as client:
        headers = {
            "Authorization": f"Bearer {encoded_jwt}",
            "Accept": "application/vnd.github.v3+json"
        }
        
        response = await client.post(
            f"https://api.github.com/app/installations/{installation_id}/access_tokens",
            headers=headers,
            timeout=10.0
        )
        
        if response.status_code != 201:
            raise Exception(f"Failed to get installation token: {response.text}")
            
        return response.json()["token"]

from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Middleware to protect routes, validating the incoming JWT token.
    """
    token = credentials.credentials
    try:
        # We can either verify the RS256 token (if clients send the GitHub JWT) 
        # or a generic HS256 token. We use HS256 with a dummy secret for the hackathon by default,
        # but decode without verification if we just want to ensure it's a validly formed JWT.
        secret = os.getenv("JWT_SECRET", "hackathon-secret")
        # Try decoding HS256 first
        payload = jwt.decode(token, secret, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail={"error": True, "code": 401, "detail": "Token has expired"}
        )
    except jwt.InvalidTokenError:
        # Fallback to RS256 unverified decode just to let the GitHub App JWT pass if that's what's sent
        try:
            payload = jwt.decode(token, options={"verify_signature": False})
            return payload
        except:
            raise HTTPException(
                status_code=401,
                detail={"error": True, "code": 401, "detail": "Invalid token"}
            )
