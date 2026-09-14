# RepairFlow — v0 Documentation

## Role

`docs/v0/` contains the product discussion, business analysis, scope, and decisions for RepairFlow phase v0.

These documents are the product source of truth used to prepare implementation plans when the user requests them. They are not LLM task instructions, API contracts, or release handoffs.

Read [the documentation guide](../README.md) first. It defines the documentation boundaries, decision labels, and phase rules.

## Phase status

- **Phase status:** `OPEN — Gate D0 is not achieved`.
- Product is still in requirements analysis and closure; business clusters C1–C10 are not open.
- FastAPI, PostgreSQL, and SQL migrations are local technical foundations.
- C0 has a health endpoint, PostgreSQL 18-alpine, six SQL migrations, and a four-test baseline.
- C0 still needs a shared fixture convention, UI adapter boundary, and mock/runtime boundary.
- C1–C10 business flows are not implemented; the UI remains a prototype backed by mock data.
- The decision backlog has 73 items: 44 P0 and 29 P1 items without formal closure.
- Owner, Manager, Receptionist and Technician may receive accounts with fixed role and assignment access. Staff profiles without accounts have no session; Customer has no long-lived account and uses a public link. Detailed scope is in [07-authentication-and-authorization.md](./07-authentication-and-authorization.md).
- Warranty is explicitly deferred from the v0 workflow, schema, UI and permission model; it will be designed as a separate module later.
- UI direction, role-aware navigation, Receptionist operational lookup, viewport
  targets, and the Stitch/Antigravity handoff process are recorded in
  [08-ui-design-blueprint-and-stitch-handoff.md](./08-ui-design-blueprint-and-stitch-handoff.md).

Do not create an API contract, API handoff, or release documentation without a specific request and the corresponding Product decision.

## Reading order and document status

Read the active documents in this order:

| Order | Document | Status | Source of truth for |
| --- | --- | --- | --- |
| 01 | [Requirements closure](./01-requirements-closure.md) | `ACTIVE — Gate D0 open` | Open questions, decision backlog, and the build gate. |
| 02 | [Use cases](./02-use-cases.md) | `ACTIVE — open policies remain` | Actors, user stories, main flows, alternative flows, failure flows, and acceptance baseline. |
| 03 | [Business and domain requirements](./03-business-and-domain-requirements.md) | `ACTIVE — open decisions remain` | Roles, access model, business rules, state machine, and domain data. |
| 04 | [Architecture — C4 + arc42](./04-architecture-c4-arc42.md) | `ACTIVE — open decisions remain` | Canonical architecture narrative, C4 views, and architecture decisions. |
| 05 | [Database requirements](./05-database-requirements.md) | `ACTIVE — open decisions remain` | Data model, ERD, constraints, indexes, and transaction guidance. |
| 06 | [UI requirements](./06-ui-requirements.md) | `ACTIVE — prototype baseline` | Screens, UX flows, UI states, and acceptance criteria. |
| 07 | [Authentication and authorization](./07-authentication-and-authorization.md) | `DECIDED — minimum scope` | Account scope, role permissions, data visibility, and auth boundaries. |
| 08 | [UI design blueprint and Stitch handoff](./08-ui-design-blueprint-and-stitch-handoff.md) | `DECIDED — UI direction and handoff baseline` | Visual screen inventory, Stitch prompt workflow, viewport targets, and Antigravity handoff. |

Document status describes the state of the document. Requirement labels inside the documents must still use `DECIDED`, `OPEN`, `PROPOSED`, `DRAFT`, or `ARCHIVED` correctly.

## Phase rules

- Create `docs/v1/` only when the user explicitly opens or approves phase v1.
- Each new phase gets its own directory and must not overwrite v0 history.
- Add only Product-approved decisions to active phase documentation.
- Keep unresolved content in [01-requirements-closure.md](./01-requirements-closure.md); do not convert it into a mandatory contract or API requirement.
- Create files in `plans/` only when the user asks for implementation instructions.

## Archive

`archive/` contains old drafts for historical reference only. It is not a source of truth. LLMs must not use archived files to infer new API behavior, release status, or business rules.
