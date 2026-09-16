# C0-001 — Codex .NET API foundation

Plan ID: c0-001

Title: Migrate API runtime foundation to ASP.NET Core Web API

Owner: Codex

Status: DONE

Revision: 2

Depends on: Gate D0 closed; historical C0 contract recorded in README and docs/v0

Produces: ASP.NET Core/.NET runtime, health/error contract, OpenAPI 3.0 boundary and database access seams

Consumed by: c0-002-antigravity-react-vite-foundation.md and c0-003-shared-stack-migration-acceptance.md

## Goal

Dựng runtime backend target mới bằng ASP.NET Core Web API trên .NET và tái tạo
đúng behavior C0 đã được ghi nhận: health endpoint, response envelope, error
envelope và request ID. Task này chỉ dựng nền tảng để C1 có thể bắt đầu; chưa
triển khai login hay business workflow.

## Main business and technical requirements

- Backend/API bắt buộc là ASP.NET Core Web API trên .NET và chạy như modular
  monolith.
- `/health` phải giữ contract đã kiểm chứng: `data.status = ok`,
  `data.service = repairflow-api`, `data.apiVersion = v1`, `meta.requestId` và
  header `X-Request-ID`.
- Lỗi 404 và lỗi validation dùng response envelope thống nhất, có request ID,
  không trả HTML mặc định.
- OpenAPI của ASP.NET Core phải mô tả API theo chuẩn OpenAPI 3.0 để UI và các
  plan sau dùng làm contract.
- PostgreSQL là database target; EF Core + Npgsql là data-access target.
- Migration runner target thuộc backend .NET và phải có version/idempotency
  boundary; task này không khôi phục hoặc chỉnh sửa các file DB prototype cũ.
- Cấu hình lấy từ environment/options, không commit secret.

## Scope

- Scaffold solution/project backend target trong `src/server/`.
- Dựng ba tầng logic: API/presentation, application/domain và
  infrastructure/data trong một modular monolith.
- Implement request-ID middleware, response/error models, exception mapping và
  health endpoint.
- Đăng ký EF Core/Npgsql và interface cho versioned SQL migration runner nhưng
  chưa thay đổi business schema.
- Tạo test project .NET cho health, 404/error envelope và OpenAPI output.
- Ghi rõ command build/test để C0-002 và C0-003 dùng cùng baseline.

## Out of scope

- Login, password, session, permission, workspace hoặc staff provisioning.
- Customer/order/evidence/quote/repair API.
- Thay đổi business rule hoặc schema contract trong `docs/v0/05`.
- Khôi phục các file `src/db` hoặc migration SQL prototype đã bị loại khỏi
  working tree.
- Production deployment, object storage, Redis, queue hoặc identity provider.
- Tạo UI React; thuộc c0-002.

## Dependencies

- `AGENTS.md`.
- `docs/README.md`.
- `docs/v0/README.md`.
- `docs/v0/03-business-and-domain-requirements.md`, baseline công nghệ.
- `docs/v0/04-architecture-c4-arc42.md`, target topology và code-level direction.
- `docs/v0/05-database-requirements.md`, database/migration contract.
- `README.md`, compatibility status và health contract đã được ghi nhận trước reset.

## Input files

- `README.md`, phần health/response contract đã được ghi nhận trước reset.
- `docs/v0/03-business-and-domain-requirements.md`.
- `docs/v0/04-architecture-c4-arc42.md`.
- `docs/v0/05-database-requirements.md`.
- `docker-compose.yml`.

## Output files

- ASP.NET Core API có thể chạy local bằng .NET SDK.
- Health/error/request-ID behavior tương thích C0.
- OpenAPI 3.0 document discoverable từ API.
- EF Core/Npgsql và migration-runner boundary sẵn sàng cho C1.
- .NET test baseline mới, không phụ thuộc Python runtime.

## Files to write

