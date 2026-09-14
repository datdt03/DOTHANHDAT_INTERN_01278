# RepairFlow

RepairFlow is a workflow management system for personal device repair shops and independent technicians. This README is the project dashboard for Product Owners: it shows what the product is, where delivery stands, what is blocking progress, and where the evidence lives.

## Product at a glance

### Product goal

RepairFlow manages a repair order from device intake through diagnosis, quotation, customer approval, repair, quality control, handover, and warranty.

The product preserves an evidence trail for four questions:

1. What condition was the device in when it was received?
2. What did the technician diagnose and propose?
3. Which quotation version did the customer approve?
4. What work, quality checks, handover details, and warranty were recorded?

RepairFlow records and explains operational decisions. It does not diagnose faults automatically or decide prices automatically.

### Main workflow

\`\`\`text
Intake
  → Record condition and evidence
  → Diagnose
  → Create quotation
  → Customer approves or rejects through a public link
  → Perform repair
  → Quality check
  → Handover
  → Activate warranty
\`\`\`

### Users and access

| User | Responsibility in the MVP |
| --- | --- |
| Owner / Manager | Logs in, monitors operations, assigns staff, handles overdue orders, and reviews history and audit data. |
| Receptionist / Front Desk | Creates orders, records customer/device details, intake condition, accessories, evidence, and handover details. No separate login. |
| Technician | Records diagnosis, quotations, repair work, checklists, and quality checks. Represented by a staff profile, not a separate login. |
| Customer | Opens an expiring or revocable public link to review and approve or reject a quotation. No account. |

### MVP scope

- Customer, device, and repair order management.
- Intake checklist, accessories, and before-repair evidence.
- Diagnosis and versioned quotations.
- Time-limited customer links and customer approval/rejection.
- Repair checklist, quality check, handover, and warranty.
- Timeline, audit trail, and customer/device history.

Out of scope for the MVP: inventory, payment/accounting, AI diagnosis, automatic price recommendations, multi-branch management, and long-lived customer accounts.

## Project dashboard

**Last reviewed:** 2026-09-15
**Current phase:** \`v0 — Requirements closure\`
**Overall status:** \`BLOCKED — Gate D0 is open\`
**Current implementation gate:** \`C0 — Foundation, shared fixtures, UI adapter boundary, and test harness\`

### Delivery status

| Area | Status | Evidence | Next action | Owner |
| --- | --- | --- | --- | --- |
| Product requirements | \`BLOCKED\` | [Requirements closure](docs/v0/requirements-closure.md) | Close the 44 P0 decisions and confirm Gate D0 | Product |
| Runtime foundation | \`PARTIAL\` | [FastAPI](src/app), [database](src/db), [tests](tests) | Finish the remaining C0 fixture and harness work | Engineering |
| Business API | \`NOT STARTED\` | [API plan](plans/002-api-server-codex.md) | Open C1 only after Gate D0 | Engineering |
| UI integration | \`MOCK BASELINE\` | [UI source](src/ui), [UI plan](plans/003-ui-antigravity.md) | Finish the adapter boundary, then replace mock runtime paths by cluster | UI |
| English standardization | \`IN PROGRESS\` | Repository documentation and UI source | Complete the language pass and run the language audit | Engineering |
| Deployment | \`OUT OF SCOPE\` | v0 scope | Define in a later phase | Product / Engineering |

### Verified baseline

- FastAPI runs from \`src/app/\` and exposes \`GET /health\`.
- PostgreSQL \`18-alpine\` runs through Docker Compose.
- Six versioned SQL migrations create the current 20-table schema.
- The migration runner is idempotent.
- The current test baseline is four passing tests when run with the repository \`PYTHONPATH\`.
- The UI is still a prototype backed by mock data; it is not connected to the business API.

### Current blockers

1. Gate D0 is not complete; the decision backlog contains 44 P0 and 29 P1 items without formal closure.
2. The API contract is not frozen. Current fixtures and response shapes are working implementation aids, not a Product-approved contract.
3. Business endpoints and Owner/Manager authentication are not implemented.
4. The dashboard, order detail, and customer link still depend on mock data.

Do not start C1–C10 business implementation until Product closes the required P0 decisions. The detailed gate is maintained in [requirements-closure.md](docs/v0/requirements-closure.md).

### Cluster view

| Cluster | Business capability | Status |
| --- | --- | --- |
| C0 | Runtime foundation, shared fixtures, adapter boundary, and test harness | \`IN PROGRESS\` |
| C1 | Owner/Manager access and application shell | \`BLOCKED BY D0\` |
| C2 | Customer, device, and order creation | \`BLOCKED BY D0\` |
| C3 | Intake checklist and evidence | \`BLOCKED BY D0\` |
| C4 | Diagnosis and quotation draft | \`BLOCKED BY D0\` |
| C5 | Quotation publishing and customer decision | \`BLOCKED BY D0\` |
| C6 | Repair execution | \`BLOCKED BY D0\` |
| C7 | Quality control and rework | \`BLOCKED BY D0\` |
| C8 | Handover, warranty, and history | \`BLOCKED BY D0\` |
| C9 | Dashboard, filtering, and operational views | \`BLOCKED BY D0\` |
| C10 | Local hardening and final verification | \`BLOCKED BY D0\` |

## Product source of truth

Read these documents in order when reviewing product decisions:

1. [v0 documentation index](docs/v0/README.md)
2. [Requirements closure and Gate D0](docs/v0/requirements-closure.md)
3. [Use cases and acceptance baseline](docs/v0/usecase.md)
4. [Architecture documentation — C4 + arc42](docs/v0/architecture-c4-arc42.md)
5. [Architecture and business requirements](docs/v0/architecture-and-requirements.md)
6. [Database requirements](docs/v0/database-requirements.md)
7. [UI requirements](docs/v0/ui-requirements.md)

The [documentation guide](docs/README.md) explains which document is authoritative for each kind of decision. The [plans index](plans/README.md) contains implementation instructions only; it is not a second product specification.

## Local development

### Install Python dependencies

\`\`\`powershell
python -m venv .venv
.venv\\Scripts\\Activate.ps1
pip install -r requirements-dev.txt
\`\`\`

Use [.env.example](.env.example) for local configuration. Never commit \`.env\`, real passwords, tokens, or customer data.

### Start PostgreSQL

\`\`\`powershell
docker compose up -d db
docker compose ps
\`\`\`

The database is ready when the container reports \`healthy\`.

### Run migrations

\`\`\`powershell
python -m src.db.migrate
\`\`\`

The first run applies the six SQL migrations. Later runs must report that the database is up to date without creating duplicate migration records.

### Start the API

\`\`\`powershell
python -m src.app
\`\`\`

The API runs at \`http://127.0.0.1:8000\` by default. Verify \`GET http://127.0.0.1:8000/health\`.

### Run tests

\`\`\`powershell
$env:PYTHONPATH = (Get-Location).Path
pytest
\`\`\`

## Repository map

\`\`\`text
.
├── README.md                         # PO project dashboard and local quickstart
├── AGENTS.md                         # Repository development rules
├── docker-compose.yml                # Local PostgreSQL runtime
├── requirements*.txt                 # Python dependencies
├── src/
│   ├── app/                          # FastAPI application and business features
│   ├── db/                           # Database connection, migrations, and seeds
│   └── ui/                           # UI prototype/application and mock boundary
├── tests/                             # Backend and integration tests
├── docs/
│   ├── README.md                     # Documentation governance
│   └── v0/                           # Active product requirements for phase v0
├── plans/                            # LLM implementation plans
├── scripts/                          # Build and development scripts
└── assets/                           # Product and prototype assets
\`\`\`

The generated UI bundle is produced by \`scripts/build-bundle.cjs\`; edit UI source files, not \`src/ui/app.bundle.js\` directly.

## Review checklist

- [x] PostgreSQL \`18-alpine\` starts healthy.
- [x] Six versioned SQL migrations are present.
- [x] The migration runner is idempotent.
- [x] The FastAPI \`/health\` endpoint returns HTTP 200.
- [x] The baseline test suite passes four tests.
- [x] The active runtime is \`src/app\`; no \`server/\` directory is used.
- [ ] Gate D0 requirements closure is complete.
- [ ] Business API and Owner/Manager authentication are complete.
- [ ] UI is connected to the real API.
- [ ] English standardization audit is complete.
- [ ] Deployment is defined for a later phase.
