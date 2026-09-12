import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder
from starlette.exceptions import HTTPException as StarletteHTTPException

from src.app.core.config import get_settings
from src.app.core.request_id import create_request_id
from src.app.core.responses import error_response
from src.app.features.health.health import router as health_router


logger = logging.getLogger("repairflow.api")
settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="RepairFlow repair workflow API",
)


@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request.state.request_id = create_request_id()
    response = await call_next(request)
    response.headers["X-Request-ID"] = request.state.request_id
    return response


@app.exception_handler(StarletteHTTPException)
async def handle_http_exception(request: Request, exc: StarletteHTTPException):
    if exc.status_code == 404:
        return error_response(
            request,
            404,
            "NOT_FOUND",
            "Không tìm thấy endpoint yêu cầu.",
            details={"path": request.url.path},
        )

    return error_response(
        request,
        exc.status_code,
        "HTTP_ERROR",
        str(exc.detail),
        details={"path": request.url.path},
    )


@app.exception_handler(RequestValidationError)
async def handle_validation_exception(request: Request, exc: RequestValidationError):
    return error_response(
        request,
        400,
        "VALIDATION_ERROR",
        "Dữ liệu request không hợp lệ.",
        details={"errors": jsonable_encoder(exc.errors())},
    )


@app.exception_handler(Exception)
async def handle_unexpected_exception(request: Request, exc: Exception):
    logger.exception(
        "Unhandled request error",
        extra={"request_id": request.state.request_id},
    )
    return error_response(
        request,
        500,
        "INTERNAL_ERROR",
        "Đã xảy ra lỗi nội bộ.",
    )


app.include_router(health_router)
