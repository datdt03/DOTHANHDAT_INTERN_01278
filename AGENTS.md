# RepairFlow — Development Rules for AI Agents

## 1. Purpose

Keep the codebase small, discoverable, easy to change, and easy to provide to an LLM for a focused task. Every change must have a clear scope. Read and reuse the existing structure before introducing a new file or abstraction.

## 2. Product sources of truth

- \`README.md\`: product goal, MVP scope, project dashboard, and local quickstart.
- \`docs/README.md\`: documentation boundaries and the LLM documentation workflow.
- \`docs/v0/README.md\`: the current phase index and phase rules.
- \`docs/v0/01-requirements-closure.md\`: decision backlog, open questions, and the build gate.
- \`docs/v0/02-use-cases.md\`: user stories, main flows, alternative flows, failure flows, and acceptance baseline.
- \`docs/v0/03-business-and-domain-requirements.md\`: roles, data, and business rules discussed or decided in v0.
- \`docs/v0/04-architecture-c4-arc42.md\`: canonical architecture narrative and C4/arc42 views.
- \`docs/v0/05-database-requirements.md\`: schema, constraints, indexes, and transaction rules discussed or decided in v0.
- \`docs/v0/06-ui-requirements.md\`: UX flows, screens, states, and acceptance criteria for v0.
- \`src/ui/AGENTS.md\`: HTML, CSS, and JavaScript rules for the UI.

When documentation and source code conflict, do not guess. Identify the conflict, name the files involved, and ask before changing product behavior.

## 3. File organization

- Organize by feature first and file type second. Related feature files belong together.
- Give each file one primary responsibility.
- Do not create more than three levels below \`src/ui\` without a specific reason.
- Do not create a file for one constant or tiny helper unless it has a clear reuse case.
- Do not use vague directories or filenames such as \`helpers\`, \`misc\`, \`common2\`, \`new\`, or \`final\`.
- Do not duplicate logic across screens. Move shared logic to \`shared\` after at least two real consumers exist.
- Use \`kebab-case\` for filenames, \`camelCase\` for variables and functions, and \`kebab-case\` for CSS classes.
- Each feature must have a primary file named after its directory, for example \`dashboard/dashboard.js\`.
- Prefer short, readable files. When a file grows beyond roughly 250 lines, consider splitting by responsibility instead of splitting mechanically.

## 4. Configuration and data

- Keep UI configuration in \`src/ui/config/\`.
- Do not scatter API URLs, route names, feature flags, environment values, or application state across UI features.
- Never commit secrets, real tokens, or real customer data.
- Use environment variables or sample files for environment-specific configuration; do not edit feature code for an environment change.
- Keep demo and mock data in \`src/ui/mocks/\`, separate from \`src/ui/features/\`.
- Do not put business rules in configuration. Business rules belong in the backend or the relevant business module.

## 5. Change workflow

1. Read the nearest \`AGENTS.md\` and the relevant product documentation.
2. Find a similar existing example before creating a new pattern.
3. Identify the feature, input files, output files, and behavior being changed.
4. Change the smallest possible set of files; do not refactor unrelated areas.
5. Update documentation or tests when a contract, state, or business flow changes.
6. Run the existing checks in \`package.json\` when such scripts exist. If no script exists, do not invent one as a repository requirement.
7. Report changed files, checks run, and anything that remains unverified.

## 6. Boundaries

- Do not add a framework, library, or bundler only to solve file organization.
- Do not rename many files or move a used directory without checking every import and link.
- Do not change the database, API contract, access model, or business rules when the request is UI-only.
- Do not delete old code until its usage is known and an equivalent replacement exists.
- Do not create a god file containing all markup, styles, API calls, and application state.

## 7. LLM task context

Every task should begin with a small context block:

\`\`\`text
Goal: [one sentence]
Feature: [directory name]
Read first: [up to five relevant files]
Allowed to change: [files or directories]
Do not change: [API, business rules, or out-of-scope areas]
Completion criteria: [verifiable conditions]
\`\`\`

Do not load the entire repository into one task. Read the root rules, the local rules, and the directly relevant files only.
