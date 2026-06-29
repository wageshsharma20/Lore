import hmac
import hashlib
from fastapi import APIRouter, Request, BackgroundTasks, HTTPException
from ..core.config import settings

router = APIRouter()

def verify_github_signature(body: bytes, signature: str, secret: str) -> bool:
    """Verifies that the webhook request genuinely originated from GitHub."""
    if not signature or not secret:
        return False
        
    expected = "sha256=" + hmac.new(
        secret.encode("utf-8"), body, hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(expected, signature)

@router.post("/webhooks/github")
async def github_webhook(request: Request, background_tasks: BackgroundTasks):
    body = await request.body()
    signature = request.headers.get("X-Hub-Signature-256", "")
    
    # Security: Always verify webhook signature to prevent spoofed events
    if not verify_github_signature(body, signature, settings.GITHUB_WEBHOOK_SECRET):
        raise HTTPException(status_code=401, detail="Invalid GitHub signature")
        
    payload = await request.json()
    event = request.headers.get("X-GitHub-Event")
    
    # We only process PR events for Lore
    if event == "pull_request":
        action = payload.get("action")
        
        # Trigger: PR just merged -> Extract decisions and update graph
        if action == "closed" and payload.get("pull_request", {}).get("merged"):
            # Normally we'd do: background_tasks.add_task(process_merged_pr_task, payload["pull_request"])
            print(f"DEBUG: Triggered PR Merge processing for PR #{payload['pull_request']['number']}")
            
        # Trigger: PR opened or updated -> Run PR Blocker logic
        elif action in ["opened", "synchronize", "reopened"]:
            # Normally we'd do: background_tasks.add_task(run_pr_blocker_check, payload["pull_request"])
            print(f"DEBUG: Triggered PR Blocker check for PR #{payload['pull_request']['number']}")
            
    return {"status": "ok", "event": event}
