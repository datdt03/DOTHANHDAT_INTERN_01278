# 002 — RepairFlow API server implementation for Codex

## Goal

Codex xây API server modular monolith bằng FastAPI, PostgreSQL schema/migrations bằng SQL và test suite cho MVP RepairFlow. Server phải thực thi Owner/Manager management access, tenant isolation, staff-profile assignment, state machine, quote immutability, public-link security và transaction rules theo các quyết định/fixture hiện có trong [docs/v0](../docs/v0/README.md). Chưa tạo hoặc coi API contract là tài liệu đã freeze.

## Scope

- Health endpoint, Owner/Manager management auth session và current user.
- Workspace membership, management role và staff-profile responsibility.
- Customer, device, repair order, evidence metadata/file handling.
- Diagnosis, quote draft/sent/version, customer decision.
- Public customer link view/approve/reject, expiry/revoke/rate limit/audit.
- Repair work logs, repair/quality/handover checklists.
- Handover, warranty, status history, audit log và normalized timeline.
- Dashboard, order list/filter, customer/device history.
- Migration, seed, local run instructions và bằng chứng kiểm thử local.

## Execution model cho Codex

Đây là task packet riêng cho Codex. Thực thi theo [master plan v1](./000-repairflow-v1-implementation.md), đọc [requirements closure](../docs/v0/requirements-closure.md), rồi luôn chạy song song với task UI cùng mã cluster. Không chờ toàn bộ API hoàn tất mới bắt đầu hoặc bàn giao toàn bộ cho Antigravity.

| Cluster | Codex task cards | Kết quả Codex phải bàn giao trong cluster |
| --- | --- | --- |
| C0 | C0-S01..S05 | FastAPI/DB foundation, migration proof, baseline fixture |
| C1 | C1-S01..S04 | Owner/Manager auth, session, me, tenant dependency và tests |
| C2 | C2-S01..S04 | Customer/device/order transaction và intake assignment |
| C3 | C3-S01..S04 | Intake checklist, private evidence, signed URL và file tests |
| C4 | C4-S01..S04 | Diagnosis, quote draft/version, decimal totals và audit |
| C5 | C5-S01..S05 | Send quote, public token, public DTO, decision và concurrency tests |
| C6 | C6-S01..S04 | Approved transition, work log, repair checklist, after evidence |
| C7 | C7-S01..S04 | QC pass/fail, rework và state guard |
| C8 | C8-S01..S05 | Handover, warranty, history, timeline và duplicate protection |
| C9 | C9-S01..S04 | Dashboard/list/filter/overdue/needs attention |
| C10 | C10-S01..S06 | Seed, security/concurrency suite, runtime và local verification |

Mỗi task card phải tạo hoặc cập nhật shared fixture, test proof và ghi rõ trạng thái trong kết quả task. Khi server logic chưa hoàn tất, Codex phải cung cấp fixture/stub rõ trạng thái để UI không bị block.

## Out of Scope

