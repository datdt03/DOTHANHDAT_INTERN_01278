# 000 — RepairFlow v1 implementation task map

## Goal

Triển khai RepairFlow theo từng business cluster nhỏ, trong đó Codex xử lý server/database/API và Antigravity xử lý UI/API adapter song song trên cùng fixture. Plan này chỉ chứa hướng dẫn triển khai cho LLM; thông tin thảo luận và decision nằm ở `docs/v0/`.

## Preconditions

- Product đã chốt Gate D0 trong `docs/v0/requirements-closure.md`.
- Nếu D0 chưa đạt, chỉ được làm fixture, test harness và skeleton; không tự chốt business rule mới.
- API contract chính thức chưa được coi là tồn tại. Khi cần API boundary, hai task phải dùng fixture/decision đã được chốt trong `docs/v0/` và ghi deviation trong task output, không tự tạo `api-contract.md`.

## Scope

- FastAPI server tại `src/app/`.
- PostgreSQL và SQL migration/seed tại `src/db/`.
- API unit/integration/security tests tại `tests/`.
- UI source, API adapter, session state, feature flow và bundle tại `src/ui/`.
- Customer, device, repair order, staff profile, intake, evidence, diagnosis, quote, public decision, repair, QC, handover, warranty, history và dashboard.
- Local runtime verification, fixture, logging/error behavior và test evidence.

## Out of Scope

- Viết hoặc duy trì API contract/handoff khi người dùng chưa yêu cầu chốt.
- Release documentation, staging/production deployment hoặc production status.
- Payment, inventory, accounting, tax invoice, notification worker, multi-branch, customer account dài hạn.
- Đổi business rule trong `docs/v0/` mà chưa có Product decision.
- Refactor toàn bộ UI không phục vụ flow đang triển khai.

## Input Files

- `AGENTS.md`.
- `README.md`.
- `docs/v0/README.md`.
- `docs/v0/requirements-closure.md`.
- `docs/v0/usecase.md`.
- `docs/v0/architecture-and-requirements.md`.
- `docs/v0/database-requirements.md`.
- `docs/v0/ui-requirements.md`.
- `src/ui/AGENTS.md`.
- Các source/fixture hiện có trong `src/app/`, `src/db/`, `src/ui/` và `tests/`.

## Output Files

- Codex: `src/app/**`, `src/db/**`, `tests/**` và fixture backend.
- Antigravity: `src/ui/**`, `scripts/build-bundle.cjs` nếu cần và fixture/test UI.
- Không tạo file API contract, API handoff hoặc release docs trong plan này.

## Ownership

| Khu vực | Owner |
| --- | --- |
| `src/app/**`, `src/db/**`, backend tests | Codex |
| `src/ui/**`, UI tests/fixtures, bundle source | Antigravity |
| `docs/v0/**` | Product discussion; chỉ cập nhật khi có decision rõ |
| `plans/**` | LLM execution instructions; chỉ tạo/cập nhật khi người dùng yêu cầu |

## Execution Rules

1. Chọn một cluster từ bảng bên dưới.
2. Codex và Antigravity đọc cùng input, chốt fixture và UI/server impact trong task riêng.
3. Hai phía triển khai song song; UI được phép dùng fixture trước khi server hoàn thiện.
4. Không đưa mock fallback vào runtime path của surface đã chuyển sang API thật.
5. Chạy backend test, UI test và shared manual smoke cho đúng cluster.
6. Chỉ đóng cluster khi cả task server và UI có evidence; không đóng chỉ vì một phía đã xong.
7. Sau khi đóng cluster, cập nhật task status hoặc tạo plan tiếp theo chỉ khi người dùng yêu cầu.

## Cluster Map

| Cluster | Luồng | Codex task | Antigravity task | Dependency |
| --- | --- | --- | --- | --- |
| C0 | Runtime foundation hiện có | C0-S01..S05 | C0-U01..U03 | Baseline repository |
| C1 | Owner/Manager access và app shell | C1-S01..S04 | C1-U01..U04 | Gate D0 |
| C2 | Customer/device và create order | C2-S01..S04 | C2-U01..U04 | C1 fixture/session |
| C3 | Intake checklist và evidence | C3-S01..S04 | C3-U01..U04 | C2 order |
| C4 | Diagnosis và quote draft | C4-S01..S04 | C4-U01..U04 | C3 baseline |
| C5 | Gửi quote và public decision | C5-S01..S05 | C5-U01..U05 | C4 quote |
| C6 | Repair work và repair checklist | C6-S01..S04 | C6-U01..U04 | C5 approved |
| C7 | QC pass/fail và rework | C7-S01..S04 | C7-U01..U04 | C6 work |
| C8 | Handover, warranty, history | C8-S01..S05 | C8-U01..U05 | C7 passed |
| C9 | Dashboard, list/filter | C9-S01..S04 | C9-U01..U04 | C2–C8 data |
| C10 | Local hardening và final verification | C10-S01..S05 | C10-U01..U05 | C1–C9 |

