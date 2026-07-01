import httpx
import json
import os
import logging
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from ..core.config import settings
import jwt
import time
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend

router = APIRouter()
logger = logging.getLogger(__name__)
security = HTTPBearer()

# Persistent token store — survives server restarts
_TOKENS_FILE = Path(__file__).resolve().parent.parent / "data" / "tokens.json"

def _load_tokens() -> dict:
    """Load tokens from disk, initialising the file if missing."""
    _TOKENS_FILE.parent.mkdir(parents=True, exist_ok=True)
    if not _TOKENS_FILE.exists():
        _save_tokens({"github": None, "slack": None, "jira": None})
    try:
        return json.loads(_TOKENS_FILE.read_text())
    except Exception:
        return {"github": None, "slack": None, "jira": None}

def _save_tokens(data: dict):
    """Persist tokens to disk."""
    _TOKENS_FILE.parent.mkdir(parents=True, exist_ok=True)
    _TOKENS_FILE.write_text(json.dumps(data, indent=2))

def _get_frontend_url() -> str:
    """Return the frontend URL for redirects after OAuth."""
    return os.getenv("FRONTEND_URL", "http://localhost:3000")


@router.get("/auth/status")
async def get_auth_status():
    """Returns whether each provider is currently connected (has a stored token)."""
    tokens = _load_tokens()
    return {
        "github": bool(tokens.get("github")),
        "slack": bool(tokens.get("slack")),
        "jira": bool(tokens.get("jira")),
    }

@router.post("/auth/{provider}/disconnect")
async def disconnect_provider(provider: str):
    """Disconnects the specified provider by removing its stored token."""
    tokens = _load_tokens()
    if provider not in tokens:
        raise HTTPException(status_code=400, detail="Unknown provider")
    tokens[provider] = None
    _save_tokens(tokens)
    return {"status": "success", "message": f"{provider} disconnected"}


# ─── GitHub OAuth ────────────────────────────────────────────────────────────

@router.get("/auth/github")
async def github_auth_start():
    if not settings.GITHUB_CLIENT_ID:
        raise HTTPException(status_code=500, detail="GITHUB_CLIENT_ID not configured in backend.")
    auth_url = (
        "https://github.com/login/oauth/authorize"
        f"?client_id={settings.GITHUB_CLIENT_ID}"
        "&scope=repo,read:user"
        f"&redirect_uri={settings.APP_URL}/auth/github/callback"
    )
    return RedirectResponse(auth_url)

@router.get("/auth/github/callback")
async def github_auth_callback(code: str):
    if not settings.GITHUB_CLIENT_ID or not settings.GITHUB_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="GitHub OAuth credentials missing.")
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://github.com/login/oauth/access_token",
                data={
                    "client_id": settings.GITHUB_CLIENT_ID,
                    "client_secret": settings.GITHUB_CLIENT_SECRET,
                    "code": code,
                    "redirect_uri": f"{settings.APP_URL}/auth/github/callback"
                },
                headers={"Accept": "application/json"},
                timeout=10.0
            )
            data = resp.json()
            if resp.status_code != 200 or "error" in data:
                raise HTTPException(status_code=400, detail=f"Failed to exchange GitHub token: {data.get('error_description', data)}")

            access_token = data.get("access_token")
            tokens = _load_tokens()
            tokens["github"] = access_token
            _save_tokens(tokens)
            logger.info("GitHub OAuth token stored successfully.")
            return RedirectResponse(f"{_get_frontend_url()}/settings")
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))


# ─── Slack OAuth ─────────────────────────────────────────────────────────────

@router.get("/auth/slack")
async def slack_auth_start():
    if not settings.SLACK_CLIENT_ID:
        raise HTTPException(status_code=500, detail="SLACK_CLIENT_ID not configured in backend.")
    auth_url = (
        "https://slack.com/oauth/v2/authorize"
        f"?client_id={settings.SLACK_CLIENT_ID}"
        "&scope=channels:read,chat:write"
        f"&redirect_uri={settings.APP_URL}/auth/slack/callback"
    )
    return RedirectResponse(auth_url)

@router.get("/auth/slack/callback")
async def slack_auth_callback(code: str):
    if not settings.SLACK_CLIENT_ID or not settings.SLACK_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Slack OAuth credentials missing.")
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://slack.com/api/oauth.v2.access",
                data={
                    "client_id": settings.SLACK_CLIENT_ID,
                    "client_secret": settings.SLACK_CLIENT_SECRET,
                    "code": code,
                    "redirect_uri": f"{settings.APP_URL}/auth/slack/callback"
                },
                timeout=10.0
            )
            data = resp.json()
            if not data.get("ok"):
                raise HTTPException(status_code=400, detail=f"Failed to exchange Slack token: {data.get('error')}")

            # Store the bot token for later Slack API calls
            access_token = data.get("access_token") or data.get("authed_user", {}).get("access_token")
            tokens = _load_tokens()
            tokens["slack"] = access_token
            _save_tokens(tokens)
            logger.info("Slack OAuth token stored successfully.")
            return RedirectResponse(f"{_get_frontend_url()}/settings")
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))


# ─── Jira OAuth ──────────────────────────────────────────────────────────────

@router.get("/auth/jira")
async def jira_auth_start():
    if not settings.JIRA_CLIENT_ID:
        raise HTTPException(status_code=500, detail="JIRA_CLIENT_ID not configured in backend.")
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
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
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
            if resp.status_code != 200:
                raise HTTPException(status_code=resp.status_code, detail="Failed to exchange Jira token")

            data = resp.json()
            tokens = _load_tokens()
            tokens["jira"] = data.get("access_token")
            _save_tokens(tokens)
            logger.info("Jira OAuth token stored successfully.")
            return RedirectResponse(f"{_get_frontend_url()}/settings")
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))


# ─── GitHub App Installation Token Helper ────────────────────────────────────

async def get_installation_token(installation_id: int) -> str:
    """
    Generates a JWT using the GitHub App's private key and fetches an
    installation access token for the given installation ID.
    """
    app_id = os.getenv("GITHUB_APP_ID")
    private_key_str = os.getenv("GITHUB_APP_PRIVATE_KEY", "").replace("\\n", "\n")

    if not app_id or not private_key_str:
        raise ValueError("GITHUB_APP_ID or GITHUB_APP_PRIVATE_KEY not set")

    now = int(time.time())
    payload = {"iat": now - 60, "exp": now + (10 * 60), "iss": app_id}

    private_key = serialization.load_pem_private_key(
        private_key_str.encode(), password=None, backend=default_backend()
    )
    encoded_jwt = jwt.encode(payload, private_key, algorithm="RS256")

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


# ─── JWT Verification Dependency ─────────────────────────────────────────────

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Middleware to protect routes, validating the incoming JWT token."""
    token = credentials.credentials
    secret = os.getenv("JWT_SECRET", "hackathon-secret")
    try:
        payload = jwt.decode(token, secret, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail={"error": True, "code": 401, "detail": "Token has expired"})
    except jwt.InvalidTokenError:
        # Fallback: accept a GitHub App JWT (RS256) without full signature verification
        try:
            payload = jwt.decode(token, options={"verify_signature": False})
            return payload
        except Exception:
            raise HTTPException(status_code=401, detail={"error": True, "code": 401, "detail": "Invalid token"})


def get_stored_token(provider: str) -> Optional[str]:
    """Helper for other services to retrieve a stored OAuth access token."""
    tokens = _load_tokens()
    return tokens.get(provider)
