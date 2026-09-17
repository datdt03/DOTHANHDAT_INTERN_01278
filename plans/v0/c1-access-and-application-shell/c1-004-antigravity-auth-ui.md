# C1-004 — Antigravity authentication UI

Plan ID: c1-004

Title: Nối login/session UI React với access API

Owner: Antigravity

Status: DONE

Revision: 4

Depends on: c1-003-codex-auth-session.md

Produces: Login, session restore, logout and expired-session UI states

Consumed by: c1-005-codex-permission-enforcement.md and c1-006-antigravity-role-navigation.md

## Goal

Nối React access UI với contract ASP.NET Core đã được Codex kiểm chứng. Người
dùng phải hiểu được login, restore session, logout và session expired; component
chỉ render state từ adapter, không tự xác thực hoặc cấp quyền.

## Main business requirements

- Login dành cho provisioned internal account bằng email/credential theo MVP.
- Không hiển thị hoặc log password, raw token, token hash hay dữ liệu nhạy cảm.
- Wrong credential và account không đủ điều kiện dùng thông báo generic.
- Customer-link route vẫn public, không bị kéo vào staff login.
- Session expired/revoked phải xóa protected context và đưa về login.

## Scope

- Login form React và validation presentation.
- Access adapter gọi authenticate, current session và logout.
- Boot/session-checking, success, unavailable, invalid credential, expired và
  logout states.
- Lưu safe session context ở app state theo policy; không tự lưu credential.
- Toast/inline error, loading và retry behavior.
- Responsive/visual QA theo UI requirements.

## Out of scope

- Thay đổi authentication API, timeout hoặc permission matrix.
- Password reset, OAuth, SSO, MFA, invite hoặc staff provisioning.
- Dashboard/business data.
- Authorization enforcement trong browser.
- Gọi API trực tiếp từ page ngoài adapter.

## Dependencies

- `c1-003-codex-auth-session.md`.
- `c1-002-antigravity-ui-shell.md`.
- `docs/v0/06-ui-requirements.md`.
- `docs/v0/07-authentication-and-authorization.md`.
- `docs/v0/08-ui-design-blueprint-and-stitch-handoff.md`.
- `src/ui/AGENTS.md` React target.

## Input files

- `src/ui/app/main.tsx`.
- `src/ui/app/app-shell.tsx`.
- `src/ui/app/session-context.tsx`.
- `src/ui/features/access/access-shell.tsx`.
- `src/ui/shared/api/api-client.ts`.
- `src/ui/shared/api/access-api.ts`.
- OpenAPI 3.0 output và handoff của c1-003.
- `docs/v0/06-ui-requirements.md`.
- `docs/v0/07-authentication-and-authorization.md`.

## Output files

- Login form và access states hoàn chỉnh ở presentation layer.
- Adapter mapping một-một với auth API/error contract.
- Session restore/logout/expired behavior dùng được cho role navigation.
- Type-check, build và manual visual evidence.

## Files to write

- [x] `src/ui/features/access/access-shell.tsx`.
- [x] `src/ui/features/access/access-shell.css`.
- [x] `src/ui/shared/api/api-client.ts`.
- [x] `src/ui/shared/api/access-api.ts`.
- [x] `src/ui/app/session-context.tsx`.
- [x] `src/ui/app/routes.tsx`.
- [x] `src/ui/app/main.tsx`.
- [x] `src/ui/shared/components/ui-primitives.tsx`.
- [x] `tests/ui/access/authentication-ui-checklist.md`.

## Step-by-step implementation

- [x] Đọc OpenAPI và error mapping từ c1-003, không đoán field/route.
- [x] Map server states thành explicit UI states: booting, login, submitting,
  success, generic auth error, unavailable, expired và logout.
- [x] Render email validation và credential input; tuyệt đối không log credential.
- [x] Disable duplicate submit khi request pending, cho retry khi server unavailable.
- [x] Khi app startup, hiển thị session-checking trước login hoặc internal shell.
- [x] Khi login thành công, chỉ truyền safe session context vào app shell.
- [x] Khi expired/revoked, clear local context và trở về login mà không giữ data.
- [x] Khi logout, clear local state kể cả revoke request thất bại; hiển thị state
  trung tính cho người dùng.
- [x] Giữ customer-link route độc lập với staff authentication.
- [x] Chạy Vite type-check/build và kiểm tra desktop/mobile.

## Testing plan

- [x] Empty/invalid email được xử lý ở UI.
- [x] Login success chỉ render shell sau server success.
- [x] Wrong credential hiển thị generic error, không lộ account status.
- [x] Restore success/failure có state khác nhau.
- [x] Logout đưa về login và xóa safe context.
- [x] Expired session sau refresh không hiển thị protected data.
- [x] Customer-link route vẫn public layout.
- [x] Vite build/type-check và manual visual checks pass.

## Acceptance criteria

- [x] Login, restore, logout và expired-session flow rõ ràng, retry được khi phù hợp.
- [x] UI không coi hidden navigation là authorization.
- [x] Không render protected screen trước authenticated context.
- [x] Adapter có thể gọi API thật theo OpenAPI contract mà không đổi renderer.
- [x] Không có credential/secret trong UI log, URL hoặc visible error.
- [x] C1-005 có thể đánh giá permission dựa trên context server trả về.

## Change impact

Nếu server đổi response/error state, cập nhật adapter mapping và checklist sau khi
đã xác nhận contract; không sửa layout để che lỗi API. Nếu auth policy đổi,
chuyển change về docs/v0/07 và c1-003/c1-005.
