from datetime import datetime, timezone

from fastapi import APIRouter, Request

from src.app.core.config import get_settings
from src.app.core.responses import success_response


router = APIRouter(tags=["health"])


@router.get("/health", summary="Application health check")
def health(request: Request):
    settings = get_settings()
    return success_response(
        request,
        {
            "status": "ok",
            "service": settings.service_name,
            "apiVersion": settings.api_version,
            "environment": settings.environment,
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        },
    )
