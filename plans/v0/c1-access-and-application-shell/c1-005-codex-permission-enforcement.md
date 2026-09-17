# C1-005 — Codex permission and workspace enforcement

Plan ID: c1-005

Title: Enforce authorization policy trên ASP.NET Core

Owner: Codex

Status: DONE

Revision: 3

Depends on: c1-004-antigravity-auth-ui.md

Produces: Central authorization policy, capability projection and isolation tests

Consumed by: c1-006-antigravity-role-navigation.md and all later business clusters

## Goal

Đưa permission matrix và workspace isolation vào một backend policy boundary dùng
chung cho C2–C10. Route nghiệp vụ về sau chỉ gọi policy/dependency này, không copy
logic role, assignment hoặc workspace từ UI hay feature khác.

## Main business requirements

- Mọi internal API kiểm tra active session trước khi xử lý.
- Membership phải thuộc workspace hiện tại và không suspended/removed.
- Role phải có quyền cho action đang yêu cầu.
- Owner/Manager có phạm vi vận hành workspace theo auth matrix.
- Receptionist được operational read projection toàn workspace nhưng write bị
  giới hạn theo assignment/responsibility.
- Technician chỉ đọc/thao tác order được phân công và responsibility phù hợp.
- Staff profile không có account chỉ được attribution bởi principal có quyền,
  không dùng profile đó để tạo session.
- Không cross-workspace access hoặc lộ sự tồn tại dữ liệu workspace khác.
- Acting account và attributed staff luôn là hai giá trị riêng.

## Scope

- Policy evaluator cho principal, membership, role, workspace và assignment context.
- ASP.NET Core authorization handlers/policies cho authenticated, role,
  workspace và assignment checks.
- Capability projection an toàn để UI biết presentation action/navigation.
- Error mapping 403/404 theo policy để không lộ tenant khác.
- Test matrix cho Owner, Manager, Receptionist, Technician và staff không account.
- Interface để C2–C10 kiểm tra assignment mà không copy logic.

## Out of scope

- Staff account/role management UI.
- Customer public link/OTP.
- Authorization chi tiết của từng business entity ngoài generic context.
- Custom role, ACL editor, impersonation hoặc cross-workspace switching nâng cao.
- Permission enforcement ở UI thay cho backend.

## Dependencies

- `c1-003-codex-auth-session.md`.
- `c1-004-antigravity-auth-ui.md`.
- `docs/v0/02-use-cases.md`, BR-01 và assignment scenarios.
- `docs/v0/03-business-and-domain-requirements.md`.
- `docs/v0/07-authentication-and-authorization.md`.
- `src/server/RepairFlow.Api/Features/Access/`.
- `tests/server/RepairFlow.Api.Tests/Features/Access/`.

## Input files

- `src/server/RepairFlow.Api/Features/Access/Api/AccessEndpoints.cs`.
- `src/server/RepairFlow.Api/Features/Access/Application/AccessContext.cs`.
- `src/server/RepairFlow.Api/Features/Access/Application/SessionService.cs`.
- `src/server/RepairFlow.Api/Features/Access/Infrastructure/AccessRepository.cs`.
- `docs/v0/02-use-cases.md`.
- `docs/v0/03-business-and-domain-requirements.md`.
- `docs/v0/07-authentication-and-authorization.md`.

## Output files

- Central authorization policy/dependency boundary.
- Safe capability projection for React navigation.
- Workspace-isolation and assignment test matrix.
- Reusable policy interface for later business routes.

## Files to write

- [x] `src/server/RepairFlow.Api/Features/Access/Application/AuthorizationPolicy.cs`.
- [x] `src/server/RepairFlow.Api/Features/Access/Application/AuthorizationRequirements.cs`.
- [x] `src/server/RepairFlow.Api/Features/Access/Application/CapabilityProjection.cs`.
- [x] `src/server/RepairFlow.Api/Features/Access/Api/AuthorizationHandlers.cs`.
- [x] `src/server/RepairFlow.Api/Features/Access/Api/AccessContracts.cs`.
- [x] `src/server/RepairFlow.Api/Features/Access/Application/AccessService.cs`.
- [x] `tests/server/RepairFlow.Api.Tests/Features/Access/AuthorizationTests.cs`.
- [x] `tests/server/RepairFlow.Api.Tests/Features/Access/WorkspaceIsolationTests.cs`.
- [x] `tests/server/RepairFlow.Api.Tests/Features/Access/AssignmentScopeTests.cs`.

## Step-by-step implementation

- [x] Chuyển auth matrix thành named policy checks, không thêm custom role.
- [x] Enforce active principal và active membership trước role evaluation.
- [x] Enforce workspace identity ở mọi protected resource context.
- [x] Thêm role checks cho full, view, assigned và operational projection scope.
- [x] Thêm assignment/responsibility checks cho Receptionist và Technician writes.
- [x] Tách field filtering của operational projection khỏi raw entity access.
- [x] Giữ acting account và attributed staff là hai giá trị riêng.
- [x] Map unauthorized request sang safe 403/404/error envelope có request ID.
- [x] Expose capability information tối thiểu cho c1-006; không trả audit ẩn,
  credential, token hash hoặc internal notes.
- [x] Viết policy tests trước khi wiring vào business routes.

## Testing plan

- [x] Owner/Manager pass full workspace read checks.
- [x] Receptionist pass operational read projection nhưng fail unrestricted
  technical/audit access và unassigned writes.
- [x] Technician pass assigned-order checks nhưng fail order/workspace khác.
- [x] Inactive principal, suspended/removed membership fail.
- [x] Cross-workspace ID fail mà không lộ dữ liệu workspace kia.
- [x] Staff profile không account không satisfy authenticated principal.
- [x] Permission denied dùng envelope và request ID chuẩn.
- [x] `dotnet test` pass — 45/45 tests.

## Acceptance criteria

- [x] Future internal route dùng named policy thay vì duplicate role/workspace logic.
- [x] Direct API call không bypass permission bằng cách bỏ qua UI navigation.
- [x] Receptionist và Technician scope khớp auth matrix.
- [x] Capability projection chỉ phục vụ presentation, không làm yếu backend check.
- [x] Test có positive/negative path cho mọi MVP role.
- [x] c1-006 có contract rõ ràng để render navigation.

## Implementation evidence

- ASP.NET Core có named policies, authentication/authorization handlers, capability projection và safe 403/404 mapping; `GET /api/access/context` đã được bảo vệ bằng policy authenticated.
- Test-only protected routes chứng minh direct API denial, workspace isolation và request ID/error envelope mà không mở thêm business endpoint.
- Local development seeder đã cập nhật credential hash của ba account init; plaintext credential không được lưu hoặc ghi log.

## Change impact

Nếu permission matrix đổi, cập nhật docs/v0/07 và acceptance scenario trước khi
sửa policy. Nếu cluster sau cần permission mới, tạo task trong cluster đó; không
mở rộng C1 bằng custom ACL không có trong source of truth.
