# RepairFlow v0 — implementation index

> Status: ACTIVE — C0 target-stack migration required before C1
>
> Requirements baseline: Gate D0 closed on 2026-09-16.

Đây là mục lục điều phối triển khai v0. D0 đã cho phép bắt đầu engineering,
nhưng runtime Python/FastAPI đã được xóa để reset implementation; UI hiện tại
vẫn là vanilla JavaScript reference. Vì vậy C0 chưa được coi là hoàn tất theo
target stack trong docs/v0.

## Cách đọc và cách chạy plan

1. Đọc `00-master-plan.md` để nắm mục tiêu, stack target, dependency và phân vai.
2. Chạy plan có sequence nhỏ nhất đang ở trạng thái `READY`.
3. Hoàn thành Codex server slice trước, sau đó Antigravity UI slice.
4. Nếu UI phát hiện server gap, ghi nhận và tạo sequence Codex tiếp theo trước
   khi mở rộng UI.
5. Chỉ đánh dấu cluster `DONE` sau shared integration acceptance.

## Execution status

| Cluster | Nội dung | Trạng thái | Plan hiện tại |
| --- | --- | --- | --- |
| C0 | Migrate runtime sang ASP.NET Core/.NET và React/Vite/TypeScript | MIGRATION REQUIRED | [c0-001-codex-dotnet-api-foundation.md](./c0-runtime-stack-migration/c0-001-codex-dotnet-api-foundation.md) |
| C1 | Access, authentication, authorization và application shell | BLOCKED BY C0 | [c1-001-codex-api-foundation.md](./c1-access-and-application-shell/c1-001-codex-api-foundation.md) |
| C2 | Customer, device và repair order | PLANNED | Chưa tạo task chi tiết |
| C3 | Intake checklist và evidence | PLANNED | Chưa tạo task chi tiết |
| C4 | Diagnosis và quotation draft | PLANNED | Chưa tạo task chi tiết |
| C5 | Quotation publishing và customer decision | PLANNED | Chưa tạo task chi tiết |
| C6 | Repair execution | PLANNED | Chưa tạo task chi tiết |
| C7 | Quality check và rework | PLANNED | Chưa tạo task chi tiết |
| C8 | Handover và history | PLANNED | Chưa tạo task chi tiết |
| C9 | Dashboard, filtering và operational views | PLANNED | Chưa tạo task chi tiết |
| C10 | Hardening và final verification | PLANNED | Chưa tạo task chi tiết |

## C0 task order — stack migration gate

| Order | Plan | Owner | Depends on | Status |
| ---: | --- | --- | --- | --- |
| 1 | [c0-001-codex-dotnet-api-foundation.md](./c0-runtime-stack-migration/c0-001-codex-dotnet-api-foundation.md) | Codex | D0 + compatibility baseline | READY |
| 2 | [c0-002-antigravity-react-vite-foundation.md](./c0-runtime-stack-migration/c0-002-antigravity-react-vite-foundation.md) | Antigravity | c0-001 | PLANNED |
| 3 | [c0-003-shared-stack-migration-acceptance.md](./c0-runtime-stack-migration/c0-003-shared-stack-migration-acceptance.md) | Shared | c0-002 | PLANNED |

C0 chỉ hoàn tất khi health contract, OpenAPI 3.0, .NET API runtime, PostgreSQL
boundary, React/Vite build và API adapter boundary cùng được kiểm chứng. Không
khôi phục các file database/migration prototype cũ trong các plan này.

## C1 task order — sau khi C0 pass

| Order | Plan | Owner | Depends on | Status |
| ---: | --- | --- | --- | --- |
| 1 | [c1-001-codex-api-foundation.md](./c1-access-and-application-shell/c1-001-codex-api-foundation.md) | Codex | c0-003 | BLOCKED |
| 2 | [c1-002-antigravity-ui-shell.md](./c1-access-and-application-shell/c1-002-antigravity-ui-shell.md) | Antigravity | c1-001 | PLANNED |
| 3 | [c1-003-codex-auth-session.md](./c1-access-and-application-shell/c1-003-codex-auth-session.md) | Codex | c1-002 | PLANNED |
| 4 | [c1-004-antigravity-auth-ui.md](./c1-access-and-application-shell/c1-004-antigravity-auth-ui.md) | Antigravity | c1-003 | PLANNED |
| 5 | [c1-005-codex-permission-enforcement.md](./c1-access-and-application-shell/c1-005-codex-permission-enforcement.md) | Codex | c1-004 | PLANNED |
| 6 | [c1-006-antigravity-role-navigation.md](./c1-access-and-application-shell/c1-006-antigravity-role-navigation.md) | Antigravity | c1-005 | PLANNED |
| 7 | [c1-007-shared-integration-acceptance.md](./c1-access-and-application-shell/c1-007-shared-integration-acceptance.md) | Shared | c1-006 | PLANNED |

## Rủi ro triển khai hiện tại

- C0 phải chuyển behavior health, response envelope, request ID và OpenAPI từ
  prototype sang ASP.NET Core mà không làm thay đổi contract đã kiểm chứng.
- Schema contract vẫn là PostgreSQL và migration có version; runner mới phải
  chạy trên backend .NET. Việc chuyển runtime không được tự ý đổi business
  schema hoặc thứ tự migration.
- `src/ui` cũ chỉ là reference. React target phải có adapter/API boundary và
  không đưa business rule vào component.
- C1 không được bắt đầu bằng cách quay lại FastAPI hoặc vanilla JS; các phần đó
  đã bị loại khỏi implementation target.

## Completion rule

C0 là `DONE` khi stack migration acceptance pass. C1 là `DONE` khi login,
session lifecycle, role/workspace authorization, role-aware shell và test
tương ứng pass cùng nhau. Các cluster sau chỉ mở khi dependency trước đã có
output được kiểm chứng.
