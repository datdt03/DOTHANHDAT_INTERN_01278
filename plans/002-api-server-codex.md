# 002 — RepairFlow API Server Implementation for Codex

## Goal

Build the RepairFlow modular monolith API with FastAPI, PostgreSQL, SQL migrations, and a test suite for the MVP. The server must enforce Owner/Manager management access, tenant isolation, staff-profile assignment, the repair-order state machine, quotation immutability, public-link security, and transaction rules from the approved decisions and fixtures in [docs/v0](../docs/v0/README.md). Do not create or treat an API contract as frozen.

## Scope

- Health endpoint, Owner/Manager management sessions, and current-user lookup.
- Workspace membership, management role, and staff-profile responsibility.
- Customer, device, repair order, evidence metadata, and file handling.
- Diagnosis, quotation draft/version, customer decision, and public customer-link view.
- Expiry, revoke, rate-limit, redaction, and access audit for public links.
- Repair work logs, repair/quality/handover checklists, warranty, status history, audit log, and normalized timeline.
- Dashboard, order list/filter, and customer/device history.
- Migrations, seed data, local run instructions, and test evidence.

## Execution model

This is the Codex task packet. Execute it through the cluster map in [000 — master plan](./000-repairflow-v1-implementation.md), read [requirements closure](../docs/v0/requirements-closure.md), and pair every cluster with the matching Antigravity UI task. Do not complete the entire API before the UI starts.

| Cluster | Codex task cards | Codex deliverable |
| --- | --- | --- |
| C0 | C0-S01..S05 | FastAPI/DB foundation, migration proof, and baseline fixture |
| C1 | C1-S01..S04 | Owner/Manager auth, session, current user, tenant dependency, and tests |
| C2 | C2-S01..S04 | Customer/device/order transaction and intake assignment |
| C3 | C3-S01..S04 | Intake checklist, private evidence, signed URL, and file tests |
| C4 | C4-S01..S04 | Diagnosis, quote draft/version, decimal totals, and audit |
| C5 | C5-S01..S05 | Quote sending, public token, public DTO, decision, and concurrency tests |
| C6 | C6-S01..S04 | Approved transition, work log, repair checklist, and after-repair evidence |
| C7 | C7-S01..S04 | QC pass/fail, rework, and state guard |
| C8 | C8-S01..S05 | Handover, warranty, history, timeline, and duplicate protection |
| C9 | C9-S01..S04 | Dashboard, list, filter, overdue, and needs-attention queries |
| C10 | C10-S01..S06 | Seed, security/concurrency suite, runtime checks, and local verification |

Every task must create or update the shared fixture, test proof, and status evidence for its cluster. When server behavior is incomplete, provide a clearly labeled fixture or stub so the UI is not blocked.

## Out of scope

