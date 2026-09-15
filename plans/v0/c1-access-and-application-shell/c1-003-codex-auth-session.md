# C1-003 — Codex authentication and session

Plan ID: c1-003

Title: Implement internal authentication và session lifecycle trên .NET

Owner: Codex

Status: PLANNED

Revision: 2

Depends on: c1-002-antigravity-ui-shell.md

Produces: Login/current-session/logout API, session persistence and authentication tests

Consumed by: c1-004-antigravity-auth-ui.md and c1-005-codex-permission-enforcement.md

## Goal

Implement authentication và session lifecycle cho internal account đã được
provision theo v0 auth baseline. Backend ASP.NET Core xác thực credential, tạo
session có hạn sử dụng, gắn đúng workspace context và không làm lộ secret.

## Main business requirements

- MVP login dùng email của access principal do Owner/Manager provision.
- Chỉ principal active và membership active mới tạo được session.
- Staff profile chưa có account không login và không có session.
- Không dùng Google Login, OAuth, SSO, self-signup, shared account hoặc
  impersonation trong MVP.
- Session idle timeout 30 phút, absolute expiry 8 giờ.
- Logout/revoke làm session không còn hợp lệ; thao tác lặp phải safe.
- Password/credential không lưu plaintext; raw token chỉ trả theo policy và
  không ghi log.
- Một session chỉ có một workspace context; không đọc/ghi chéo workspace.
- Login success/failure, logout, reset và permission denied audit/rate-limit ở
  mức phù hợp với MVP.

## Scope

- Credential verification boundary cho provisioned account.
- Persistence cho credential hash và access session bằng versioned SQL migration
  target do .NET migration runner thực thi; không phục hồi migration prototype.
- Operations: authenticate, current session, logout/revoke.
- Password hash/compare bằng thư viện được phê duyệt; không tự viết crypto.
- Session token random, chỉ lưu hash và trả token theo policy.
- Kiểm tra account status, membership status, workspace và expiry ở backend.
- Audit/rate-limit hook không thêm Redis hoặc runtime service mới.
- Cập nhật OpenAPI 3.0 input/output safe fields cho UI adapter.

## Out of scope

- Full permission matrix và assignment check; thuộc c1-005.
- Customer OTP/public link; thuộc C5.
- Staff provisioning UI.
- OAuth, MFA, passkey, SSO hoặc auto invite.
- Distributed session store, Redis hoặc production identity provider.
- Business customer/order endpoint.

## Dependencies

- `c1-001-codex-api-foundation.md`.
- `c1-002-antigravity-ui-shell.md`.
- `docs/v0/02-use-cases.md`, UC-01.
- `docs/v0/03-business-and-domain-requirements.md`.
- `docs/v0/05-database-requirements.md`.
- `docs/v0/07-authentication-and-authorization.md`, AUTH-001–AUTH-013.
- `src/server/RepairFlow.Api/Features/Access/`.
- `src/server/RepairFlow.Api/Infrastructure/Database/`.

## Input files

- `src/server/RepairFlow.Api/Program.cs`.
- `src/server/RepairFlow.Api/Api/Responses/`.
- `src/server/RepairFlow.Api/Features/Access/`.
- `src/server/RepairFlow.Api/Infrastructure/Database/RepairFlowDbContext.cs`.
- `src/server/RepairFlow.Api/Infrastructure/Database/VersionedMigrationRunner.cs`.
- `tests/server/RepairFlow.Api.Tests/Features/Access/`.
- `docs/v0/05-database-requirements.md`.
- `docs/v0/07-authentication-and-authorization.md`.

## Output files

- Target versioned migration cho access session nếu schema delta được yêu cầu.
- Authentication/session application service và repository.
- Login, current-session và logout/revoke API.
- Authenticated context cho các feature sau.
- Unit/API/integration tests cho success và failure paths.
- OpenAPI 3.0 safe contract dùng được bởi c1-004.

## Files to write

