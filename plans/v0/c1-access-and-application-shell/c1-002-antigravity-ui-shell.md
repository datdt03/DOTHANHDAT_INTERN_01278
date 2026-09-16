# C1-002 — Antigravity React application shell

Plan ID: c1-002

Title: Dựng application shell và route boundary bằng React

Owner: Antigravity

Status: DONE

Revision: 2

Depends on: c1-001-codex-api-foundation.md

Produces: React internal shell, public customer-link boundary and route states

Consumed by: c1-003-codex-auth-session.md and c1-004-antigravity-auth-ui.md

## Goal

Dựng application shell React theo information architecture và UI baseline đã
chốt, tạo nền cho login/session và role navigation. Shell phải phân biệt trạng
thái chưa đăng nhập với internal app, nhưng không coi việc ẩn menu là phân quyền.

## Main business requirements

- Internal UI dành cho access principal có session hợp lệ.
- Owner/Manager, Receptionist và Technician có entry screen phù hợp role.
- Receptionist có operational lookup read-only; Technician có My Work queue.
- Customer link là public flow riêng, không dùng sidebar nội bộ.
- Mọi screen phải có loading, error hoặc empty state phù hợp.

## Scope

- Tạo access feature UI và internal shell trong React.
- Chuẩn hóa bootstrap để phân biệt booting, unauthenticated và authenticated.
- Giữ sidebar, header, workspace context, mobile overlay và main outlet theo
  blueprint; dữ liệu thật của dashboard/work queue để C9.
- Tạo adapter boundary để c1-004 gọi login/logout/me.
- Dùng Vite build và TypeScript; không dùng bundle vanilla làm target runtime.
- Giữ visual direction từ `docs/v0/06` và `docs/v0/08`.

## Out of scope

- Login API, session persistence hoặc backend authorization.
- Dashboard KPI, order list, customer/device data và repair workflow.
- Customer public-link business screen hoàn chỉnh.
- Hard-code permission enforcement trong browser.
- Sửa business rule hoặc API contract.

## Dependencies

- `c0-003-shared-stack-migration-acceptance.md`.
- `c1-001-codex-api-foundation.md`.
- `docs/v0/06-ui-requirements.md`.
- `docs/v0/07-authentication-and-authorization.md`.
- `docs/v0/08-ui-design-blueprint-and-stitch-handoff.md`.
- `src/ui/AGENTS.md` bản React target.

## Input files

- `src/ui/app/main.tsx`.
- `src/ui/app/app-shell.tsx`.
- `src/ui/app/routes.tsx`.
- `src/ui/config/runtime-config.ts`.
- `src/ui/shared/api/api-client.ts`.
- Prototype `src/ui/features/dashboard/` và `src/ui/features/customer-link/`
  chỉ dùng làm reference.
- `docs/v0/06-ui-requirements.md`.
- `docs/v0/08-ui-design-blueprint-and-stitch-handoff.md`.

## Output files

- Internal shell có unauthenticated/loading/authenticated boundary.
- Internal và customer-link layout không lẫn nhau.
- Route/adapter boundary sẵn sàng cho auth API thật.
- Placeholder entry cho Owner/Manager, Receptionist, Technician mà không giả
  vờ dashboard data đã hoàn chỉnh.

## Files to write

- [x] `src/ui/features/access/access-shell.tsx`.
- [x] `src/ui/features/access/access-shell.css`.
- [x] `src/ui/app/app-shell.tsx`.
- [x] `src/ui/app/routes.tsx`.
- [x] `src/ui/app/session-context.tsx`.
- [x] `src/ui/features/dashboard/dashboard-placeholder.tsx`.
- [x] `src/ui/features/customer-link/customer-link-route.tsx`.
- [x] `src/ui/shared/styles/app-shell.css`.
- [x] `src/ui/shared/api/access-api.ts`, chỉ định nghĩa adapter interface.

## Step-by-step implementation

- [x] Đọc React bootstrap và target route trước khi sửa shell.
- [x] Tạo access shell entry, giữ orchestration tách khỏi markup lớn.
- [x] Thêm state booting/session-checking và unauthenticated để c1-004 nối form.
- [x] Chỉ mount internal shell sau khi có authenticated context; dùng safe local
  context cho visual development nếu API chưa cung cấp session.
- [x] Giữ customer-link route trên public layout riêng.
- [x] Tạo slot cho sidebar, header, content và notification; chưa thêm write
  control theo role ở task này.
- [x] Thêm loading, unavailable API, generic error và empty placeholder state.
- [x] Expose adapter interface cho login/logout/me, không import mock trực tiếp
  trong component.
- [x] Chạy Vite build/type-check và kiểm tra desktop/mobile.

## Testing plan

- [x] React app mở được ở trạng thái chưa có session.
- [x] Internal shell không render trước khi session context ready.
- [x] Customer-link preview không nhận sidebar/control nội bộ.
- [x] Mobile sidebar open/close và overlay hoạt động.
- [x] Adapter interface compile và không fetch trực tiếp trong component.
- [x] Vite production build và type-check pass.
- [x] Visual check desktop/mobile pass theo UI requirements.

## Acceptance criteria

- [x] Có boundary loading, unauthenticated và authenticated rõ ràng.
- [x] Route prototype hiện tại không bị dùng làm security boundary.
- [x] Placeholder entry cho ba nhóm role không claim dữ liệu C9 đã có.
- [x] UI gọi adapter thay vì gọi API trong từng component.
- [x] Không có UI-only authorization.
- [x] C1-003 có thể nối auth/session API mà không đổi trách nhiệm render của shell.

## Change impact

Nếu API/session shape đổi, chỉ cập nhật adapter/context mapping sau khi c1-003
được xác nhận; không tự sửa business rule. Nếu information architecture đổi,
cập nhật docs/v0/06 hoặc docs/v0/08 trước khi sửa route/shell.
