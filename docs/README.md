# RepairFlow Documentation Guide

## Purpose

This file is the required entry point before an LLM reads, creates, or updates documentation in the repository. It defines the product sources of truth, the phase boundaries, the difference between product discussion and implementation tasks, and the decisions an LLM must not make independently.

## Documentation areas

| Area | Role | Usage rule |
| --- | --- | --- |
| \`docs/README.md\` | Documentation rules and phase map | Does not contain detailed phase requirements. |
| \`docs/v0/\` | Product discussion, analysis, scope, and decisions for phase v0 | This is the current phase. Read \`docs/v0/README.md\` first. |
| \`docs/v1/\`, \`docs/v2/\`, ... | Documentation for future phases | Create only when Product explicitly opens the relevant phase. |
| \`docs/*/archive/\` | Historical drafts | Not a source of truth; do not infer business behavior from it. |
| \`plans/\` | LLM implementation instructions | Create or update only when the user requests a plan. Do not store discussion logs here. |
| \`README.md\` | Product dashboard and local quickstart | Does not replace detailed phase documentation. |

Active phase documentation must live inside its phase directory. Do not create duplicate active documents directly under \`docs/\`.

## Required reading order

1. Read the root \`AGENTS.md\` and the nearest \`AGENTS.md\` for the relevant code area.
2. Read this file to understand documentation boundaries.
3. Read \`docs/v0/README.md\` to identify the current phase and active documents.
4. Read only the documents directly relevant to the task:
   - \`01-requirements-closure.md\` for open questions and the decision backlog.
   - \`02-use-cases.md\` for actors, user stories, main flows, alternative flows, and failure flows.
   - \`03-business-and-domain-requirements.md\` for roles, states, security, audit, and business rules.
   - \`04-architecture-c4-arc42.md\` for the canonical C4 views and arc42 architecture narrative.
   - \`05-database-requirements.md\` for entities, schema, constraints, indexes, and transactions.
   - \`06-ui-requirements.md\` for screens, UX, states, and acceptance criteria.
   - \`07-authentication-and-authorization.md\` for account scope, role-based access, and minimum data visibility.
5. Find similar content before creating a new file or section.
6. If documentation, code, and a new request conflict, stop and identify the conflict before deciding product behavior.

## Decision labels

Every phase document must distinguish:

- \`DECIDED\`: Product has approved it and implementation may use it as a requirement.
- \`OPEN\`: The question or policy is not settled; implementation must not treat it as mandatory.
- \`PROPOSED\`: An option is suggested for Product review; it is not a decision.
- \`DRAFT\`: Work in progress that is not yet the source of truth.
- \`ARCHIVED\`: Historical content that must be ignored for implementation.

Do not promote a default, mock UI behavior, endpoint name, or code inference to \`DECIDED\` without Product confirmation.

## Documentation rules

- Confirm the phase first; the current phase is \`v0\`.
- Update the appropriate active file under \`docs/v0/\`; do not create a duplicate at \`docs/\` root.
- Keep one source of truth for each topic and link to it instead of copying content.
- Keep \`04-architecture-c4-arc42.md\` as the architecture view/index and keep detailed business rules in \`03-business-and-domain-requirements.md\`.
- Use scope, actors, preconditions, expected results, alternative flows, failure flows, related data, and acceptance criteria when documenting a business flow.
- Put unresolved questions in the decision backlog with an \`OPEN\` or \`PROPOSED\` label.
- Add decisions to active requirements only after Product confirms them.
- Update indexes and links when a file is renamed or moved.
- Never add secrets, real tokens, real customer data, or production environment details to documentation.

## Content that must not be invented

While v0 is open, an LLM must not create or treat the following as official without an explicit request and the corresponding Product decision:

- API contracts or API handoffs.
- Release notes, production status, or staging/production runbooks.
- New access, state machine, quotation, payment, warranty, retention, privacy, or concurrency decisions.
- A new \`docs/v1/\` directory.
- A new file in \`plans/\` when the user has not asked for an implementation plan.

If a gap needs Product discussion, add it to \`docs/v0/01-requirements-closure.md\` as \`OPEN\` or \`PROPOSED\`; do not pretend that a contract or business rule is frozen.

## Plan rules

Write a plan only when the user explicitly asks for one. A plan must be an implementation instruction, not a discussion document, and must include goal, scope, out of scope, input files, output files, allowed files, small tasks, testing, and acceptance criteria.

For full-stack work, pair server and UI tasks by cluster. Do not complete the entire server before starting the UI. Plans must link to active \`docs/v0\` sources and must not use archive files as requirements.

## Documentation completion checklist

- [ ] Correct phase and directory.
- [ ] No duplicated source of truth.
- [ ] \`DECIDED\`, \`OPEN\`, \`PROPOSED\`, \`DRAFT\`, and \`ARCHIVED\` are used correctly.
- [ ] No business rule inferred from mocks, code, or defaults.
- [ ] Main and alternative/failure flows are present where needed.
- [ ] Relative links to related documents are valid.
- [ ] No secrets, real data, API handoff, or unrequested release status.
- [ ] Product approval is recorded for any changed decision.

## Current phase

Read [docs/v0/README.md](./v0/README.md) next. It is the index and operating guide for all active v0 documentation.
