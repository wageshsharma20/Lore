import os
import httpx
import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

class CogneeClient:
    """
    A thin wrapper around Cognee to support Dual-Deployment mode.
    Reads COGNEE_MODE from the environment.
    If 'local', uses the local open-source cognee package (On-Premise Privacy Mode).
    If 'cloud', routes requests to the Cognee Cloud API.
    """
    def __init__(self):
        self.mode = os.getenv("COGNEE_MODE", "local").lower()
        self.api_key = os.getenv("COGNEE_API_KEY", "")
        self.cloud_url = os.getenv("COGNEE_CLOUD_URL", "https://api.cognee.ai")
        
        if self.mode == "local":
            try:
                import cognee # type: ignore
                self._local_cognee = cognee
                logger.info("CogneeClient initialized in LOCAL (Open-Source) mode.")
            except ImportError:
                logger.warning("cognee package not found locally. Please install it.")
                self._local_cognee = None
        else:
            logger.info("CogneeClient initialized in CLOUD (API) mode.")
            if not self.api_key:
                logger.warning("COGNEE_API_KEY is not set for Cloud mode!")

    async def add(self, data: Any, dataset_id: str = "default") -> Dict[str, Any]:
        """Add data to Cognee for processing."""
        if self.mode == "local":
            if self._local_cognee:
                # Assuming cognee.add(data, dataset_id)
                result = await self._local_cognee.add(data, dataset_id=dataset_id)
                return {"status": "success", "result": result}
            return {"status": "error", "detail": "Local cognee not installed."}
        
        # Cloud mode
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {self.api_key}"}
            payload = {"data": data, "dataset_id": dataset_id}
            try:
                # Mocked endpoint structure based on standard REST
                response = await client.post(f"{self.cloud_url}/api/v1/add", json=payload, headers=headers)
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.error(f"Cloud API add failed: {e}")
                return {"status": "error", "detail": str(e)}

    async def cognify(self, dataset_id: str = "default") -> Dict[str, Any]:
        """Trigger graph building (cognify) on the dataset."""
        if self.mode == "local":
            if self._local_cognee:
                result = await self._local_cognee.cognify(dataset_id=dataset_id)
                return {"status": "success", "result": result}
            return {"status": "error", "detail": "Local cognee not installed."}
        
        # Cloud mode
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {self.api_key}"}
            try:
                response = await client.post(f"{self.cloud_url}/api/v1/cognify", json={"dataset_id": dataset_id}, headers=headers)
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.error(f"Cloud API cognify failed: {e}")
                return {"status": "error", "detail": str(e)}

    async def search(self, query: str, search_type: str = "hybrid") -> List[Any]:
        """Search the graph/vector database."""
        if self.mode == "local":
            if self._local_cognee:
                # Assuming cognee.search(query, search_type)
                result = await self._local_cognee.search(query, search_type=search_type)
                return result
            return []
        
        # Cloud mode
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {self.api_key}"}
            params = {"q": query, "type": search_type}
            try:
                response = await client.get(f"{self.cloud_url}/api/v1/search", params=params, headers=headers)
                response.raise_for_status()
                return response.json().get("results", [])
            except Exception as e:
                logger.error(f"Cloud API search failed: {e}")
                return []

    async def memify(self, decision_id: str) -> Dict[str, Any]:
        """Enrich and strengthen the confidence score of a memory node."""
        if self.mode == "local":
            if self._local_cognee and hasattr(self._local_cognee, "memify"):
                result = await self._local_cognee.memify(decision_id)
                return {"status": "success", "result": result}
            return {"status": "success", "detail": "Local cognee memify stubbed."}
        
        # Cloud mode
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {self.api_key}"}
            try:
                response = await client.post(f"{self.cloud_url}/api/v1/memify", json={"decision_id": decision_id}, headers=headers)
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.error(f"Cloud API memify failed: {e}")
                return {"status": "error", "detail": str(e)}

    async def forget(self, decision_id: str) -> Dict[str, Any]:
        """Deprecate a decision, removing it from active memory so PR Blocker ignores it."""
        if self.mode == "local":
            if self._local_cognee and hasattr(self._local_cognee, "forget"):
                result = await self._local_cognee.forget(decision_id)
                return {"status": "success", "result": result}
            return {"status": "success", "detail": "Local cognee forget stubbed."}
        
        # Cloud mode
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {self.api_key}"}
            try:
                response = await client.post(f"{self.cloud_url}/api/v1/forget", json={"decision_id": decision_id}, headers=headers)
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.error(f"Cloud API forget failed: {e}")
                return {"status": "error", "detail": str(e)}
