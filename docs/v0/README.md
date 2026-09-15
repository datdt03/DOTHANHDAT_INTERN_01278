# RepairFlow — v0 Documentation

## Role

`docs/v0/` contains the product discussion, business analysis, scope, and decisions for RepairFlow phase v0.

These documents are the product source of truth used to prepare implementation plans when the user requests them. They are not LLM task instructions, API contracts, or release handoffs.

Read [the documentation guide](../README.md) first. It defines the documentation boundaries, decision labels, and phase rules.

## Phase status

- **Phase status:** `DECIDED — Gate D0 is closed`.
- The v0 product baseline is closed for implementation; business clusters C1–C10 are open.
- ASP.NET Core Web API trên .NET, PostgreSQL và versioned SQL migrations là
  nền tảng kỹ thuật target; .NET là backend/API bắt buộc.
- The previous C0 Python/FastAPI runtime, Python tests and prototype migration
  files were intentionally removed for a clean target-stack implementation reset.
- PostgreSQL 18-alpine remains the local database target; the .NET migration
  runner, health endpoint, response envelope, request ID and test baseline must
  be recreated by the C0 implementation plans.
- C0 target runtime is not active until the ASP.NET Core/.NET and React/Vite
  migration acceptance passes.
- Business implementation continues by cluster; the UI prototype is still backed by mock data until its adapter is connected.
- The target web UI is React + Vite + TypeScript; React is not the authoritative
  business API layer.
- Owner, Manager, Receptionist and Technician may receive accounts with fixed role and assignment access. Staff profiles without accounts have no session; Customer has no long-lived account and uses a public link. Detailed scope is in [07-authentication-and-authorization.md](./07-authentication-and-authorization.md).
- Warranty is explicitly deferred from the v0 workflow, schema, UI and permission model; it will be designed as a separate module later.
- UI direction, role-aware navigation, Receptionist operational lookup, viewport
  targets, and the Stitch/Antigravity handoff process are recorded in
  [08-ui-design-blueprint-and-stitch-handoff.md](./08-ui-design-blueprint-and-stitch-handoff.md).

API contracts, API handoffs, and release documentation must follow the closed v0 baseline and be updated together with implementation changes.

## Reading order and document status

Read the active documents in this order:

| Order | Document | Status | Source of truth for |
| --- | --- | --- | --- |
| 01 | [Requirements closure](./01-requirements-closure.md) | `DECIDED — Gate D0 closed` | Closure decision and implementation entry criteria. |
| 02 | [Use cases](./02-use-cases.md) | `DECIDED — v0 baseline` | Actors, user stories, main flows, alternative flows, failure flows, and acceptance baseline. |
| 03 | [Business and domain requirements](./03-business-and-domain-requirements.md) | `DECIDED — v0 baseline` | Roles, access model, business rules, state machine, and domain data. |
| 04 | [Architecture — C4 + arc42](./04-architecture-c4-arc42.md) | `DECIDED — v0 baseline` | Canonical architecture narrative, C4 views, and architecture decisions. |
| 05 | [Database requirements](./05-database-requirements.md) | `DECIDED — v0 baseline` | Data model, ERD, constraints, indexes, and transaction guidance. |
| 06 | [UI requirements](./06-ui-requirements.md) | `DECIDED — v0 baseline` | Screens, UX flows, UI states, and acceptance criteria. |
| 07 | [Authentication and authorization](./07-authentication-and-authorization.md) | `DECIDED — minimum scope` | Account scope, role permissions, data visibility, and auth boundaries. |
| 08 | [UI design blueprint and Stitch handoff](./08-ui-design-blueprint-and-stitch-handoff.md) | `DECIDED — UI direction and handoff baseline` | Visual screen inventory, Stitch prompt workflow, viewport targets, and Antigravity handoff. |
| 09 | [UI standards and design system](./09-ui-standards-and-design-system.md) | `DECIDED — UI standards and design system baseline` | Tiêu chuẩn giao diện, bảng màu 85/15, shared layout components, và quy tắc dev UI. |

Document status describes the state of the document. Requirement labels inside the documents must still use `DECIDED`, `OPEN`, `PROPOSED`, `DRAFT`, or `ARCHIVED` correctly.

## Phase rules

- Create `docs/v1/` only when the user explicitly opens or approves phase v1.
- Each new phase gets its own directory and must not overwrite v0 history.
- Add only Product-approved decisions to active phase documentation.
- Record any new scope or policy change in [01-requirements-closure.md](./01-requirements-closure.md) and the relevant source-of-truth document before implementation.
- Create files in `plans/` only when the user asks for implementation instructions.

## Archive

`archive/` contains old drafts for historical reference only. It is not a source of truth. LLMs must not use archived files to infer new API behavior, release status, or business rules.
