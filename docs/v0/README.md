# RepairFlow — v0 Documentation

## Role

\`docs/v0/\` contains the product discussion, business analysis, scope, and decisions for RepairFlow phase v0.

It is the reference used to create implementation plans when the user requests them. These documents are not LLM task instructions, API contracts, or release handoffs.

Always read [docs/README.md](../README.md) first to understand phase boundaries and the documentation workflow.

## v0 status

- **Phase status:** \`OPEN — Gate D0 is not achieved\`.
- Product is still in requirements analysis and closure; business clusters C1–C10 are not open.
- FastAPI, PostgreSQL, and SQL migrations are currently local technical foundations.
- C0 has a health endpoint, PostgreSQL 18-alpine, six SQL migrations, and a four-test baseline.
- C0 still needs a shared fixture convention, UI adapter boundary, and mock/runtime boundary.
- C1–C10 business flows are not implemented; the UI remains a prototype/mock baseline.
- The decision backlog has 73 items: 44 P0 and 29 P1 items without formal closure.
- The high-level access direction is confirmed: only Owner/Manager can log in; Customer, Receptionist, and Technician do not have separate accounts. Detailed policies remain in the decision backlog.
- Do not create an API contract, API handoff, or release documentation without a specific request and the corresponding decision.

## Active documents

| File | Contents |
| --- | --- |
| [requirements-closure.md](./requirements-closure.md) | Open issues, decision backlog, and Gate D0. |
| [usecase.md](./usecase.md) | User stories, personas, main flows, alternative flows, and acceptance baseline. |
| [architecture-c4-arc42.md](./architecture-c4-arc42.md) | Canonical architecture narrative using arc42 sections and PlantUML C4 views. |
| [architecture-and-requirements.md](./architecture-and-requirements.md) | Roles, access model, business rules, state machine, and target architecture. |
| [database-requirements.md](./database-requirements.md) | Data model, ERD, constraints, indexes, and transaction guidance. |
| [ui-requirements.md](./ui-requirements.md) | Screens, UX flows, UI states, and acceptance baseline. |

## Phase transitions

- Create \`docs/v1/\` only when the user explicitly opens or approves phase v1.
- Each new phase gets its own directory and must not overwrite v0 history.
- Add only Product-approved decisions to active phase documentation.
- Keep unresolved content in the decision backlog; do not convert it into a mandatory contract or API requirement.
- Create files in \`plans/\` only when the user asks for implementation instructions.

## Archive

\`archive/\` contains old drafts for historical reference only. It is not a source of truth. LLMs must not use archived files to infer new API behavior, release status, or business rules.