## Step-By-Step Implementation

### C0 — Verify current foundation

- [x] C0-S01: verify FastAPI `/health`, request ID và error envelope.
- [x] C0-S02: verify PostgreSQL 18-alpine Docker Compose.
- [x] C0-S03: verify SQL migrations 0001–0006 và idempotent runner.
- [ ] C0-S04: create shared backend fixture convention for later clusters.
- [ ] C0-S05: record baseline test command in the task result, without creating handoff docs.
- [x] C0-U01: inventory prototype routes/features.
- [ ] C0-U02: create UI fixture convention and adapter boundary.
- [ ] C0-U03: mark mock-only surfaces clearly as local/test.

### C1 — Management access and shell

- [ ] C1-S01: add access principal/session storage using SQL migration; do not add password to staff profile table.
- [ ] C1-S02: implement Owner/Manager credential hashing, login/logout, expiry and session invalidation.
- [ ] C1-S03: implement current management principal and workspace context.
- [ ] C1-S04: test inactive/locked principal, suspended membership, cross-workspace access and error behavior.
- [ ] C1-U01: build Owner/Manager login only.
- [ ] C1-U02: build session bootstrap, loading, expired, invalid and forbidden states.
- [ ] C1-U03: build app shell and route guard.
- [ ] C1-U04: build staff profile selector distinct from login/session.

### C2 — Intake data and order creation

- [ ] C2-S01: customer search/create with phone duplicate policy.
- [ ] C2-S02: device search/create with serial/IMEI/identifier validation.
- [ ] C2-S03: create order transaction, order code, initial status history and audit.
- [ ] C2-S04: active staff-profile assignment and rollback/concurrency tests.
- [ ] C2-U01: Customer → Device → Issue/Intake form.
- [ ] C2-U02: duplicate confirmation, search, validation and cancel state.
- [ ] C2-U03: Receptionist profile attribution without Receptionist login.
- [ ] C2-U04: submit loading, 409 handling and detail navigation.

### C3 — Baseline evidence

- [ ] C3-S01: intake checklist validation/completion.
- [ ] C3-S02: private evidence metadata, storage adapter, MIME/size/checksum and signed URL.
- [ ] C3-S03: state/tenant/access guards.
- [ ] C3-S04: invalid upload, retry, missing evidence and redaction tests.
- [ ] C3-U01: intake checklist UI.
- [ ] C3-U02: upload/preview/caption/important/retry UI.
- [ ] C3-U03: baseline/evidence stage rendering without object key/token.
- [ ] C3-U04: disable diagnosis CTA until required baseline is complete.

### C4 — Diagnosis and draft quote

- [ ] C4-S01: diagnosis create/update and Technician staff attribution.
- [ ] C4-S02: quote draft/version and item validation.
- [ ] C4-S03: decimal line/subtotal/total calculation on server.
- [ ] C4-S04: draft edit, invalid item, money and audit tests.
- [ ] C4-U01: diagnosis form and baseline context.
- [ ] C4-U02: quote editor for part/labor/service.
- [ ] C4-U03: server total, null and calculation error rendering.
- [ ] C4-U04: draft editable versus immutable states and Technician selector.

### C5 — Quote publishing and public decision

- [ ] C5-S01: send quote transaction and immutable snapshot.
- [ ] C5-S02: token hash, expiry, revoke, rate limit and access audit.
- [ ] C5-S03: public DTO redaction.
- [ ] C5-S04: approve/reject exact quote version with idempotency/conflict.
- [ ] C5-S05: expired/revoked/old-link/concurrent decision tests.
- [ ] C5-U01: review-before-send and sending/sent/error states.
- [ ] C5-U02: copy public link without logging sensitive values.
- [ ] C5-U03: opaque-token customer route; no customer login.
- [ ] C5-U04: public diagnosis/quote/status view with redaction.
- [ ] C5-U05: approve/reject confirmation, lock-after-success and retry state.

