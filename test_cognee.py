import asyncio
import os
from apps.api.services.cognee_client import CogneeClient

async def main():
    os.environ["COGNEE_MODE"] = "local"
    import cognee
    print(help(cognee.search))

if __name__ == "__main__":
    asyncio.run(main())
