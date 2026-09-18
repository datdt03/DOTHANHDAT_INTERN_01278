# C2-000 — Multi-role context và UI area boundary

Plan ID: c2-000

Title: Chuẩn hóa multi-role account và tách UI theo business area

Owner: Codex and Antigravity

Status: READY

Revision: 1

Depends on: c1-007-shared-integration-acceptance.md

Produces: Multi-role access contract, area-owned UI boundary và implementation rules cho C2

Consumed by: c2-001-codex-customer-device-order-api.md, c2-002, c2-003, c2-004

## Task context

```text
Goal: Cho một account có nhiều role trong cùng workspace mà không nhân bản UI/HTML.
Feature: access-context và C2 UI boundary
Read first: docs/v0/07-authentication-and-authorization.md,
            docs/v0/05-database-requirements.md, src/ui/AGENTS.md,
            src/ui/app/routes.tsx, src/ui/app/session-context.tsx
Allowed to change: access context contract, new migration, C2 UI boundary docs/code.
Do not change: permission rule thành client-only hoặc tạo role-specific application.
Completion criteria: cùng account chuyển được active role hợp lệ; API vẫn enforce
                     quyền; các area được mount/test độc lập.
```

## Goal

Giữ một identity/session cho user có nhiều role, đồng thời cho phép user chọn
“Ngữ cảnh làm việc” để thay đổi trọng tâm UI. Role context không phải một tài
khoản mới và không phải security boundary.

## Main business requirements

- Một workspace membership có thể có nhiều role.
- Chỉ role đã cấp trong workspace hiện tại mới xuất hiện trong switcher.
- Active role được validate ở backend.
- Effective capabilities là nguồn để enforce permission.
- Audit vẫn ghi cùng access principal/user thật.
- Không dùng việc ẩn menu hoặc đổi active role để thay thế authorization.

## Scope

### Access/data contract

- Tạo bảng role chuẩn hóa, dự kiến `workspace_membership_roles`:
  - `id`, `membership_id`, `role`, `is_default`, `created_at`.
  - unique `(membership_id, role)`.
  - tối đa một role mặc định trong mỗi membership.
- Giữ một membership cho một cặp `(workspace_id, user_id)`.
- Backfill role hiện tại từ `workspace_memberships.role` bằng migration mới;
  không sửa migration `20260917_0001`.
- Bổ sung `active_role` vào access session hoặc session context server-side.
- Mở rộng `/api/access/context` trả `roles[]`, `activeRole` và
  `effectiveCapabilities`.
- Bổ sung endpoint đổi active role, dự kiến `POST /api/access/active-role`.
  Endpoint phải kiểm tra role thuộc membership/workspace hiện tại.
- Nếu user có nhiều workspace, chọn workspace trước rồi mới nạp role options.

### UI boundary

- Giữ một `src/ui/index.html`.
- `app/main.tsx` và route dispatcher chỉ làm bootstrap/boundary tối thiểu.
- C2 tạo các area độc lập:
  - `features/customer-records-area/`.
  - `features/device-area/`.
  - `features/repair-order-area/`.
- Mỗi area có mount point, file chính, shell, route, local state và test harness riêng.
- Shared chỉ giữ design tokens, icons, API types/client và primitive components.
- Không import `RoleAwareNavigationShell` vào test của C2 area.

### Role context switcher

- Desktop: header → Workspace switcher → `Ngữ cảnh làm việc` → Notification →
  Avatar.
- Mobile: Account menu → `Ngữ cảnh làm việc`.
- Option có tên role tiếng Việt và mô tả ngắn.
- Hiển thị check ở active role, hỗ trợ keyboard/ARIA.
- Đổi context giữ nguyên account, cookie/session và workspace.
- Area hiện tại được giữ nếu vẫn hợp lệ; nếu không, chuyển về area mặc định
  được phép, không hiển thị protected data cũ.

## Out of scope

- Role impersonation.
- Đăng nhập lại khi chuyển role.
- Một HTML hoặc app riêng cho từng role.
- Dùng `localStorage` để lưu quyền hoặc dữ liệu nghiệp vụ.
- Thay đổi các business permission chưa có trong docs/v0.

## Dependencies

- C1 access/session đã được nghiệm thu.
- C2 product boundary đã được chấp thuận: area-first, một HTML, C2/C3 split.

## Input files

- `src/server/RepairFlow.Api/Features/Access/`.
- `src/server/RepairFlow.Api/Infrastructure/Database/`.
- `tests/server/RepairFlow.Api.Tests/Features/Access/`.
- `src/ui/app/`.
- `src/ui/shared/api/access-api.ts`.
- `src/ui/AGENTS.md`.
- `docs/v0/05-database-requirements.md`.
- `docs/v0/07-authentication-and-authorization.md`.

## Output files

- New role-set migration.
- Updated access context DTO/service/policy/test fixtures.
- UI boundary amendment and role context component contract.
- Per-area mount contract for C2.

## Files to write

- [ ] `src/server/RepairFlow.Api/Infrastructure/Database/Migrations/20260917_0002__spec-v0__support-multiple-membership-roles.sql`.
- [ ] `src/server/RepairFlow.Api/Features/Access/` access context/session files.
- [ ] `tests/server/RepairFlow.Api.Tests/Features/Access/MultiRoleAccessTests.cs`.
- [ ] `src/ui/shared/api/access-api.ts` and session context contract.
- [ ] `src/ui/features/access/role-context-switcher.tsx`.
- [ ] `src/ui/features/access/role-context-switcher.css`.
- [ ] `src/ui/AGENTS.md` and relevant UI blueprint amendment.

## Step-by-step implementation

- [ ] Freeze role-set schema and effective-capability semantics.
- [ ] Create migration with backfill, constraint và idempotency metadata.
- [ ] Refactor backend context projection to return role collection.
- [ ] Implement active-role change with current session validation.
- [ ] Ensure authorization uses effective capabilities, workspace and assignment.
- [ ] Refactor UI access context to consume server projection, not infer security.
- [ ] Add desktop/mobile role context switcher at the approved locations.
- [ ] Create area mount contract and keep top-level bootstrap minimal.
- [ ] Verify C1 login/logout/expiry behavior is unchanged for single-role users.

## Testing plan

- [ ] Existing single-role access tests remain pass.
- [ ] Multi-role account sees only roles assigned to its workspace.
- [ ] Invalid active role returns safe forbidden/error envelope with request ID.
- [ ] Switching active role keeps account/session/workspace identity unchanged.
- [ ] Effective capabilities are stable across role context changes.
- [ ] Revoked/expired session cannot switch role or read protected data.
- [ ] Role switcher is independently renderable without the C1 global shell.
- [ ] No `localStorage` is used for access authority or business data.

## Acceptance criteria

- [ ] Manager + Technician can use one account and one session.
- [ ] UI offers `Ngữ cảnh làm việc` only for multi-role users.
- [ ] UI does not create a second HTML or role-specific app.
- [ ] A role not returned by backend cannot be activated by URL/request tampering.
- [ ] Direct API permission remains correct after every context switch.
- [ ] C2 areas can be mounted/tested independently.

## Change impact

Đây là compatibility extension cho access model C1 để đáp ứng multi-role; không
mở lại C1 acceptance. Migration phải là file mới, không sửa/xóa migration lịch
sử. UI rules phải ghi rõ area-owned shell và shared primitives-only boundary
trước khi các area C2 bắt đầu.