### C6 — Repair execution

- [ ] C6-S01: enforce approved quote/decision before repairing.
- [ ] C6-S02: work log start/end, actual work/parts and Technician attribution.
- [ ] C6-S03: repair checklist and after-repair evidence.
- [ ] C6-S04: extra work, stale update and concurrent assignment tests.
- [ ] C6-U01: approved work view and start repair action in management session.
- [ ] C6-U02: work log and repair checklist.
- [ ] C6-U03: Technician profile attribution without Technician session.
- [ ] C6-U04: retry/offline/server reload state.

### C7 — QC and rework

- [ ] C7-S01: required quality checklist validation.
- [ ] C7-S02: pass → ready_for_pickup and fail → repairing transaction.
- [ ] C7-S03: block direct handover from quality_check.
- [ ] C7-S04: incomplete/fail/concurrent QC tests.
- [ ] C7-U01: QC comparison view.
- [ ] C7-U02: required fail reason/note and missing-item state.
- [ ] C7-U03: pass/rework result after server reload.
- [ ] C7-U04: forbidden/conflict state without local status mutation.

### C8 — Handover and history

- [ ] C8-S01: handover transaction and duplicate protection.
- [ ] C8-S02: warranty start/end/terms and exception audit.
- [ ] C8-S03: customer/device history and normalized timeline.
- [ ] C8-S04: preserve audit/status/evidence/work/decision history.
- [ ] C8-S05: recipient/accessory/retry/history tests.
- [ ] C8-U01: handover form and final condition.
- [ ] C8-U02: discrepancy, confirmation and warranty display.
- [ ] C8-U03: history/timeline read-only UI.
- [ ] C8-U04: Receptionist profile attribution, no separate login.
- [ ] C8-U05: retry and post-transaction reload.

### C9 — Dashboard and operational views

- [ ] C9-S01: dashboard KPI/pipeline from canonical statuses.
- [ ] C9-S02: list/filter/pagination and derived overdue.
- [ ] C9-S03: needs-attention query for overdue, waiting approval, inactive staff and rework.
- [ ] C9-S04: workspace/query/performance tests.
- [ ] C9-U01: replace dashboard mock with adapter.
- [ ] C9-U02: list/filter/pagination/loading/empty/error UI.
- [ ] C9-U03: render status, overdue and staff profile from server data.
- [ ] C9-U04: reload after mutation and verify detail consistency.

### C10 — Local hardening and final verification

- [ ] C10-S01: reproducible local seed with Owner/Manager access and staff profiles.
- [ ] C10-S02: full response/fixture/error/nullable/money/timestamp tests.
- [ ] C10-S03: tenant, access, public token, file privacy and audit security tests.
- [ ] C10-S04: mutation idempotency/concurrency suite.
- [ ] C10-S05: local runbook, backup/restore rehearsal for development database and final test evidence.
- [ ] C10-U01: full UI smoke from management login to warranty and public customer flow.
- [ ] C10-U02: accessibility, keyboard, focus, responsive and form error QA.
- [ ] C10-U03: 401/403/404/409/410/413/415/429 UI mapping.
- [ ] C10-U04: remove runtime mock imports while preserving test fixtures.
- [ ] C10-U05: rebuild bundle and record local verification in the task result.

## Testing Plan

- Unit: state transition, quote calculation, overdue, permission, assignment, token, redaction.
- Integration: fresh database migration, seed, route groups, transaction rollback, tenant isolation.
- Concurrency: duplicate create, send quote, decision, version, status and handover.
- UI: adapter mapping, route, loading/empty/error/forbidden/conflict/expired/retry.
- Manual: one success path and one alternative/failure path per cluster.
- Regression: run the existing repository commands after every cluster; do not invent checks outside the local scope.

## Acceptance Criteria

- [ ] Every cluster has a Codex task and an Antigravity task.
- [ ] No cluster is closed with only server or only UI evidence.
- [ ] All business rules used by implementation are either already in docs/v0 or explicitly signed off in the task input.
- [ ] No API contract/handoff/release document is created without a separate user request.
- [ ] No Technician/Receptionist login is introduced in the MVP.
- [ ] Server owns access, tenant, status, totals, approval, transaction and audit rules.
- [ ] UI owns rendering, interaction, adapter and state presentation, not business decisions.
- [ ] Existing local tests remain passing after each cluster.
