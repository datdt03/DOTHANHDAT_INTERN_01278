# UI Rules — HTML, CSS, and JavaScript

## 1. Recommended MVP structure

\`\`\`text
src/ui/
├── index.html                 # app shell, shared script/style tags, and stable layout
├── app.js                     # application startup, routing, and feature wiring
├── config/                    # centralized configuration without business logic
│   ├── routes.js
│   └── ui.config.js
├── shared/                    # only code used by at least two features
│   ├── components/            # modal, badge, form field, empty state, and similar pieces
│   ├── styles/                # tokens.css, base.css, utilities.css
│   └── utils/                 # dom.js, format.js, and shared validation
├── features/                  # one directory per screen or business flow
│   ├── dashboard/
│   │   ├── dashboard.js
│   │   └── dashboard.css
│   ├── repair-order-detail/
│   │   ├── repair-order-detail.js
│   │   └── repair-order-detail.css
│   └── customer-link/
│       ├── customer-link.js
│       └── customer-link.css
├── mocks/                     # demo data and local fixtures only
└── assets/                    # UI-local assets when needed
\`\`\`

This is a default structure, not a requirement to create every file. Add files only when a real responsibility requires them.

## 2. HTML rules

- Keep \`index.html\` as a stable shell with navigation, \`<main id="app">\`, notifications, and shared assets.
- Feature HTML should contain page or fragment markup, not one file per button or tiny component.
- Do not put long JavaScript or CSS blocks directly in HTML.
- Avoid large template strings when the runtime can use an HTML fragment; do not add a framework only to solve markup loading.
- Give every screen a clear root such as \`data-page="dashboard"\` or \`data-feature="repair-order-detail"\`.
- Use semantic HTML: \`header\`, \`nav\`, \`main\`, \`section\`, \`form\`, \`button\`, and \`table\` where appropriate.
- Every form needs labels and visible error and loading states.
- Do not use a \`div\` as a button or link when it has interactive behavior.
- Do not use inline styles or inline event handlers such as \`onclick\`.
- User-facing copy must use the terminology defined in \`docs/v0/06-ui-requirements.md\`; do not expose internal status codes unnecessarily.

## 3. CSS rules

- \`shared/styles/tokens.css\`: colors, fonts, spacing, radius, shadows, and z-index.
- \`shared/styles/base.css\`: reset, typography, and element defaults.
- \`shared/styles/utilities.css\`: a small set of clearly named utilities.
- Keep feature-specific CSS next to the feature.
- Do not repeat colors, spacing, or breakpoints; use CSS custom properties in \`tokens.css\`.
- Name classes by role, not temporary position. Prefer \`.status-badge\` to \`.blue-box\`.
- Avoid selectors deeper than three levels and avoid \`!important\`.
- A network-driven feature must handle loading, empty, error, and disabled states whenever those states can occur.

## 4. JavaScript rules

- \`app.js\` starts the app, registers routes, and connects features; it must not contain the full screen logic.
- Each feature owns its local render, event handlers, and state.
- Shared API calls, date/money formatting, and DOM operations belong in \`shared/\`; do not repeat \`fetch\` calls in renderers.
- Keep the feature file sections in this order: \`state\` → \`render\` → \`events/actions\`.
- Name functions after actions, for example \`renderRepairOrder\`, \`submitDiagnosis\`, and \`handleApproval\`.
- Do not use global variables to share state between features. Use module imports/exports or a small store only when needed.
- Do not put diagnosis, price calculation, permission, or important state-transition logic only in the frontend. The UI renders server decisions and calls the API.
- Always handle loading, network errors, empty data, and invalid API responses.
- Prefer small modules and one-way dependencies: \`feature → shared\`, never \`shared → feature\`.

## 5. Large JavaScript files

- Keep a page entry file below 150 lines when possible.
- Keep ordinary modules below 250 lines.
- From 250–400 lines, review the responsibility boundary before adding more logic.
- Above 400 lines, plan a responsibility-based split before continuing feature growth.
- Above 800 lines, refactoring is required before adding more behavior.
- Above 1,000 lines, split by business responsibility, not by arbitrary line counts.

If a very large file is generated or minified, find and edit its source instead. Never edit \`src/ui/app.bundle.js\` manually; regenerate it with \`scripts/build-bundle.cjs\`.

### Structure for a large page

\`\`\`text
features/repair-order-detail/
├── repair-order-detail.js       # orchestrator
├── state.js                      # local state, no DOM access
├── selectors.js                 # derived display data
├── api.js                       # feature API calls
├── actions.js                   # user actions and updates
├── validators.js                # input validation
├── render-header.js              # header section
├── render-condition.js           # condition and evidence
├── render-quote.js               # diagnosis and quotation
├── render-repair.js              # repair work
├── render-quality-check.js       # quality check
├── render-handover.js            # handover and warranty
├── render-timeline.js            # timeline and audit
└── repair-order-detail.css
\`\`\`

Split a section only when it has its own state, rendering, or behavior. Do not create files named \`page-1.js\` or \`page-2.js\`.

### Responsibility boundaries

- \`index.js\` or the feature entry: orchestration, not long markup or business logic.
- \`state.js\`: local state and state updates, no DOM knowledge.
- \`api.js\`: API communication, no rendering or DOM reads.
- \`render-*.js\`: one section renderer, no direct \`fetch\` calls.
- \`actions.js\`: events, validation, API calls, state updates, and rerender requests.
- \`selectors.js\`: derived data only, no state mutation.
- \`validators.js\`: validation only, no toast or API calls.

## 6. Configuration rules

\`\`\`text
src/ui/config/
├── routes.js       # route names and feature mapping
└── ui.config.js    # environment-sensitive UI values
\`\`\`

- Define each configuration value in one place.
- Do not hard-code the API base URL in a feature.
- Do not put mock data, business data, or secrets in \`config/\`.
- Document the type, default, and usage whenever configuration is added.

## 7. Adding a feature

1. Create \`src/ui/features/<feature-name>/\`.
2. Create \`<feature-name>.js\`.
3. Create \`<feature-name>.css\` only when shared styles are not sufficient.
4. Register the route in \`src/ui/config/routes.js\`.
5. Connect the feature to \`app.js\` through a clear entry point.
6. Reuse a shared component only after it has more than one real consumer.
7. Update UI documentation or tests when the screen, state, or behavior changes.

## 8. UI completion criteria

- A reader can predict the file to edit from the feature name.
- Logic is not duplicated between screens.
- API URLs, tokens, and environment configuration are not scattered through features.
- Network-driven flows have loading, error, and empty states.
- UI follows the documented business states, especially quotation approval, quality control, and handover.
- Changes stay within the task scope unless the reason is recorded.
