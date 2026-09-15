# C1-007 — Shared integration and acceptance

Plan ID: c1-007

Title: Nghiệm thu vertical slice access trên .NET và React

Owner: Shared — Codex and Antigravity

Status: PLANNED

Revision: 2

Depends on: c1-006-antigravity-role-navigation.md

Produces: Integrated C1 access baseline and verified acceptance evidence

Consumed by: C2 implementation plans

## Goal

Kiểm tra C1 như một vertical slice hoàn chỉnh: internal user login được, restore
session, bị giới hạn đúng workspace/role, thấy React shell phù hợp và logout an
toàn. Chỉ sau khi C1 pass mới dùng access boundary làm dependency cho C2.

## Main business requirements

- UC-01 login và workspace access hoạt động qua ASP.NET Core API thật.
- Principal, membership, role và workspace được kiểm tra ở backend.
- Manager/Owner, Receptionist và Technician có entry/navigation phù hợp.
- Receptionist operational access read-only ngoài assignment/responsibility.
- Technician chỉ thấy/thao tác trong assigned scope.
- Session expired/revoked thì UI không giữ protected data.
- Customer link không bị kéo vào internal authentication shell.
- Response/error/request ID và audit behavior nhất quán.

## Scope

- Kết nối .NET access operations với React adapter.
- Chạy acceptance matrix cho login, session, role, workspace và navigation.
- Đối chiếu OpenAPI 3.0 với request/response thực tế của UI.
- Kiểm tra migration target, test fixtures, Vite build và manual UI.
- Cập nhật status C1 trong `plans/v0/` khi mọi tiêu chí pass.

## Out of scope

- Customer, device, order, dashboard business data.
- Full business API.
- C2–C10 acceptance.
- Production deployment, monitoring và load test.
- Khôi phục database/migration prototype files.

## Dependencies

- `c1-001-codex-api-foundation.md`.
- `c1-002-antigravity-ui-shell.md`.
- `c1-003-codex-auth-session.md`.
- `c1-004-antigravity-auth-ui.md`.
- `c1-005-codex-permission-enforcement.md`.
- `c1-006-antigravity-role-navigation.md`.
- `c0-003-shared-stack-migration-acceptance.md`.
- `docs/v0/02-use-cases.md`, UC-01 acceptance.
- `docs/v0/06-ui-requirements.md`.
- `docs/v0/07-authentication-and-authorization.md`.

## Input files

- `src/server/RepairFlow.Api/Features/Access/`.
- `src/server/RepairFlow.Api/Api/`.
- `src/server/RepairFlow.Api/Infrastructure/Database/`.
- `tests/server/RepairFlow.Api.Tests/Features/Access/`.
- `src/ui/app/`.
- `src/ui/features/access/`.
- `src/ui/shared/api/`.
- `src/ui/package.json`.
- OpenAPI 3.0 output từ C1 server.
- `docs/v0/02-use-cases.md`, `docs/v0/06-ui-requirements.md` và `docs/v0/07-authentication-and-authorization.md`.

## Output files

- Passing C1 backend/access test suite.
- Passing React build/type-check và manual acceptance evidence.
- Verified API-to-UI access boundary.
- Updated `plans/v0/README.md` và `00-master-plan.md` status/pointer.

## Files to write

- [ ] `tests/server/RepairFlow.Api.Tests/Features/Access/C1AcceptanceTests.cs`.
- [ ] UI/manual acceptance evidence theo convention hiện có.
- [ ] `plans/v0/README.md`, chỉ update task/cluster status.
- [ ] `plans/v0/00-master-plan.md`, chỉ update current execution pointer.
- [ ] Amendment plan mới nếu acceptance phát hiện server/UI gap.

## Step-by-step implementation

- [ ] Codex khởi động ASP.NET Core API và PostgreSQL/config cần thiết theo target.
- [ ] Chạy .NET unit/API/integration/migration tests cho C1.
- [ ] Antigravity chạy React type-check/build và mở Vite/static target.
- [ ] Chạy login/session-restore flow qua adapter và API thật.
- [ ] Verify logout, expired và revoked session.
- [ ] Verify role matrix cho Owner/Manager, Receptionist và Technician.
- [ ] Verify cross-workspace và unassigned access denial bằng direct API call.
- [ ] Verify customer-link route tách khỏi internal shell.
- [ ] Ghi server gap thành sequence Codex mới; không sửa scope âm thầm.
- [ ] Chỉ mark C1 DONE khi backend, UI và acceptance đều pass.

## Testing plan

- [ ] .NET backend tests pass.
- [ ] Authentication/authorization API tests pass.
- [ ] Target migration runner idempotency smoke test pass nếu migration được
  tạo trong C1.
- [ ] Vite build/type-check pass.
- [ ] Manual desktop/mobile shell checks pass.
- [ ] Acceptance matrix có success, invalid credential, expired session,
  forbidden role, cross-workspace và logout flows.
- [ ] Không có direct UI database access hoặc client-only permission rule.

## Acceptance criteria

- [ ] Provisioned active account login và vào đúng role entry.
- [ ] Invalid/inactive/suspended access bị reject mà không lộ sensitive data.
- [ ] Timeout/revoke được server enforce và UI phản ánh đúng.
- [ ] Direct API calls không bypass role/workspace restriction.
- [ ] UI không render protected data trước khi auth thành công.
- [ ] Access boundary có docs/test evidence để C2 consume.
- [ ] Acceptance không phục hồi hoặc sửa DB prototype files ngoài scope.

## Change impact

Nếu acceptance phát hiện thiếu API behavior, tạo task Codex sequence tiếp theo
và link trong `plans/v0/README.md`. Nếu phát hiện thay đổi business rule hoặc
permission, dừng integration, cập nhật docs/v0 trước rồi mới chỉnh plan.
