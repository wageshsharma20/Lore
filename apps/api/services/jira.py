import httpx
import logging
from dataclasses import dataclass
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

@dataclass
class JiraTicket:
    key: str
    summary: str
    description: str
    status: str
    priority: str
    assignee: str
    reporter: str

def parse_adf_to_text(adf_node: Any) -> str:
    """
    Recursively parses Jira's Atlassian Document Format (ADF) JSON into plain text.
    Ensures Claude doesn't consume raw JSON, saving massive context tokens.
    """
    if not isinstance(adf_node, dict):
        return ""
        
    text_content = ""
    node_type = adf_node.get("type")
    
    if node_type == "text":
        text_content += adf_node.get("text", "")
    elif node_type == "paragraph":
        text_content += "\n"
    elif node_type == "bulletList" or node_type == "orderedList":
        text_content += "\n"
    elif node_type == "listItem":
        text_content += "- "
        
    for child in adf_node.get("content", []):
        text_content += parse_adf_to_text(child)
        
    return text_content.strip()

async def fetch_jira_ticket(ticket_key: str, access_token: str) -> Optional[JiraTicket]:
    """
    Fetches a Jira ticket using a true OAuth 2.0 Access Token.
    Requires fetching the cloud_id first for the Jira Cloud v3 API.
    """
    if not access_token:
        logger.warning("No OAuth access token provided. Skipping Jira fetch.")
        return None

    try:
        async with httpx.AsyncClient() as client:
            # 1. Fetch accessible resources to get the cloud_id
            resources_resp = await client.get(
                "https://api.atlassian.com/oauth/token/accessible-resources",
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=10.0
            )
            
            if resources_resp.status_code != 200 or not resources_resp.json():
                logger.error(f"Failed to fetch cloud_id: {resources_resp.status_code}")
                return None
                
            cloud_id = resources_resp.json()[0]["id"]
            
            # 2. Fetch the actual issue from Jira Cloud API v3
            issue_url = f"https://api.atlassian.com/ex/jira/{cloud_id}/rest/api/3/issue/{ticket_key}"
            issue_resp = await client.get(
                issue_url,
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=10.0
            )
            
            if issue_resp.status_code != 200:
                logger.error(f"Failed to fetch Jira ticket {ticket_key}: {issue_resp.status_code}")
                return None
                
            data = issue_resp.json()
            fields = data.get("fields", {})
            
            # Use our strict ADF parser
            desc_obj = fields.get("description")
            description_text = parse_adf_to_text(desc_obj) if desc_obj else "No description provided."

            # Capture explicit attribution
            assignee = fields.get("assignee")
            assignee_name = assignee.get("displayName") if assignee else "Unassigned"
            
            reporter = fields.get("reporter")
            reporter_name = reporter.get("displayName") if reporter else "Unknown"

            return JiraTicket(
                key=data.get("key", ticket_key),
                summary=fields.get("summary", "No Summary"),
                description=description_text,
                status=fields.get("status", {}).get("name", "Unknown"),
                priority=fields.get("priority", {}).get("name", "Unknown"),
                assignee=assignee_name,
                reporter=reporter_name
            )
            
    except Exception as e:
        logger.error(f"Exception fetching Jira ticket {ticket_key}: {e}")
        return None
