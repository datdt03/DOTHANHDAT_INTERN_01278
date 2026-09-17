# C1-006 — Antigravity role-aware navigation

Plan ID: c1-006

Title: Hoàn thiện navigation và entry screen theo role bằng React

Owner: Antigravity

Status: READY

Revision: 3

Depends on: c1-005-codex-permission-enforcement.md

Produces: Role-aware React navigation, entry routing and protected UI states

Consumed by: c1-007-shared-integration-acceptance.md and C2–C9 UI plans

## Goal

Hoàn thiện navigation và entry screen dựa trên authenticated context và
capability projection từ server. UI giúp người dùng đi đúng luồng nhưng không tự
cấp quyền, suy role từ URL hoặc thay thế backend authorization.

## Main business requirements

- Owner/Manager vào operational dashboard phù hợp quyền.
- Receptionist vào Today/operational lookup và thấy thông tin read-only cần cho
  hỗ trợ khách.
- Technician vào My Work, tập trung vào order được phân công.
- Menu/action có thể khác theo capability nhưng direct API vẫn do backend chặn.
- Receptionist không thấy edit diagnosis/quote/assignment controls.
- Technician không thấy toàn workspace data, access settings hoặc audit metadata.
- Customer-link layout tách khỏi internal shell.

## Scope

- Role-aware navigation model dựa trên server context.
- Entry route selection sau khi session hydrate.
- Placeholder cho dashboard, Today/lookup và My Work; data thật thuộc C9.
- Read-only/forbidden/empty state ở route boundary.
- Mobile navigation và responsive shell.
- Adapter mapping safe session/capability projection.

## Out of scope

- Dashboard KPI, order list/filter và My Work data thật.
- Customer/device/order CRUD.
- Business permission implementation.
- Customer public link flow hoàn chỉnh.
- Tự suy role từ URL hoặc local storage không được server xác nhận.

## Dependencies

- `c1-004-antigravity-auth-ui.md`.
- `c1-005-codex-permission-enforcement.md`.
- `docs/v0/02-use-cases.md`.
- `docs/v0/06-ui-requirements.md`.
- `docs/v0/07-authentication-and-authorization.md`.
- `docs/v0/08-ui-design-blueprint-and-stitch-handoff.md`.
- `src/ui/app/`, `src/ui/config/`, `src/ui/features/access/`.

## Input files

- `src/ui/app/app-shell.tsx`.
- `src/ui/app/routes.tsx`.
- `src/ui/app/session-context.tsx`.
- `src/ui/config/runtime-config.ts`.
- `src/ui/features/access/access-state.ts`.
- `src/ui/features/dashboard/dashboard-placeholder.tsx`.
- `src/ui/features/customer-link/customer-link-route.tsx`.
- OpenAPI/capability handoff từ c1-005.
- `docs/v0/06-ui-requirements.md`.
- `docs/v0/08-ui-design-blueprint-and-stitch-handoff.md`.

## Output files

- Role-aware internal navigation.
- Entry route mapping cho Owner/Manager, Receptionist, Technician.
- Protected route, forbidden và placeholder states.
- Vite build và visual verification evidence.

## Files to write

- [ ] `src/ui/app/navigation.tsx`.
- [ ] `src/ui/app/routes.tsx`.
- [ ] `src/ui/app/role-entry.ts`.
- [ ] `src/ui/features/access/role-navigation.tsx`.
- [ ] `src/ui/features/access/role-navigation.css`.
- [ ] `src/ui/features/dashboard/dashboard-placeholder.tsx`.
- [ ] `src/ui/features/technician/my-work-placeholder.tsx`.
- [ ] `src/ui/features/receptionist/today-lookup-placeholder.tsx`.
- [ ] `src/ui/shared/components/forbidden-state.tsx`.

## Step-by-step implementation

- [ ] Đọc capability projection và map thành presentation navigation model.
- [ ] Chọn entry route từ server context sau session hydrate, không từ URL tự do.
- [ ] Render navigation variant cho Manager/Owner, Receptionist và Technician.
- [ ] Giữ dashboard, Today/lookup và My Work là destinations rõ ràng dù data còn
  là placeholder của C9.
- [ ] Ẩn presentation action không liên quan; direct unavailable route phải ra
  forbidden/empty state, không render protected data.
- [ ] Giữ customer-link route layout riêng, không gắn internal nav.
- [ ] Kiểm tra active route, mobile sidebar và logout cho từng role.
- [ ] Chạy type-check/build và review screenshot ở viewport docs/v0.

## Testing plan

- [ ] Manager/Owner thấy management entry và không nhận customer-only shell.
- [ ] Receptionist thấy operational lookup và không có technical edit controls.
- [ ] Technician thấy My Work và không có workspace-wide management controls.
- [ ] Direct navigation tới route unavailable hiển thị forbidden/empty state.
- [ ] Customer-link route tách khỏi internal navigation.
- [ ] Refresh/logout giữ đúng access boundary.
- [ ] Vite build/type-check và manual desktop/mobile check pass.

## Acceptance criteria

- [ ] Mỗi MVP role vào đúng entry screen.
- [ ] Navigation phản ánh server context và không tạo authorization.
- [ ] UI không expose protected data trước response filtering của API.
- [ ] Placeholder destination ghi rõ chưa có data thật, không đổi requirements.
- [ ] React target không còn phụ thuộc vanilla bundle để render C1.
- [ ] c1-007 có thể chạy acceptance bằng API thật.

## Change impact

Nếu role/capability response đổi, cập nhật adapter mapping và alignment với
c1-005. Nếu entry screen/navigation hierarchy đổi, cập nhật docs/v0/06 hoặc
docs/v0/08 trước khi sửa route.