- [x] `src/server/RepairFlow.sln`.
- [x] `src/server/RepairFlow.Api/RepairFlow.Api.csproj`.
- [x] `src/server/RepairFlow.Api/Program.cs`.
- [x] `src/server/RepairFlow.Api/Api/Middleware/RequestIdMiddleware.cs`.
- [x] `src/server/RepairFlow.Api/Api/Middleware/ExceptionHandlingMiddleware.cs`.
- [x] `src/server/RepairFlow.Api/Api/Responses/ApiResponse.cs`.
- [x] `src/server/RepairFlow.Api/Api/Responses/ApiError.cs`.
- [x] `src/server/RepairFlow.Api/Features/Health/HealthEndpoints.cs`.
- [x] `src/server/RepairFlow.Api/Infrastructure/Database/RepairFlowDbContext.cs`.
- [x] `src/server/RepairFlow.Api/Infrastructure/Database/VersionedMigrationRunner.cs`.
- [x] `tests/server/RepairFlow.Api.Tests/RepairFlow.Api.Tests.csproj`.
- [x] `tests/server/RepairFlow.Api.Tests/HealthContractTests.cs`.
- [x] `tests/server/RepairFlow.Api.Tests/ErrorContractTests.cs`.
- [x] `tests/server/RepairFlow.Api.Tests/OpenApiContractTests.cs`.

Không ghi file vào `src/db` trong task này. Nếu scaffold thực tế cần tên file
khác, cập nhật Revision trước khi implement để các plan sau dùng cùng path.

## Step-by-step implementation

- [x] Kiểm tra .NET SDK version có sẵn và chốt target framework trong file
  project; không tự thêm version khác với môi trường/repository.
- [x] Tạo solution/project dưới `src/server/` và test project dưới `tests/server`.
- [x] Đăng ký ASP.NET Core routing, JSON options, configuration/options và
  OpenAPI 3.0 document.
- [x] Implement request-ID middleware: nhận ID hợp lệ nếu policy cho phép hoặc
  tạo ID mới, gắn vào response header và request scope.
- [x] Implement success envelope theo shape `data` + `meta.requestId`.
- [x] Implement error envelope theo shape `error.code`, `message`, `details`
  và `requestId`; map 404, validation và unexpected error.
- [x] Implement `/health` với đúng các field C0 đã kiểm chứng.
- [x] Đăng ký `RepairFlowDbContext` với PostgreSQL/Npgsql qua configuration,
  nhưng không chạy thay đổi schema trong task foundation.
- [x] Tạo migration-runner abstraction có version, transaction và idempotency
  seam; để task database cụ thể bổ sung SQL target sau khi schema được đối chiếu.
- [x] Viết test contract cho health, 404, request ID và OpenAPI.
- [x] Ghi command `dotnet build` và `dotnet test` vào output handoff cho C0-002.

## Testing plan

- [x] `dotnet build src/server/RepairFlow.sln` pass.
- [x] `dotnet test` cho test project .NET pass.
- [x] GET `/health` trả status 200 và đúng response/header contract.
- [x] GET endpoint không tồn tại trả status 404 và error envelope JSON.
- [x] Request ID xuất hiện giống nhau trong header và body.
- [x] OpenAPI document là version 3.0 và không lộ connection string/secret.
- [x] API khởi động được khi PostgreSQL config hợp lệ; lỗi database không làm
  lộ credential.
- [x] Không yêu cầu khôi phục hoặc chạy các migration file prototype cũ.

## Acceptance criteria

- [x] C0 health behavior chạy được trên ASP.NET Core/.NET.
- [x] API không còn phụ thuộc FastAPI để cung cấp target runtime.
- [x] Error/response/request-ID contract có test tự động.
- [x] OpenAPI 3.0 có thể được C1 dùng làm contract đầu vào.
- [x] EF Core + Npgsql đã được đăng ký qua infrastructure boundary.
- [x] Migration runner target có boundary rõ ràng nhưng không tự ý đổi schema.
- [x] c0-002 có thể chạy UI adapter tới URL API đã cấu hình.

## Change impact

Nếu contract health/error/request ID khác với test C0 hiện tại, không sửa âm
thầm. Đối chiếu `README.md`, `tests/test_health.py` và docs/v0 trước; nếu cần
đổi contract thì cập nhật source of truth và tăng Revision. Nếu layout backend
đổi, phải cập nhật c0-002, c0-003 và toàn bộ plan C1 trước khi bắt đầu.
