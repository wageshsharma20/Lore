from fastapi import APIRouter, HTTPException
import logging
from ..core.config_store import load_config, save_config, WorkspaceConfig

router = APIRouter(prefix="/api/config", tags=["Configuration"])
logger = logging.getLogger(__name__)

@router.get("")
async def get_configuration():
    """Fetch the user's workspace configuration."""
    try:
        config = load_config()
        return config.model_dump()
    except Exception as e:
        logger.error(f"Failed to load configuration: {e}")
        raise HTTPException(status_code=500, detail="Could not load configuration.")

@router.post("")
async def update_configuration(new_config: WorkspaceConfig):
    """Update the user's workspace configuration."""
    try:
        save_config(new_config)
        return {"status": "success", "config": new_config.model_dump()}
    except Exception as e:
        logger.error(f"Failed to update configuration: {e}")
        raise HTTPException(status_code=500, detail="Could not save configuration.")