- Sửa `src/ui/**`, HTML/CSS, mock data hoặc UI route.
- Payment/inventory/accounting/notification worker/AI diagnosis.
- Bất kỳ dữ liệu nào ngoài [database model](../docs/v0/database-requirements.md#5-đặc-tả-bảng-và-cột) nếu chưa có quyết định nghiệp vụ.
- Trả token thô, internal note hoặc mã mở khóa trong public response.

## Input Files

- [AGENTS.md](../AGENTS.md).
- [README.md](../README.md), nhất là MVP Scope, statuses, business rules và demo scenario.
- [architecture-and-requirements.md](../docs/v0/architecture-and-requirements.md), §§2–7, 8, 11–12.
- [database-requirements.md](../docs/v0/database-requirements.md), §§3, 5, 8–14.
- [usecase.md](../docs/v0/usecase.md), các main/alternative/failure flow của cluster đang làm.
- Shared fixtures và quyết định Product trong [docs/v0](../docs/v0/README.md); không đọc archive như nguồn hiện hành.

## Output Files

- `src/app/**` — application entry, config, modules, repositories/services, management auth, file adapter.
- `src/db/migrations/**` — migrations theo thứ tự database §12.
- `src/db/seed/**` — demo workspace/staff profiles/management access/order.
- `tests/**` — unit/integration/security tests.
- `tests/fixtures/**` hoặc fixture directory hiện có — dữ liệu test dùng chung giữa server và UI nếu cần.

## Files To Write

- API source theo feature trước, loại file sau; không tạo một file “god service”.
- Migration và seed files cho toàn bộ bảng MVP.
- Test fixtures không chứa dữ liệu khách hàng thật.
- `.env.example` hoặc runtime config sample nếu runtime cần; không commit secret thật trong `.env`.
- Nếu runtime sinh OpenAPI tự động thì chỉ xem đó là output kỹ thuật; không dùng nó để ngầm chốt nghiệp vụ chưa được Product duyệt.

## Technical checklist mapped to clusters

A1–A16 dưới đây là checklist kỹ thuật. Đây không phải thứ tự “làm xong server rồi mới làm UI”; mỗi mục phải được thực thi bên trong cluster tương ứng và review cùng Antigravity.

- [x] **A1/C0 — Inventory runtime.** Runtime đã chốt là Python 3.12 + FastAPI/Uvicorn + SQLAlchemy/psycopg + PostgreSQL Docker; migrations dùng SQL versioning và runner tại `src/db/migrate.py`; phải có test hoặc command proof chạy local.
- [x] **A2/C0 — Scaffold API boundary.** Tạo `src/app/` với entrypoint, config, error envelope, request ID và health check; không chạm `src/ui/**`.
- [x] **A3/C0 — Database foundation.** Tạo SQL migrations `0001`–`0006` và runner tại `src/db/migrations/`/`src/db/migrate.py` cho toàn bộ bảng MVP theo [database §12](../docs/v0/database-requirements.md#12-migration-và-seed-data).
- [ ] **A4/C0–C2 — Constraints and indexes.** Áp dụng FK, unique/partial unique, money constraints, timestamp policy và index trong [database §8](../docs/v0/database-requirements.md#8-unique-constraint-và-index). Không dùng float cho tiền.
- [ ] **A5/C1 — Management access and tenant context.** Implement login/logout/me/session chỉ cho Owner/Manager, membership lookup, access-principal inactive/locked rejection, current workspace context và scope mọi repository query theo workspace. Không tạo credential/session cho Receptionist/Technician.
- [ ] **A6/C1–C2 — Management permissions and staff assignment.** Enforce quyền nội bộ ở API cho Owner/Manager; validate staff profile cùng workspace, đúng role vận hành và đang active trước khi assignment; không ghi đè actor history.
- [ ] **A7/C2 — Intake vertical slice.** Implement customer/device search/create và `POST /repair-orders` transaction: create/get customer/device, order `received`, intake staff, initial status history và audit.
- [ ] **A8/C3–C4 — Detail/evidence/diagnosis.** Implement detail DTO, timeline aggregation, evidence validation/private storage/signed URL, diagnosis create; redact internal fields ở public DTO.
- [ ] **A9/C4–C5 — Quote vertical slice.** Implement draft CRUD, server-side line totals, send link transaction, immutable sent/approved quote, version creation và audit. Bao phủ `QUOTE_IMMUTABLE`/`INVALID_TRANSITION`.
- [ ] **A10/C5 — Public decision.** Implement hash token lookup, expiry/revoke/rate limit, public redaction, approve/reject transaction, idempotency/conflict và customer decision snapshot.
- [ ] **A11/C6–C7 — Repair/QC.** Implement status transition endpoint, work logs, repair checklist, quality checklist pass/fail; quality fail phải đưa order về `repairing`.
- [ ] **A12/C8 — Handover/warranty/history.** Implement handover transaction, returned accessories/final condition, `handed_over`, warranty activation từ ngày bàn giao, customer/device history.
- [ ] **A13/C9 — Dashboard/list.** Implement KPI/pipeline/needs attention, order filters including derived `overdue`, pagination và staff activities theo business semantics và shared fixtures đã chốt.
- [ ] **A14/C10 — Seed and reproducibility.** Seed một workspace demo, một management access principal Owner/Manager, staff profiles Receptionist/Technician và một order hoàn chỉnh theo README demo; public token phải tạo mới khi seed và không hard-code secret.
- [ ] **A15/C10 — Shared-fixture verification.** Test response JSON, nullable fields, enum names, money strings, timestamps, error codes và public redaction bằng fixture dùng chung; mọi shape chưa được Product chốt phải ghi là open decision, không tự freeze.
- [ ] **A16/C10 — Local verification.** Ghi lệnh chạy, migration/seed proof, test evidence và known gaps trong kết quả task; không tạo API handoff, release note hoặc production status document.

## Invariants phải test

- `workspace_id` luôn được áp dụng, kể cả bảng không có cột trực tiếp.
- Quote đã `sent`, `approved`, `rejected`, `superseded` hoặc `expired` không được update items.
- Approval/rejection chỉ áp dụng cho quote `sent`, đúng link, đúng version và chỉ một quyết định hợp lệ.
- Không bắt đầu sửa nếu thiếu decision `approved` đúng quote.
- Không ready for pickup nếu quality checklist chưa `passed`.
- Không handover nếu order chưa `ready_for_pickup`.
- Warranty bắt đầu từ ngày handover, trừ exception có role và reason.
- Status history/audit/evidence/decision không bị hard-delete trong flow thông thường.
- `isOverdue` được tính từ expected completion + final-state rule, không ghi thành status `overdue`.
- Chỉ access principal Owner/Manager có thể gọi internal API; staff profile inactive không được nhận assignment mới nhưng lịch sử cũ vẫn giữ.

## Testing Plan

- **Unit:** pure transition table, quote total, overdue calculation, management permission matrix, staff-profile assignment, token hash/expiry, DTO redaction.
- **Integration:** migration up/seed, all route groups, tenant isolation, Owner/Manager session expiry, public link lifecycle, quote version flow, quality fail/pass and handover transaction.
- **Concurrency/idempotency:** two approve requests, send quote twice, simultaneous quote version, stale status transition.
- **Security:** forbidden cross-workspace IDs, inactive/locked management access, inactive staff-profile assignment, revoked/expired token, file MIME/size, no sensitive fields in public DTO/logs.
- **Regression:** demo scenario from README và query shapes trong [database §11](../docs/v0/database-requirements.md#11-query-mẫu-theo-use-case).

## Acceptance Criteria

- [ ] `GET /health`, lệnh chạy, migration/seed proof và test evidence được kiểm chứng local.
- [ ] Mỗi cluster có fixture/decision evidence rõ ràng; không tuyên bố API contract hoặc release readiness khi chưa được Product yêu cầu và chốt.
- [ ] Tenant isolation và management permissions được test bằng access session/IDs hợp lệ nhưng khác workspace.
- [ ] Quote totals do server tính; version cũ immutable và decision traceable đến link.
- [ ] State machine chặn transition sai và trả error code ổn định.
- [ ] Public link chỉ lộ dữ liệu cần cho khách, có expiry/revoke và chống quyết định lặp.
- [ ] Handover tạo warranty đúng policy và timeline đủ actor/time/event.
- [ ] Seed có thể dựng demo scenario và Antigravity có thể chạy UI smoke bằng shared fixture/endpoint semantics của cluster.
