# C1-005 — Codex permission and workspace enforcement

Plan ID: c1-005

Title: Enforce authorization policy trên ASP.NET Core

Owner: Codex

Status: PLANNED

Revision: 2

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

- [ ] `src/server/RepairFlow.Api/Features/Access/Application/AuthorizationPolicy.cs`.
- [ ] `src/server/RepairFlow.Api/Features/Access/Application/AuthorizationRequirements.cs`.
- [ ] `src/server/RepairFlow.Api/Features/Access/Application/CapabilityProjection.cs`.
- [ ] `src/server/RepairFlow.Api/Features/Access/Api/AuthorizationHandlers.cs`.
- [ ] `src/server/RepairFlow.Api/Features/Access/Api/AccessContracts.cs`.
- [ ] `src/server/RepairFlow.Api/Features/Access/Application/AccessService.cs`.
- [ ] `tests/server/RepairFlow.Api.Tests/Features/Access/AuthorizationTests.cs`.
- [ ] `tests/server/RepairFlow.Api.Tests/Features/Access/WorkspaceIsolationTests.cs`.
- [ ] `tests/server/RepairFlow.Api.Tests/Features/Access/AssignmentScopeTests.cs`.

## Step-by-step implementation

- [ ] Chuyển auth matrix thành named policy checks, không thêm custom role.
- [ ] Enforce active principal và active membership trước role evaluation.
- [ ] Enforce workspace identity ở mọi protected resource context.
- [ ] Thêm role checks cho full, view, assigned và operational projection scope.
- [ ] Thêm assignment/responsibility checks cho Receptionist và Technician writes.
- [ ] Tách field filtering của operational projection khỏi raw entity access.
- [ ] Giữ acting account và attributed staff là hai giá trị riêng.
- [ ] Map unauthorized request sang safe 403/404/error envelope có request ID.
- [ ] Expose capability information tối thiểu cho c1-006; không trả audit ẩn,
  credential, token hash hoặc internal notes.
- [ ] Viết policy tests trước khi wiring vào business routes.

## Testing plan

- [ ] Owner/Manager pass full workspace read checks.
- [ ] Receptionist pass operational read projection nhưng fail unrestricted
  technical/audit access và unassigned writes.
- [ ] Technician pass assigned-order checks nhưng fail order/workspace khác.
- [ ] Inactive principal, suspended/removed membership fail.
- [ ] Cross-workspace ID fail mà không lộ dữ liệu workspace kia.
- [ ] Staff profile không account không satisfy authenticated principal.
- [ ] Permission denied dùng envelope và request ID chuẩn.
- [ ] `dotnet test` pass.

## Acceptance criteria

- [ ] Future internal route dùng named policy thay vì duplicate role/workspace logic.
- [ ] Direct API call không bypass permission bằng cách bỏ qua UI navigation.
- [ ] Receptionist và Technician scope khớp auth matrix.
- [ ] Capability projection chỉ phục vụ presentation, không làm yếu backend check.
- [ ] Test có positive/negative path cho mọi MVP role.
- [ ] c1-006 có contract rõ ràng để render navigation.

## Change impact

Nếu permission matrix đổi, cập nhật docs/v0/07 và acceptance scenario trước khi
sửa policy. Nếu cluster sau cần permission mới, tạo task trong cluster đó; không
mở rộng C1 bằng custom ACL không có trong source of truth.
