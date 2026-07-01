import asyncio
import json
import os
from pathlib import Path

# Adjust path so we can import apps.api modules if we run this from root
import sys
sys.path.append(str(Path(__file__).resolve().parent.parent.parent))

from apps.api.services.cognee_client import CogneeClient

def mock_tokens():
    """Mock the tokens so the frontend dashboard bypasses the onboarding checklist."""
    data_dir = Path(__file__).resolve().parent / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    
    tokens_file = data_dir / "tokens.json"
    
    fake_tokens = {
        "github": "ghu_12345fake_token",
        "slack": "xoxb-fake-slack-token",
        "jira": "jira_fake_token_abc"
    }
    
    with open(tokens_file, "w") as f:
        json.dump(fake_tokens, f, indent=2)
    print("Created fake tokens.json to satisfy frontend connection checks!")

async def seed_decisions():
    client = CogneeClient()
    
    # Let's add some realistic engineering decisions
    decisions = [
        {
            "title": "Migrate to Next.js App Router",
            "decision": "We will use the new Next.js App Router for all new frontend projects.",
            "reason_summary": "Better performance with server components, streaming SSR, and improved layout routing.",
            "made_by": {"type": "Developer", "name": "alice"},
            "contributing_authors": [],
            "alternatives_considered": "Stay with Pages router, Vite SPA.",
            "consequences": "Requires team training on server components. Migration of old pages will take 2 weeks.",
            "confidence_score": 0.9,
            "source_pr": "https://github.com/org/repo/pull/1",
            "decision_type": "adr",
            "affected_systems": ["Frontend UI"]
        },
        {
            "title": "Use Tailwind CSS instead of SCSS",
            "decision": "Adopt Tailwind CSS as the primary styling solution.",
            "reason_summary": "Increases velocity, removes need for naming conventions, and enforces a strict design system out of the box.",
            "made_by": {"type": "Developer", "name": "alice"},
            "contributing_authors": [{"type": "Developer", "name": "bob"}],
            "alternatives_considered": "SCSS Modules, Styled Components.",
            "consequences": "HTML can look cluttered. Easy to onboard new devs.",
            "confidence_score": 0.95,
            "source_pr": "https://github.com/org/repo/pull/2",
            "decision_type": "standard",
            "affected_systems": ["Frontend UI"]
        },
        {
            "title": "FastAPI for Backend Services",
            "decision": "Use FastAPI for all new Python microservices.",
            "reason_summary": "Async support, automatic OpenAPI docs, and Pydantic validation.",
            "made_by": {"type": "Developer", "name": "charlie"},
            "contributing_authors": [],
            "alternatives_considered": "Flask, Django.",
            "consequences": "Need to ensure developers understand async/await pitfalls in Python.",
            "confidence_score": 0.85,
            "source_pr": "https://github.com/org/repo/pull/3",
            "decision_type": "adr",
            "affected_systems": ["Backend API"]
        },
        {
            "title": "PostgreSQL as Primary Datastore",
            "decision": "Use PostgreSQL via RDS for relational data storage.",
            "reason_summary": "ACID compliance, JSONB support, and massive ecosystem.",
            "made_by": {"type": "Developer", "name": "dave"},
            "contributing_authors": [],
            "alternatives_considered": "MySQL, MongoDB.",
            "consequences": "Need to setup automated backups and read replicas.",
            "confidence_score": 0.99,
            "source_pr": "https://github.com/org/repo/pull/4",
            "decision_type": "adr",
            "affected_systems": ["Database"]
        },
        {
            "title": "JWT for Stateless Authentication",
            "decision": "Use JSON Web Tokens (JWT) for API auth.",
            "reason_summary": "Allows stateless backend servers and easy cross-service validation.",
            "made_by": {"type": "Developer", "name": "charlie"},
            "contributing_authors": [{"type": "Developer", "name": "eve"}],
            "alternatives_considered": "Session cookies.",
            "consequences": "Can't easily invalidate single sessions without a blacklist.",
            "confidence_score": 0.8,
            "source_pr": "https://github.com/org/repo/pull/5",
            "decision_type": "standard",
            "affected_systems": ["Authentication", "Backend API"]
        }
    ]
    
    print("Ingesting decisions into Cognee...")
    for d in decisions:
        try:
            await client.add(d, dataset_id="architecture_decisions")
            print(f"Added decision: {d['title']}")
        except Exception as e:
            print(f"Error adding {d['title']}: {e}")
            
    print("Cognifying dataset...")
    try:
        await client.cognify("architecture_decisions")
        print("Cognify complete!")
    except Exception as e:
        print(f"Cognify error: {e}")

if __name__ == "__main__":
    mock_tokens()
    asyncio.run(seed_decisions())
    print("Seeding complete! The dashboard will now show live data.")
