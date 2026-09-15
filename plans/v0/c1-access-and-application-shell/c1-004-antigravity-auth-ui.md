# C1-004 — Antigravity authentication UI

Plan ID: c1-004

Title: Nối login/session UI React với access API

Owner: Antigravity

Status: PLANNED

Revision: 2

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

- [ ] `src/ui/features/access/login-page.tsx`.
- [ ] `src/ui/features/access/access-state.ts`.
- [ ] `src/ui/features/access/access-actions.ts`.
- [ ] `src/ui/shared/api/access-api.ts`.
- [ ] `src/ui/app/session-context.tsx`.
- [ ] `src/ui/features/access/access.css`.
- [ ] `src/ui/shared/components/feedback-state.tsx`.
- [ ] `tests/ui/access/authentication-ui-checklist.md`, nếu repo chưa có UI test convention.

## Step-by-step implementation

- [ ] Đọc OpenAPI và error mapping từ c1-003, không đoán field/route.
- [ ] Map server states thành explicit UI states: booting, login, submitting,
  success, generic auth error, unavailable, expired và logout.
- [ ] Render email validation và credential input; tuyệt đối không log credential.
- [ ] Disable duplicate submit khi request pending, cho retry khi server unavailable.
- [ ] Khi app startup, hiển thị session-checking trước login hoặc internal shell.
- [ ] Khi login thành công, chỉ truyền safe session context vào app shell.
- [ ] Khi expired/revoked, clear local context và trở về login mà không giữ data.
- [ ] Khi logout, clear local state kể cả revoke request thất bại; hiển thị state
  trung tính cho người dùng.
- [ ] Giữ customer-link route độc lập với staff authentication.
- [ ] Chạy Vite type-check/build và kiểm tra desktop/mobile.

## Testing plan

- [ ] Empty/invalid email được xử lý ở UI.
- [ ] Login success chỉ render shell sau server success.
- [ ] Wrong credential hiển thị generic error, không lộ account status.
- [ ] Restore success/failure có state khác nhau.
- [ ] Logout đưa về login và xóa safe context.
- [ ] Expired session sau refresh không hiển thị protected data.
- [ ] Customer-link route vẫn public layout.
- [ ] Vite build/type-check và manual visual checks pass.

## Acceptance criteria

- [ ] Login, restore, logout và expired-session flow rõ ràng, retry được khi phù hợp.
- [ ] UI không coi hidden navigation là authorization.
- [ ] Không render protected screen trước authenticated context.
- [ ] Adapter có thể gọi API thật theo OpenAPI contract mà không đổi renderer.
- [ ] Không có credential/secret trong UI log, URL hoặc visible error.
- [ ] C1-005 có thể đánh giá permission dựa trên context server trả về.

## Change impact

Nếu server đổi response/error state, cập nhật adapter mapping và checklist sau khi
đã xác nhận contract; không sửa layout để che lỗi API. Nếu auth policy đổi,
chuyển change về docs/v0/07 và c1-003/c1-005.
