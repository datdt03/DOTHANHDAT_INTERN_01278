# 003 — RepairFlow UI Implementation for Antigravity

## Goal

Complete the RepairFlow MVP UI on the existing prototype baseline. Move data from mocks toward the server through the approved decisions and fixtures in [docs/v0](../docs/v0/README.md), while keeping important business rules on the server. The UI must display server status/capabilities, handle loading/error/empty/forbidden/conflict/public-link states, and use an opaque public token instead of a mock order ID. Do not treat the API contract as frozen.

## Scope

- Shared API client, management-session cookie, and runtime API base URL.
- Owner/Manager login and current session only; no Receptionist or Technician login.
- Receptionist/Technician staff-profile selection for attribution and assignment.
- Dashboard, order list/filter, order detail, intake, evidence, diagnosis, and quote versioning.
- Repair work log/checklist, quality check, handover/warranty/history.
- Customer public-link quote review and one-time approve/reject.
- One boundary that maps canonical API DTOs into the existing render model.
- Bundle regeneration and local build evidence.

## Execution model

This is the Antigravity task packet. Execute it through the [master plan](./000-repairflow-v1-implementation.md), read [requirements closure](../docs/v0/requirements-closure.md), and pair every task with the matching Codex server cluster. UI may start with a shared fixture/stub in the same cluster; it must not wait for the entire business API.

| Cluster | UI task cards | UI deliverable |
| --- | --- | --- |
| C0 | C0-U01..U03 | Prototype baseline, route inventory, and v0 fixture review |
| C1 | C1-U01..U04 | Owner/Manager login, session bootstrap, app shell, and staff selector |
| C2 | C2-U01..U04 | Customer/device/order intake flow and validation states |
| C3 | C3-U01..U04 | Intake checklist, upload/evidence, and baseline lock |
| C4 | C4-U01..U04 | Diagnosis form, quote editor, server total/version states |
| C5 | C5-U01..U05 | Send link, public-token route, and approve/reject states |
| C6 | C6-U01..U04 | Repair work log, checklist, staff attribution, and retry |
| C7 | C7-U01..U04 | QC checklist, pass/fail, and rework states |
| C8 | C8-U01..U05 | Handover, warranty, history, and timeline |
| C9 | C9-U01..U04 | Dashboard/list/filter/detail integration |
| C10 | C10-U01..U05 | Full smoke, accessibility, error matrix, and local verification |

Each task must record its fixture, server surface, UI state, manual evidence, and gate. If an endpoint is not ready, use only a clearly labeled fixture and never fake a business result in the runtime path.

## Out of scope

