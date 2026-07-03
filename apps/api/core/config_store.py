import json
import logging
from pathlib import Path
from pydantic import BaseModel, ValidationError

logger = logging.getLogger(__name__)

_CONFIG_FILE = Path(__file__).resolve().parent.parent / "data" / "workspace_config.json"

class WorkspaceConfig(BaseModel):
    github_repo: str = ""
    slack_channel: str = ""
    jira_workspace: str = ""

def _init_config_file():
    _CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
    if not _CONFIG_FILE.exists():
        default_config = WorkspaceConfig().model_dump()
        _CONFIG_FILE.write_text(json.dumps(default_config, indent=2))

def load_config() -> WorkspaceConfig:
    """Load workspace configuration from disk."""
    _init_config_file()
    try:
        data = json.loads(_CONFIG_FILE.read_text())
        return WorkspaceConfig(**data)
    except (json.JSONDecodeError, ValidationError) as e:
        logger.error(f"Failed to parse config file, falling back to defaults: {e}")
        return WorkspaceConfig()

def save_config(config: WorkspaceConfig):
    """Persist workspace configuration to disk."""
    _init_config_file()
    try:
        _CONFIG_FILE.write_text(json.dumps(config.model_dump(), indent=2))
        logger.info("Workspace configuration successfully updated.")
    except Exception as e:
        logger.error(f"Failed to save configuration: {e}")
        raise
