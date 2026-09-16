# C0-003 — Shared stack migration acceptance

Plan ID: c0-003

Title: Nghiệm thu runtime .NET và React/Vite trước khi mở C1

Owner: Shared — Codex and Antigravity

Status: DONE

Revision: 4

Depends on: c0-001-codex-dotnet-api-foundation.md và c0-002-antigravity-react-vite-foundation.md

Produces: C0 migration evidence, verified target commands and C1 go/no-go decision

Consumed by: c1-001-codex-api-foundation.md

## Goal

## Final acceptance note

The legacy local PostgreSQL volume was removed only after explicit user
instruction. A fresh PostgreSQL database and volume were created from Docker
Compose; C0 live migration smoke then passed without creating business tables.

Xác nhận prototype cũ đã được thay thế đúng vai trò bởi target runtime: ASP.NET
Core Web API/.NET cung cấp health/error/OpenAPI và React/Vite/TypeScript mount
được, gọi API qua adapter. Chỉ khi các tiêu chí này pass mới mở C1; D0 không bị
mở lại vì đây là engineering migration.

## Main business and technical requirements

- Backend target là .NET, không dùng FastAPI làm runtime cho C1.
- Frontend target là React + Vite + TypeScript, không dùng vanilla bundle làm
  runtime cho C1.
- Health, response envelope, error envelope và request ID không bị thay đổi
  ngoài contract đã chốt.
- OpenAPI 3.0 là nguồn contract cho các API task sau.
- PostgreSQL boundary và migration runner target thuộc backend .NET; không cho UI
  truy cập database.
- Không khôi phục các file database/migration prototype cũ trong acceptance.

## Scope

- Chạy clean build/test cho backend target.
- Chạy frontend type-check/build và mở UI target.
- Gọi `/health` từ React adapter tới ASP.NET Core thật.
- Kiểm tra OpenAPI document, response/error shape, request ID và config boundary.
- Kiểm tra prototype cũ chỉ còn là reference, không phải entrypoint target.
- Cập nhật status C0/C1 trong `plans/v0/README.md` và pointer trong master plan
  nếu pass.

## Out of scope

- Login, session, permission và business endpoint C1.
- Port toàn bộ màn hình vanilla sang React.
- Schema redesign hoặc phục hồi migration files cũ.
- Production deployment, load/security hardening và CI/CD.

## Dependencies

- `c0-001-codex-dotnet-api-foundation.md`.
- `c0-002-antigravity-react-vite-foundation.md`.
- `docs/v0/03-business-and-domain-requirements.md`.
- `docs/v0/04-architecture-c4-arc42.md`.
- `docs/v0/05-database-requirements.md`.
- `docs/v0/06-ui-requirements.md`.
- `README.md` và command handoff từ hai task trước.

## Input files

- `src/server/RepairFlow.sln`.
- `src/server/RepairFlow.Api/`.
- `tests/server/RepairFlow.Api.Tests/`.
- `src/ui/package.json`.
- `src/ui/vite.config.ts`.
- `src/ui/app/`.
- `src/ui/shared/api/api-client.ts`.
- `docs/v0/04-architecture-c4-arc42.md`.
- `docs/v0/06-ui-requirements.md`.

## Output files

- C0 acceptance record trong plan/task evidence convention của repository.
- Backend và frontend commands đã xác minh.
- Danh sách gap còn lại, nếu có, kèm owner và sequence plan mới.
- C1 status được chuyển sang `READY` chỉ khi toàn bộ gate pass.

## Files to write

- [x] Evidence/log hoặc checklist nghiệm thu theo convention hiện có của repo.
- [x] `plans/v0/README.md`, chỉ cập nhật status C0/C1 và current pointer.
- [x] `plans/v0/00-master-plan.md`, chỉ cập nhật migration gate/status.
- [x] `README.md`, cập nhật quickstart, structure và runtime status sau khi target
  stack được nghiệm thu.
- [x] `docs/v0/README.md`, cập nhật compatibility note/status sau migration.
- [x] `docs/v0/03-business-and-domain-requirements.md` và
  `docs/v0/04-architecture-c4-arc42.md`, chỉ cập nhật phần implementation status
  nếu còn mô tả C0 là prototype.
- [ ] Plan amendment mới nếu acceptance phát hiện gap cần triển khai.

## Step-by-step implementation

- [x] Codex chạy clean `dotnet build` và `dotnet test` cho solution/test project.
- [x] Codex khởi động ASP.NET Core API với config local không chứa secret.
- [x] Shared gọi `/health`, endpoint không tồn tại và OpenAPI document; đối chiếu
  status code, JSON shape, request ID và OpenAPI version.
- [x] Antigravity chạy type-check/build Vite và mount target React app.
- [x] Shared cấu hình API base URL của UI trỏ vào ASP.NET Core rồi gọi health
  qua adapter; xác nhận không có fetch trực tiếp trong screen/component.
- [x] Kiểm tra internal/customer-link route boundary và API unavailable state.
- [x] Xác nhận không có task nào sửa hoặc khôi phục `src/db` prototype files.
- [x] Ghi từng failure thành gap có owner; không đánh dấu C0 DONE khi còn gap
  làm C1 tiếp tục phụ thuộc Python/vanilla.
- [x] Nếu pass, chuyển C0 `DONE`, mở c1-001 `READY` và cập nhật current pointer.

## Testing plan

- [x] Backend build/test pass.
- [x] Frontend type-check/build pass.
- [x] Health contract pass từ cả direct HTTP client và React adapter.
- [x] 404/error envelope và request-ID correlation pass.
- [x] OpenAPI 3.0 document được load/validate.
- [x] UI không render protected access screen khi chưa có session context.
- [x] Manual desktop/mobile smoke check pass cho foundation.
- [x] Working tree không phát sinh việc khôi phục DB prototype ngoài scope.

## Acceptance criteria

- [x] C0 target runtime được xác nhận là ASP.NET Core/.NET + React/Vite/TypeScript.
- [x] C1 không còn dependency runtime vào FastAPI hoặc vanilla bundle.
- [x] API adapter boundary hoạt động với API thật.
- [x] Contract health/error/request ID/OpenAPI có bằng chứng kiểm tra.
- [x] C0 README/master pointer và owner/dependency được cập nhật đúng.
- [x] Mọi gap còn lại có plan hoặc owner cụ thể; không che bằng cách đổi status.

## Change impact

Nếu hai bên không thống nhất contract, giữ C0 `BLOCKED`, ghi rõ file/contract bị
lệch và cập nhật docs/v0 nếu đây là thay đổi sản phẩm. Nếu chỉ là implementation
gap, tạo sequence C0 tiếp theo; không mở C1 bằng workaround FastAPI hoặc vanilla.