- Creating or editing server endpoints, migrations, database schema, auth policy, or business rules.
- Calculating final totals, deciding roles/transitions, or simulating approval in the frontend.
- Putting tokens, passwords, API secrets, or sensitive data in \`src/ui/config/\`.
- Keeping the mock API in the runtime path after the server surface has a fixture or endpoint.
- A visual-system refactor unrelated to connecting the MVP flow.

## Input files

- [AGENTS.md](../AGENTS.md).
- [src/ui/AGENTS.md](../src/ui/AGENTS.md).
- [README.md](../README.md), especially MVP scope, statuses, business rules, and the demo scenario.
- [ui-requirements.md](../docs/v0/ui-requirements.md).
- [usecase.md](../docs/v0/usecase.md).
- [architecture-and-requirements.md](../docs/v0/architecture-and-requirements.md).
- Shared fixtures and decisions in [docs/v0](../docs/v0/README.md); never use archive files as current requirements.
- Existing baseline: [src/ui/app.js](../src/ui/app.js), [routes.js](../src/ui/config/routes.js), [ui.config.js](../src/ui/config/ui.config.js), [mock-api.js](../src/ui/mocks/mock-api.js), feature files, and [build-bundle.cjs](../scripts/build-bundle.cjs).

## Output files

- \`src/ui/shared/api/**\`: shared transport/client and error mapping.
- \`src/ui/shared/session/**\`: shared session state when needed.
- \`src/ui/features/**\`: feature pages, actions, and renderers.
- \`src/ui/config/routes.js\`, \`src/ui/config/ui.config.js\`, and \`src/ui/app.js\`.
- \`scripts/build-bundle.cjs\` when new source modules are added.
- \`src/ui/app.bundle.js\`: generated output only.
- UI tests/fixtures when a harness exists; otherwise record manual smoke evidence.

## Files to write

- Create an API boundary such as \`src/ui/shared/api/api-client.js\` and \`repairflow-api.js\`; do not repeat \`fetch\` in renderers/actions.
- Keep one entry file per feature directory and separate \`state → render → actions\` according to [src/ui/AGENTS.md](../src/ui/AGENTS.md).
- Change mock data only for local fixtures/demo; do not treat mock shape as an API contract.
- Never edit \`src/ui/app.bundle.js\` by hand.

## API-to-UI mapping

| UI surface | Server capability (not yet a frozen API contract) | Existing area |
| --- | --- | --- |
| Owner/Manager session | \`POST /auth/login\`, \`GET /me\`, \`POST /auth/logout\` | \`app.js\`, session module |
| Dashboard | \`GET /dashboard\` | \`features/dashboard/\` |
| List/search | \`GET /repair-orders\` | Dashboard table or new list feature |
| Detail/timeline | \`GET /repair-orders/:id\`, \`/timeline\` | \`features/repair-order-detail/\` |
| Intake | Customer/device/order creation | New order flow |
| Evidence | \`POST /repair-orders/:id/evidence\` | Detail condition section |
| Diagnosis | \`POST /repair-orders/:id/diagnosis\` | Detail diagnosis section |
| Quote | Quote draft/update/send/version | Quote renderer and detail actions |
| Public link | \`GET/POST /public/customer-links/:token\` | \`features/customer-link/\` |
| Repair/QC | Work log/checklist/status | Detail repair/QC sections |
| Handover/warranty | Handover/history | Detail/sidebar/history sections |

## Technical checklist by cluster

- [ ] **U1/C0–C1 — Read boundary and shell.** Review v0 docs and fixtures, inventory server/UI states, create transport/session boundaries, and do not edit API source.
- [ ] **U2/C1 — Create transport layer.** Implement one \`request()\` function for base URL, \`credentials: 'include'\`, JSON/multipart, request ID, success/error envelope parsing, and timeout/abort when supported.
- [ ] **U3/C1–C2 — Create server adapter.** Expose named capability functions such as \`getDashboard\`, \`listRepairOrders\`, \`getRepairOrder\`, \`createQuote\`, \`sendQuote\`, and \`submitPublicDecision\`.
- [ ] **U4/C1–C2 — Configure runtime.** Keep the API base URL in config/runtime configuration. Separate the public token from an employee order ID in route parsing.
- [ ] **U5/C1 — Owner/Manager session/login.** Add login/loading/expired/forbidden states for Owner/Manager only. Use a cookie session; never store raw passwords/tokens. Let \`GET /me\` determine displayed management capabilities. Use active staff profiles for attribution when needed.
- [ ] **U6/C9 — Replace dashboard mock.** Map dashboard/actions/table to API DTOs. Read KPI, pipeline, filters, \`isOverdue\`, and canonical status from the server; do not calculate business values from mocks.
- [ ] **U7/C2–C8 — Replace detail mock.** Use the order UUID for data access and display the readable order code. Render sections from the detail DTO, call server mutations, then reload server state.
- [ ] **U8/C2,C8 — Implement intake/history surfaces.** Add customer/device/order creation and history, prevent duplicate submits, and render detailed validation errors.
- [ ] **U9/C4–C5 — Quote flow.** Drafts are editable; sent/approved/rejected versions are read-only. New versions call the server. Render totals, decisions, and versions from API data. The UI does not approve orders locally.
- [ ] **U10/C5 — Public link.** Use an opaque token route and public endpoint. Render expired/revoked/not-found/rate-limited states, confirm approve/reject, and lock buttons after success.
- [ ] **U11/C6–C8 — Repair/QC/handover.** Render work status, checklists, pass/fail, handover, and warranty. Capabilities guide visibility, but server errors always win.
- [ ] **U12/C9–C10 — Remove runtime mock path.** Confirm that connected surfaces no longer import \`mock-api.js\`; retain mocks only as clearly labeled fixtures/local fallback where approved.
- [ ] **U13/C10 — Build artifact.** Update \`scripts/build-bundle.cjs\` for new modules, run it, and never edit the generated bundle manually.
- [ ] **U14/C10 — Local smoke.** Record success and 401/403/404/409/410 evidence in the task result without creating an API handoff or release document.

## UI state rules

- \`loading\`: disable repeatable actions and show a clear spinner/skeleton.
- \`empty\`: distinguish no data from an API error.
- \`error\`: show friendly copy, retain \`error.code\` for debugging, and never render a raw stack or token.
- \`forbidden\`: explain that the user lacks permission; do not only hide a button.
- \`conflict\`: reload server state before retrying.
- \`public expired/revoked\`: do not show an old quote as active.
- \`invalid transition\`: use the server message/capability; never mutate status locally.

## Testing plan

- Adapter unit/manual: success/error envelopes, money formatting, null handling, status/version/orderCode mapping, and public redaction.
- Routing: order UUID vs order code, public token, unknown route, and session refresh.
- Features: loading/empty/error/disabled states, duplicate clicks, and reload after mutation.
- Flow smoke: dashboard → detail → send quote → public view → approve/reject → start repair → QC fail/pass → handover/warranty.
- Security UI: do not log cookies/passwords/tokens; do not render internal notes publicly; do not confuse staff profiles with access sessions.
- Build: bundle generation succeeds from source and the generated file is not manually edited.

## Acceptance criteria

- [ ] A shared API client is the boundary; renderers/actions do not repeat \`fetch\`.
- [ ] Dashboard/detail/customer-link use the matching server surface once its cluster fixture/endpoint is ready.
- [ ] The UI does not treat \`overdue\` as a server status or use order codes as credentials.
- [ ] The server decides totals, approval, transitions, and permissions.
- [ ] Public approve/reject applies to the correct version once; expired/revoked links have clear screens.
- [ ] Network flows have loading/error/empty/forbidden/conflict states.
- [ ] Connected flows no longer import the mock API at runtime; fixtures contain no sensitive data sent to the server.
- [ ] The generated bundle is rebuilt from source and smoke evidence is recorded.

