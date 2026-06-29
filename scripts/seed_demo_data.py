import asyncio
import logging
from apps.api.services.cognee_client import CogneeClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def seed_data():
    client = CogneeClient()
    logger.info(f"Connected to Cognee in {client.mode.upper()} mode.")
    
    # --- 1. Realistic 5+ PR Decisions ---
    real_prs = [
        {
            "title": "Migrate to GraphQL",
            "decision": "Migrated REST API endpoints for user profiles to GraphQL.",
            "reason_summary": "To solve over-fetching on the frontend dashboard.",
            "made_by": {"type": "Developer", "name": "alice"},
            "contributing_authors": [{"type": "Developer", "name": "charlie"}],
            "alternatives_considered": ["Keep REST and create dedicated endpoints", "tRPC"],
            "consequences": ["Requires frontend caching changes", "Reduced payload size"],
            "confidence_score": 0.95,
            "source_pr": "https://github.com/org/repo/pull/101"
        },
        {
            "title": "Switch to PostgreSQL",
            "decision": "Replaced MongoDB with PostgreSQL for the core application data.",
            "reason_summary": "Needed strict ACID compliance and relational integrity for billing data.",
            "made_by": {"type": "Developer", "name": "bob"},
            "contributing_authors": [],
            "alternatives_considered": ["MySQL", "PlanetScale"],
            "consequences": ["Schema migration required", "Better analytics querying"],
            "confidence_score": 0.98,
            "source_pr": "https://github.com/org/repo/pull/102"
        },
        {
            "title": "Implement Redis Caching",
            "decision": "Added Redis to cache expensive database queries.",
            "reason_summary": "Database load was too high during peak hours.",
            "made_by": {"type": "Developer", "name": "charlie"},
            "contributing_authors": [{"type": "Developer", "name": "alice"}],
            "alternatives_considered": ["Memcached"],
            "consequences": ["Cache invalidation complexity added"],
            "confidence_score": 0.92,
            "source_pr": "https://github.com/org/repo/pull/103"
        },
        {
            "title": "Adopt Next.js App Router",
            "decision": "Moved from Pages router to App router in Next.js.",
            "reason_summary": "For better server components support and layout nesting.",
            "made_by": {"type": "Developer", "name": "alice"},
            "contributing_authors": [],
            "alternatives_considered": ["Stay on Pages router"],
            "consequences": ["Steep learning curve for the team", "Faster page loads"],
            "confidence_score": 0.88,
            "source_pr": "https://github.com/org/repo/pull/104"
        }
    ]

    # --- 2. Conflict Scenario for PR Blocker ---
    conflict_pr = {
        "title": "Remove Lodash",
        "decision": "Removed lodash completely from the frontend bundle.",
        "reason_summary": "Bundle size was getting out of hand and native array methods are sufficient.",
        "made_by": {"type": "Developer", "name": "dave"},
        "contributing_authors": [{"type": "Developer", "name": "bob"}],
        "alternatives_considered": ["Use lodash-es"],
        "consequences": ["Some complex object deep-cloning had to be rewritten"],
        "confidence_score": 0.99,
        "source_pr": "https://github.com/org/repo/pull/105"
    }

    # --- 3. Lone-Contributor Silo (Red Heatmap Target) ---
    # We purposefully assign 12 major decisions to "dave" around the "Billing Module"
    silo_decisions = []
    for i in range(1, 13):
        silo_decisions.append({
            "title": f"Billing Module Architecture Update {i}",
            "decision": f"Refactored billing engine component {i}.",
            "reason_summary": "Required for the new subscription tiers.",
            "made_by": {"type": "Developer", "name": "dave"}, # All Dave!
            "contributing_authors": [], # No one else understands it
            "alternatives_considered": [],
            "consequences": ["System is highly coupled to Dave's knowledge"],
            "confidence_score": 0.90,
            "source_pr": f"https://github.com/org/repo/pull/{200+i}"
        })

    # Execute Add
    all_decisions = real_prs + [conflict_pr] + silo_decisions
    
    logger.info(f"Injecting {len(all_decisions)} decisions into the Knowledge Graph...")
    for dec in all_decisions:
        try:
            await client.add(dec, dataset_id="architecture_decisions")
        except Exception as e:
            logger.error(f"Failed to add decision '{dec['title']}': {e}")
            
    # Execute Cognify
    logger.info("Triggering Cognify to build the graph connections...")
    try:
        await client.cognify(dataset_id="architecture_decisions")
        logger.info("✅ Graph successfully built! Demo data is ready.")
    except Exception as e:
        logger.error(f"❌ Failed to cognify dataset: {e}")

if __name__ == "__main__":
    asyncio.run(seed_data())
