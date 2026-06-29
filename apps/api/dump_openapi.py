import json
import sys
import os

# Add the current directory to sys.path so we can import main
sys.path.insert(0, os.path.dirname(__file__))

try:
    from main import app
    from fastapi.openapi.utils import get_openapi
    
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        openapi_version=app.openapi_version,
        description=app.description,
        routes=app.routes,
    )
    
    with open("openapi.json", "w") as f:
        json.dump(openapi_schema, f, indent=2)
    print("Successfully dumped openapi.json")
except Exception as e:
    print(f"Error dumping OpenAPI schema: {e}")
    sys.exit(1)
