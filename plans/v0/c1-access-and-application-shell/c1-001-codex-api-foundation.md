# C1-001 — Codex access API foundation

Plan ID: c1-001

Title: Dựng access feature boundary trên ASP.NET Core

Owner: Codex

Status: BLOCKED

Revision: 2

Depends on: c0-003-shared-stack-migration-acceptance.md

Produces: Access feature boundary, typed contracts, context abstraction and server fixtures

Consumed by: c1-002-antigravity-ui-shell.md and c1-003-codex-auth-session.md

## Goal

Tạo boundary backend cho capability access trên ASP.NET Core/.NET để các task C1
tiếp theo dùng chung context, contract, repository và test fixture. Task chuẩn
bị cho authentication/session nhưng chưa implement login hoàn chỉnh hoặc mở
business endpoint.

## Main business requirements

- Backend là boundary duy nhất để kiểm tra access principal, role, workspace và
  business rule; UI không phải security boundary.
- Access principal, staff profile và workspace membership là ba khái niệm tách
  biệt; staff profile không tự động là người đang đăng nhập.
- MVP role gồm Owner, Manager, Receptionist và Technician; không thêm custom role.
- Staff profile chưa có account không có credential/session.
- Request nội bộ về sau phải có workspace context hợp lệ.
- Acting account và attributed staff profile phải được ghi nhận riêng để audit.

## Scope

- Tạo feature boundary theo `Api` → `Application/Domain` → `Infrastructure`.
- Tạo typed model cho principal, membership, role, session context và attributed
  staff context.
- Tạo dependency/context interface để feature sau không tự parse token/request.
- Chuẩn hóa response envelope, error mapping và request ID từ C0.
- Tạo fixture dùng chung cho account, workspace, membership, role và staff không
  có account.
- Đăng ký access route/context boundary cần thiết cho c1-003.
- Expose contract qua OpenAPI 3.0 của ASP.NET Core, không tạo tài liệu API rời.

## Out of scope

- Login, logout, password hashing và session persistence; thuộc c1-003.
- Permission matrix enforcement chi tiết; thuộc c1-005.
- Login screen, shell và role navigation; thuộc c1-002, c1-004, c1-006.
- Customer, order, dashboard hoặc repair workflow.
- OAuth, Google Login, SSO, MFA, impersonation hoặc customer account.
- Thay đổi schema ngoài contract đã chốt trong docs/v0.

## Dependencies

- `c0-003-shared-stack-migration-acceptance.md`.
- `docs/v0/02-use-cases.md`, UC-01.
- `docs/v0/03-business-and-domain-requirements.md`, role/access model.
- `docs/v0/04-architecture-c4-arc42.md`, Identity and Access Session.
- `docs/v0/07-authentication-and-authorization.md`.
- Target layout và response/OpenAPI output từ `src/server/` của C0.

## Input files

- `src/server/RepairFlow.Api/Program.cs`.
- `src/server/RepairFlow.Api/Api/Responses/`.
- `src/server/RepairFlow.Api/Api/Middleware/`.
- `src/server/RepairFlow.Api/Infrastructure/Database/RepairFlowDbContext.cs`.
- `tests/server/RepairFlow.Api.Tests/`.
- `docs/v0/02-use-cases.md`.
- `docs/v0/03-business-and-domain-requirements.md`.
- `docs/v0/04-architecture-c4-arc42.md`.
- `docs/v0/07-authentication-and-authorization.md`.

## Output files

- Access feature boundary dưới `src/server/RepairFlow.Api/Features/Access/`.
- Reusable authenticated-context/access fixtures cho C1–C10.
- Safe API contracts xuất hiện trong OpenAPI 3.0.
- Không expose business data hoặc credential.

## Files to write

- [ ] `src/server/RepairFlow.Api/Features/Access/Api/AccessEndpoints.cs`.
- [ ] `src/server/RepairFlow.Api/Features/Access/Api/AccessContracts.cs`.
- [ ] `src/server/RepairFlow.Api/Features/Access/Application/AccessService.cs`.
- [ ] `src/server/RepairFlow.Api/Features/Access/Application/AccessContext.cs`.
- [ ] `src/server/RepairFlow.Api/Features/Access/Domain/AccessModels.cs`.
- [ ] `src/server/RepairFlow.Api/Features/Access/Infrastructure/AccessRepository.cs`.
- [ ] `src/server/RepairFlow.Api/Features/Access/Infrastructure/AccessDependencies.cs`.
- [ ] `tests/server/RepairFlow.Api.Tests/Features/Access/AccessFixtures.cs`.
- [ ] `tests/server/RepairFlow.Api.Tests/Features/Access/AccessFoundationTests.cs`.
- [ ] `src/server/RepairFlow.Api/Program.cs`, chỉ để register access boundary.

## Step-by-step implementation

- [ ] Đối chiếu C0 target layout và freeze namespace/project path trước khi code.
- [ ] Tạo access feature theo ba tầng; giữ endpoint orchestration mỏng.
- [ ] Định nghĩa role/status enum đúng docs/v0, không thêm role thuận tiện.
- [ ] Định nghĩa context typed cho account đang thực hiện, membership workspace
  và staff được attribution.
- [ ] Để repository chịu trách nhiệm data access; service/policy chịu trách
  nhiệm use case; endpoint chỉ bind request/response.
- [ ] Tạo dependency cho current access context; c1-003 sẽ nối authentication
  thật vào dependency này.
- [ ] Reuse envelope/error/request ID của C0 và loại credential khỏi response.
- [ ] Tạo fixture cho active/inactive account, membership active/suspended,
  nhiều workspace và staff không có account.
- [ ] Register boundary tối thiểu, không expose unfinished business endpoints.
- [ ] Kiểm tra OpenAPI không lộ password, raw token hoặc token hash.

## Testing plan

- [ ] .NET test project import access feature không circular dependency.
- [ ] Fixture phân biệt acting account và attributed staff.
- [ ] Staff không có account không tạo được authenticated session context.
- [ ] Envelope và request ID của C0 không đổi.
- [ ] OpenAPI 3.0 chỉ expose safe contracts.
- [ ] `dotnet test` pass.

## Acceptance criteria

- [ ] Feature sau có thể inject một access context dependency dùng chung.
- [ ] Principal, membership và attributed staff là các type/fixture độc lập.
- [ ] Không trả password, raw token, token hash hoặc secret.
- [ ] Không vô tình expose business endpoint.
- [ ] c1-002 và c1-003 dùng cùng contract/context/fixture, không duplicate logic.
- [ ] Plan sẵn sàng chuyển cho Antigravity làm UI shell.

## Change impact

Nếu role, account hoặc workspace context đổi, cập nhật
`docs/v0/07-authentication-and-authorization.md` trước rồi tăng Revision và
kiểm tra lại c1-003, c1-005, c1-006. Nếu layout C0 đổi, cập nhật tất cả path
trong plan này trước khi implement.
