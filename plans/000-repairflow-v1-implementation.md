# 000 — RepairFlow v1 Implementation Task Map

## Goal

Implement RepairFlow through small business clusters. Codex owns server/database/API work and Antigravity owns UI/API adapter work. Both sides use the same fixture semantics and work in parallel within each cluster. Product discussion and decisions remain in \`docs/v0/\`.

## Preconditions

- Product has closed Gate D0 in \`docs/v0/requirements-closure.md\`.
- If D0 is not achieved, only C0 fixture, test harness, and skeleton work may continue; do not invent new business rules.
- The official API contract is not considered to exist until Product explicitly requests and approves it. Use approved decisions and shared fixture semantics from \`docs/v0/\` for any API boundary.

## Scope

- FastAPI server in \`src/app/\`.
- PostgreSQL, SQL migrations, and seed data in \`src/db/\`.
- API unit, integration, and security tests in \`tests/\`.
- UI source, API adapter, session state, feature flows, and generated bundle in \`src/ui/\`.
- Customer, device, repair order, staff profile, intake, evidence, diagnosis, quotation, public decision, repair, QC, handover, warranty, history, and dashboard.
- Local runtime verification, fixtures, error behavior, and test evidence.

## Out of scope

- Creating or maintaining an API contract or handoff unless explicitly requested.
- Release documentation, staging/production deployment, or production status.
- Payment, inventory, accounting, tax invoice, notification workers, multi-branch support, or long-lived customer accounts.
- Changing \`docs/v0/\` business rules without Product approval.
- A visual-system refactor unrelated to the active MVP flow.

## Input files

- \`AGENTS.md\`, \`README.md\`, \`docs/v0/README.md\`, and \`docs/v0/requirements-closure.md\`.
- \`docs/v0/usecase.md\`, \`docs/v0/architecture-and-requirements.md\`, \`docs/v0/database-requirements.md\`, and \`docs/v0/ui-requirements.md\`.
- \`src/ui/AGENTS.md\`.
- Relevant source, fixture, and test files.

## Output files

- Codex: \`src/app/**\`, \`src/db/**\`, \`tests/**\`, and backend fixtures.
- Antigravity: \`src/ui/**\`, UI fixtures/tests, and \`scripts/build-bundle.cjs\` when needed.
- Do not create API contracts, API handoffs, or release documents in this plan.

## Ownership

| Area | Owner |
| --- | --- |
| \`src/app/**\`, \`src/db/**\`, backend tests | Codex |
| \`src/ui/**\`, UI tests/fixtures, bundle source | Antigravity |
| \`docs/v0/**\` | Product discussion; update only after an explicit decision |
| \`plans/**\` | LLM execution instructions; update only when requested |

## Execution rules

1. Select one cluster.
2. Codex and Antigravity read the same inputs and record fixture and impact decisions.
3. Both sides implement in parallel; UI may use a fixture before the server is complete.
4. Remove a mock runtime path once its surface moves to the real API.
5. Run backend tests, UI checks, and one shared manual smoke flow for the cluster.
6. Close a cluster only when both server and UI have evidence.
7. Update task status or create a follow-up plan only when requested.

## Cluster map

| Cluster | Flow | Codex task | Antigravity task | Dependency |
| --- | --- | --- | --- | --- |
| C0 | Runtime foundation | C0-S01..S05 | C0-U01..U03 | Repository baseline |
| C1 | Owner/Manager access and app shell | C1-S01..S04 | C1-U01..U04 | Gate D0 |
| C2 | Customer/device and order creation | C2-S01..S04 | C2-U01..U04 | C1 fixture/session |
| C3 | Intake checklist and evidence | C3-S01..S04 | C3-U01..U04 | C2 order |
| C4 | Diagnosis and quote draft | C4-S01..S04 | C4-U01..U04 | C3 baseline |
| C5 | Quote publishing and public decision | C5-S01..S05 | C5-U01..U05 | C4 quote |
| C6 | Repair work and repair checklist | C6-S01..S04 | C6-U01..U04 | C5 approved |
| C7 | QC pass/fail and rework | C7-S01..S04 | C7-U01..U04 | C6 work |
| C8 | Handover, warranty, and history | C8-S01..S05 | C8-U01..U05 | C7 passed |
| C9 | Dashboard, list, and filters | C9-S01..S04 | C9-U01..U04 | C2–C8 data |
| C10 | Local hardening and final verification | C10-S01..S05 | C10-U01..U05 | C1–C9 |

## Step-by-step implementation

### C0 — Verify the current foundation

- [x] C0-S01: verify FastAPI \`/health\`, request ID, and error envelope.
- [x] C0-S02: verify PostgreSQL 18-alpine through Docker Compose.
- [x] C0-S03: verify SQL migrations 0001–0006 and the idempotent runner.
- [ ] C0-S04: create the shared backend fixture convention.
- [ ] C0-S05: record the baseline test command without creating a handoff document.
- [x] C0-U01: inventory prototype routes and features.
- [ ] C0-U02: create the UI fixture convention and adapter boundary.
- [ ] C0-U03: mark mock-only surfaces clearly as local/test fixtures.

### C1 — Management access and shell

- [ ] C1-S01: add access-principal/session storage; do not add passwords to staff profiles.
- [ ] C1-S02: implement Owner/Manager credential hashing, login/logout, expiry, and invalidation.
- [ ] C1-S03: implement the current management principal and workspace context.
- [ ] C1-S04: test inactive/locked principals, suspended membership, cross-workspace access, and errors.
- [ ] C1-U01: build Owner/Manager login only.
- [ ] C1-U02: build session bootstrap, loading, expired, invalid, and forbidden states.
- [ ] C1-U03: build the app shell and route guard.
- [ ] C1-U04: build a staff-profile selector distinct from login/session.

### C2 — Intake data and order creation

- [ ] C2-S01: implement customer search/create and phone duplicate policy.
- [ ] C2-S02: implement device search/create with serial/IMEI/identifier validation.
- [ ] C2-S03: create the order transaction, order code, initial status history, and audit.
- [ ] C2-S04: validate active staff assignment and rollback/concurrency behavior.
- [ ] C2-U01: build the Customer → Device → Issue/Intake form.
- [ ] C2-U02: build duplicate confirmation, search, validation, and cancel states.
- [ ] C2-U03: attribute the Receptionist profile without a Receptionist login.
- [ ] C2-U04: handle submit loading, 409 responses, and detail navigation.

### C3 — Baseline evidence

- [ ] C3-S01: validate intake checklist completion.
- [ ] C3-S02: add private evidence metadata, storage adapter, MIME/size/checksum checks, and signed URLs.
- [ ] C3-S03: enforce state, tenant, and access guards.
- [ ] C3-S04: test invalid upload, retry, missing evidence, and redaction.
- [ ] C3-U01: build the intake checklist.
- [ ] C3-U02: build upload, preview, caption, important, and retry states.
- [ ] C3-U03: render evidence without object keys or tokens.
- [ ] C3-U04: disable diagnosis until baseline evidence is complete.

### C4 — Diagnosis and draft quote

- [ ] C4-S01: implement diagnosis create/update and Technician attribution.
- [ ] C4-S02: implement quote drafts, versions, and item validation.
- [ ] C4-S03: calculate decimal line totals, subtotal, and total on the server.
- [ ] C4-S04: test draft editing, invalid items, money values, and audit.
- [ ] C4-U01: build the diagnosis form with baseline context.
- [ ] C4-U02: build the part/labor/service quote editor.
- [ ] C4-U03: render server totals, nulls, and calculation errors.
- [ ] C4-U04: distinguish editable drafts from immutable states and add a Technician selector.

### C5 — Quote publishing and public decision

- [ ] C5-S01: send a quote transaction and create an immutable snapshot.
- [ ] C5-S02: hash tokens, enforce expiry/revoke/rate limits, and audit access.
- [ ] C5-S03: redact the public DTO.
- [ ] C5-S04: approve/reject the exact quote version with idempotency/conflict handling.
- [ ] C5-S05: test expired/revoked/old links and concurrent decisions.
- [ ] C5-U01: build review-before-send and sending/sent/error states.
- [ ] C5-U02: copy a public link without logging sensitive values.
- [ ] C5-U03: use an opaque-token route with no customer login.
- [ ] C5-U04: render the public diagnosis, quote, and status with redaction.
- [ ] C5-U05: confirm approve/reject, lock buttons after success, and support retry.

### C6 — Repair execution

- [ ] C6-S01: enforce approval before repair.
- [ ] C6-S02: record work-log start/end, actual work/parts, and Technician attribution.
- [ ] C6-S03: add the repair checklist and after-repair evidence.
- [ ] C6-S04: test extra work, stale updates, and concurrent assignment.
- [ ] C6-U01: build the approved-work view and start-repair action.
- [ ] C6-U02: build work-log and repair-checklist screens.
- [ ] C6-U03: attribute a Technician profile without a Technician session.
- [ ] C6-U04: handle retry, offline, and server-reload states.

### C7 — QC and rework

- [ ] C7-S01: validate the required quality checklist.
- [ ] C7-S02: transition pass → \`ready_for_pickup\` and fail → \`repairing\`.
- [ ] C7-S03: block direct handover from \`quality_check\`.
- [ ] C7-S04: test incomplete, failed, and concurrent QC submissions.
- [ ] C7-U01: build the QC comparison view.
- [ ] C7-U02: require a failure reason/note and show missing-item states.
- [ ] C7-U03: render pass/rework results after server reload.
- [ ] C7-U04: show forbidden/conflict states without local status mutation.

### C8 — Handover and history

- [ ] C8-S01: implement handover and duplicate protection.
- [ ] C8-S02: implement warranty start/end/terms and exception audit.
- [ ] C8-S03: implement customer/device history and a normalized timeline.
- [ ] C8-S04: preserve audit, status, evidence, work, and decision history.
- [ ] C8-S05: test recipient, accessory, retry, and history behavior.
- [ ] C8-U01: build the handover form and final-condition view.
- [ ] C8-U02: build discrepancy confirmation and warranty display.
- [ ] C8-U03: build read-only history/timeline UI.
- [ ] C8-U04: attribute a Receptionist profile without a separate login.
- [ ] C8-U05: reload after transactions and support retry.

### C9 — Dashboard and operational views

- [ ] C9-S01: calculate dashboard KPIs and pipeline from canonical statuses.
- [ ] C9-S02: implement list/filter/pagination and derived overdue behavior.
- [ ] C9-S03: query overdue, waiting approval, inactive staff, and rework attention items.
- [ ] C9-S04: add workspace/query/performance tests.
- [ ] C9-U01: replace dashboard mock data with the adapter.
- [ ] C9-U02: build list/filter/pagination/loading/empty/error UI.
- [ ] C9-U03: render status, overdue, and staff profile from server data.
- [ ] C9-U04: reload after mutation and verify detail consistency.

### C10 — Local hardening and final verification

- [ ] C10-S01: create a reproducible local seed with Owner/Manager access and staff profiles.
- [ ] C10-S02: add response/fixture/error/nullable/money/timestamp tests.
- [ ] C10-S03: test tenant, access, public token, file privacy, and audit security.
- [ ] C10-S04: test mutation idempotency and concurrency.
- [ ] C10-S05: rehearse local database backup/restore and record test evidence.
- [ ] C10-U01: smoke-test management login through warranty and the public customer flow.
- [ ] C10-U02: verify accessibility, keyboard, focus, responsive, and form-error behavior.
- [ ] C10-U03: map 401/403/404/409/410/413/415/429 responses.
- [ ] C10-U04: remove runtime mock imports while retaining fixtures.
- [ ] C10-U05: rebuild the bundle and record local verification.

## Testing plan

- Unit: state transitions, quote calculation, overdue calculation, permissions, assignment, tokens, and redaction.
- Integration: fresh migrations, seed, route groups, transaction rollback, and tenant isolation.
- Concurrency: duplicate creation, quote sending, decisions, versioning, status changes, and handover.
- UI: adapter mapping, routing, loading/empty/error/forbidden/conflict/expired/retry states.
- Manual: one success path and one alternative/failure path per cluster.
- Regression: run the repository's existing checks after every cluster.

## Acceptance criteria

- [ ] Every cluster has a Codex task and an Antigravity task.
- [ ] No cluster closes with only server or only UI evidence.
- [ ] Every business rule used by implementation is in \`docs/v0/\` or explicitly signed off.
- [ ] No API contract, handoff, or release document is created without a separate request.
- [ ] No Technician or Receptionist login is introduced in the MVP.
- [ ] The server owns access, tenant, status, totals, approval, transaction, and audit rules.
- [ ] The UI owns rendering, interaction, adapter, and state presentation.
- [ ] Existing local tests remain passing after each cluster.