- Editing \`src/ui/**\`, HTML/CSS, mock data, or UI routes.
- Payment, inventory, accounting, notification workers, or AI diagnosis.
- Adding data outside the [database model](../docs/v0/database-requirements.md) without a Product decision.
- Returning raw tokens, internal notes, or unlock codes in public responses.
- Creating API handoff or release documentation.

## Input files

- [AGENTS.md](../AGENTS.md).
- [README.md](../README.md), especially MVP scope, statuses, business rules, and the demo scenario.
- [architecture-and-requirements.md](../docs/v0/architecture-and-requirements.md).
- [database-requirements.md](../docs/v0/database-requirements.md).
- [usecase.md](../docs/v0/usecase.md).
- Shared fixtures and Product decisions in [docs/v0](../docs/v0/README.md); never use archive files as current requirements.

## Output files

- \`src/app/**\`: application entry, config, modules, repositories/services, management auth, and file adapter.
- \`src/db/migrations/**\`: ordered migrations.
- \`src/db/seed/**\`: demo workspace, staff profiles, management access, and order seed.
- \`tests/**\`: unit, integration, security, and concurrency tests.
- \`tests/fixtures/**\` or the existing shared-fixture directory.
- \`.env.example\` or a runtime sample when required; never commit a real secret.
- Do not edit \`src/ui/app.bundle.js\` directly.

## Technical checklist by cluster

- [x] **A1/C0 — Runtime inventory.** Python 3.12, FastAPI/Uvicorn, SQLAlchemy/psycopg, PostgreSQL Docker, SQL versioning, and the runner at \`src/db/migrate.py\` are recorded and have local proof.
- [x] **A2/C0 — API boundary.** \`src/app/\` contains the entrypoint, config, error envelope, request ID, and health check.
- [x] **A3/C0 — Database foundation.** Migrations 0001–0006 and the migration runner cover the current MVP tables.
- [ ] **A4/C0–C2 — Constraints and indexes.** Apply foreign keys, unique/partial unique constraints, money constraints, timestamp policy, and required indexes. Never use floating point for money.
- [ ] **A5/C1 — Management access and tenant context.** Implement login/logout/current-user/session for Owner/Manager only, membership lookup, inactive/locked rejection, current workspace context, and workspace-scoped repository queries. Do not create credentials or sessions for Receptionist/Technician.
- [ ] **A6/C1–C2 — Permissions and staff assignment.** Enforce internal permissions in the API and validate same-workspace, correct-role, active staff profiles before assignment. Preserve actor history.
- [ ] **A7/C2 — Intake vertical slice.** Implement customer/device search/create and the \`POST /repair-orders\` transaction: customer/device, \`received\` order, intake staff, initial status history, and audit.
- [ ] **A8/C3–C4 — Detail/evidence/diagnosis.** Implement detail DTO, timeline aggregation, evidence validation/private storage/signed URL, diagnosis create, and public redaction.
- [ ] **A9/C4–C5 — Quote vertical slice.** Implement draft CRUD, server-side line totals, send-link transaction, immutable sent/approved quote, version creation, and audit. Cover \`QUOTE_IMMUTABLE\` and \`INVALID_TRANSITION\`.
- [ ] **A10/C5 — Public decision.** Implement hashed-token lookup, expiry/revoke/rate limit, public redaction, approve/reject transaction, idempotency/conflict, and decision snapshot.
- [ ] **A11/C6–C7 — Repair/QC.** Implement status transitions, work logs, repair checklist, and quality checklist pass/fail. Quality failure must return the order to \`repairing\`.
- [ ] **A12/C8 — Handover/warranty/history.** Implement handover transaction, returned accessories/final condition, \`handed_over\`, warranty activation from handover, and customer/device history.
- [ ] **A13/C9 — Dashboard/list.** Implement KPI/pipeline/needs-attention, filters including derived \`overdue\`, pagination, and staff activities from approved semantics and fixtures.
- [ ] **A14/C10 — Seed and reproducibility.** Seed one demo workspace, one Owner/Manager access principal, Receptionist/Technician staff profiles, and a complete README scenario. Generate a new public token on every seed; never hard-code a secret.
- [ ] **A15/C10 — Shared-fixture verification.** Test response JSON, nullable fields, enum names, money strings, timestamps, error codes, and public redaction with the shared fixture. Mark unapproved shapes as open decisions.
- [ ] **A16/C10 — Local verification.** Record commands, migration/seed proof, test evidence, and known gaps in the task result; do not create API handoff, release notes, or production status.

## Invariants to test

- Apply \`workspace_id\` scoping even to tables without a direct workspace column.
- Quotes in \`sent\`, \`approved\`, \`rejected\`, \`superseded\`, or \`expired\` state cannot update items.
- Approval/rejection applies only to a \`sent\` quote, the correct link and version, and one valid decision.
- Repair cannot start without an approved decision for the correct quote.
- An order cannot become ready for pickup before the quality checklist passes.
- Handover cannot occur before \`ready_for_pickup\`.
- Warranty starts at handover unless an authorized exception has a reason.
- Status history, audit, evidence, and decisions are not hard-deleted in normal flows.
- \`isOverdue\` is derived from expected completion and terminal-state rules; it is not a status.
- Only Owner/Manager access principals can call internal APIs. Inactive staff profiles cannot receive new assignments, while old history remains intact.

## Testing plan

- **Unit:** transition table, quote totals, overdue calculation, permission matrix, staff assignment, token hash/expiry, and DTO redaction.
- **Integration:** migration/seed, route groups, tenant isolation, session expiry, public-link lifecycle, quote versions, QC fail/pass, and handover transaction.
- **Concurrency/idempotency:** duplicate approve requests, repeated quote send, simultaneous quote versions, and stale transitions.
- **Security:** cross-workspace IDs, inactive/locked access, inactive staff assignment, revoked/expired tokens, file MIME/size, and sensitive-field redaction.
- **Regression:** the README demo scenario and the query shapes in [database requirements](../docs/v0/database-requirements.md).

## Acceptance criteria

- [ ] \`GET /health\`, run commands, migration/seed proof, and test evidence are locally verified.
- [ ] Each cluster has clear fixture and decision evidence; do not claim a frozen API contract or release readiness without Product approval.
- [ ] Tenant isolation and management permissions are tested with valid sessions/IDs from different workspaces.
- [ ] The server calculates quote totals; old versions are immutable and decisions trace to a link.
- [ ] Invalid state transitions are rejected with stable error codes.
- [ ] Public links expose only customer-required data and enforce expiry/revoke and duplicate-decision protection.
- [ ] Handover creates warranty according to policy and a complete timeline.
- [ ] Seed data reproduces the demo scenario and lets Antigravity run the UI smoke flow against the shared fixture semantics.

