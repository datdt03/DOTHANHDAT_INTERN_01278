import asyncio

import httpx

from src.app.main import app


async def request(path: str) -> tuple[int, httpx.Headers, dict]:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(path)
        return response.status_code, response.headers, response.json()


def test_health_returns_contract_envelope() -> None:
    status_code, headers, body = asyncio.run(request("/health"))

    assert status_code == 200
    assert headers["x-request-id"].startswith("req_")

    assert body["data"]["status"] == "ok"
    assert body["data"]["service"] == "repairflow-api"
    assert body["data"]["apiVersion"] == "v1"
    assert body["meta"]["requestId"] == headers["x-request-id"]


def test_unknown_endpoint_returns_contract_error() -> None:
    status_code, headers, body = asyncio.run(request("/unknown"))

    assert status_code == 404
    assert body["error"]["code"] == "NOT_FOUND"
    assert body["error"]["requestId"] == headers["x-request-id"]