- [ ] `src/server/RepairFlow.Api/Infrastructure/Database/Migrations/0007_access_sessions.sql`, chỉ khi schema contract cần delta.
- [ ] `src/server/RepairFlow.Api/Features/Access/Application/CredentialHasher.cs`.
- [ ] `src/server/RepairFlow.Api/Features/Access/Application/AuthenticationService.cs`.
- [ ] `src/server/RepairFlow.Api/Features/Access/Application/SessionService.cs`.
- [ ] `src/server/RepairFlow.Api/Features/Access/Infrastructure/AccessSessionRepository.cs`.
- [ ] `src/server/RepairFlow.Api/Features/Access/Api/AccessContracts.cs`.
- [ ] `src/server/RepairFlow.Api/Features/Access/Api/AccessEndpoints.cs`.
- [ ] `src/server/RepairFlow.Api/Configuration/AuthOptions.cs`.
- [ ] `tests/server/RepairFlow.Api.Tests/Features/Access/AuthenticationTests.cs`.
- [ ] `tests/server/RepairFlow.Api.Tests/Features/Access/SessionTests.cs`.
- [ ] `tests/server/RepairFlow.Api.Tests/Features/Access/AuthApiTests.cs`.

Không sửa hoặc khôi phục các migration file prototype cũ. Migration mới phải
được đối chiếu với docs/v0/05 và đăng ký qua runner target .NET.

## Step-by-step implementation

- [ ] Đối chiếu schema identity và auth baseline; xác định session delta trước
  khi tạo migration mới.
- [ ] Thiết kế migration versioned cho credential hash/session expiry, last
  activity, revoke state, workspace context và audit fields cần thiết.
- [ ] Đảm bảo migration transactional/idempotent theo runner C0 và không sửa
  lịch sử migration đã có trong target schema contract.
- [ ] Implement credential hash verification không lưu/log plaintext.
- [ ] Implement session creation với idle và absolute expiry từ options.
- [ ] Resolve current session từ hashed token; reject revoked/expired/inactive/
  cross-workspace context.
- [ ] Implement logout/revoke và repeated logout safe.
- [ ] Trả safe context gồm account, workspace, role/capability cần cho UI; không
  trả token hash, password hoặc dữ liệu workspace khác.
- [ ] Giữ acting account tách với attributed staff profile.
- [ ] Thêm audit/rate-limit hooks ở boundary không kéo thêm service ngoài MVP.
- [ ] Register endpoints và kiểm tra OpenAPI 3.0.
- [ ] Chốt route/schema/error behavior với Antigravity trước c1-004.

## Testing plan

- [ ] Active principal + active membership authenticate được.
- [ ] Wrong credential trả generic auth error, không account enumeration.
- [ ] Inactive/locked principal hoặc suspended/removed membership bị từ chối.
- [ ] Staff không có account không thể login.
- [ ] Session idle/absolute expiry và revoke được enforce.
- [ ] Session không đọc/ghi chéo workspace.
- [ ] Logout lặp an toàn; token hash/password không xuất hiện trong response/log.
- [ ] Audit/rate-limit hook nhận đúng success/failure/denied event.
- [ ] OpenAPI không expose secret và `dotnet test` pass.

## Acceptance criteria

- [ ] Có thể authenticate provisioned account qua ASP.NET Core API thật.
- [ ] Current session và logout/revoke hoạt động theo timeout policy.
- [ ] Authenticated context được feature sau dùng qua dependency chung.
- [ ] Các failure path không làm lộ account/credential/workspace khác.
- [ ] Migration target được runner .NET quản lý, không phục hồi DB prototype.
- [ ] c1-004 nhận được contract ổn định để nối adapter.

## Change impact

Nếu auth policy, timeout hoặc schema rule đổi, cập nhật docs/v0/05 và
docs/v0/07 trước; sau đó tăng Revision và kiểm tra c1-004, c1-005. Nếu target
migration numbering/layout đổi, cập nhật master/C0 handoff, không sửa âm thầm
đường dẫn trong plan.
