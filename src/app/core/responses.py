from typing import Any

from fastapi import Request
from fastapi.responses import JSONResponse


def get_request_id(request: Request) -> str:
    return getattr(request.state, "request_id", "req_unknown")


def success_response(
    request: Request,
    data: Any,
    *,
    status_code: int = 200,
    meta: dict[str, Any] | None = None,
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "data": data,
            "meta": {
                **(meta or {}),
                "requestId": get_request_id(request),
            },
        },
    )


def error_response(
    request: Request,
    status_code: int,
    code: str,
    message: str,
    *,
    details: Any | None = None,
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "code": code,
                "message": message,
                "details": details or {},
                "requestId": get_request_id(request),
            }
        },
    )
