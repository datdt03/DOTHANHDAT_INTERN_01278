# C1-006 — Antigravity role-aware navigation

Plan ID: c1-006

Title: Hoàn thiện navigation và entry screen theo role bằng React

Owner: Antigravity

Status: DONE

Revision: 4

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

- [x] `src/ui/app/navigation.tsx`.
- [x] `src/ui/app/routes.tsx`.
- [x] `src/ui/app/role-entry.ts`.
- [x] `src/ui/features/access/role-navigation.tsx`.
- [x] `src/ui/features/access/role-navigation.css`.
- [x] `src/ui/features/dashboard/dashboard-placeholder.tsx`.
- [x] `src/ui/features/technician/my-work-placeholder.tsx`.
- [x] `src/ui/features/receptionist/today-lookup-placeholder.tsx`.
- [x] `src/ui/shared/components/forbidden-state.tsx`.

## Step-by-step implementation

- [x] Đọc capability projection và map thành presentation navigation model.
- [x] Chọn entry route từ server context sau session hydrate, không từ URL tự do.
- [x] Render navigation variant cho Manager/Owner, Receptionist và Technician.
- [x] Giữ dashboard, Today/lookup và My Work là destinations rõ ràng dù data còn
  là placeholder của C9.
- [x] Ẩn presentation action không liên quan; direct unavailable route phải ra
  forbidden/empty state, không render protected data.
- [x] Giữ customer-link route layout riêng, không gắn internal nav.
- [x] Kiểm tra active route, mobile sidebar và logout cho từng role.
- [x] Chạy type-check/build và review screenshot ở viewport docs/v0.

## Testing plan

- [x] Manager/Owner thấy management entry và không nhận customer-only shell.
- [x] Receptionist thấy operational lookup và không có technical edit controls.
- [x] Technician thấy My Work và không có workspace-wide management controls.
- [x] Direct navigation tới route unavailable hiển thị forbidden/empty state.
- [x] Customer-link route tách khỏi internal navigation.
- [x] Refresh/logout giữ đúng access boundary.
- [x] Vite build/type-check và manual desktop/mobile check pass.

## Acceptance criteria

- [x] Mỗi MVP role vào đúng entry screen.
- [x] Navigation phản ánh server context và không tạo authorization.
- [x] UI không expose protected data trước response filtering của API.
- [x] Placeholder destination ghi rõ chưa có data thật, không đổi requirements.
- [x] React target không còn phụ thuộc vanilla bundle để render C1.
- [x] c1-007 có thể chạy acceptance bằng API thật.

## Implementation evidence

- Role entry mapping qua `src/ui/app/role-entry.ts`: Owner/Manager -> `#/dashboard`, Receptionist -> `#/today`, Technician -> `#/my-work`.
- Route boundary bảo vệ qua `src/ui/app/navigation.tsx` và `src/ui/app/routes.tsx`: chặn truy cập trực tiếp bằng `<ForbiddenState />` 403, hoàn toàn không render protected data.
- Placeholders chuyên biệt: `dashboard-placeholder.tsx` (UI-A06), `today-lookup-placeholder.tsx` (UI-A07/B02, read-only), `my-work-placeholder.tsx` (UI-A08, SLA-priority list).
- Checklist kiểm thử `tests/ui/access/role-navigation-checklist.md` đã hoàn thành.
- TypeScript `npm run type-check` pass (0 errors).
- Vite `npm run build` pass (0 errors, 1.17s).
- Backend tests `dotnet test src/server/RepairFlow.sln` pass (45/45 tests).

## Change impact

Nếu role/capability response đổi, cập nhật adapter mapping và alignment với
c1-005. Nếu entry screen/navigation hierarchy đổi, cập nhật docs/v0/06 hoặc
docs/v0/08 trước khi sửa route.
