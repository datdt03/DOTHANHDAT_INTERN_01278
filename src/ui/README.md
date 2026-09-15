# RepairFlow UI foundation handoff

## Context

```text
Goal: Bàn giao một UI foundation React/Vite/TypeScript ổn định cho Antigravity tiếp tục phát triển.
Feature: app shell và frontend foundation
Read first: AGENTS.md, docs/v0/06-ui-requirements.md, docs/v0/08-ui-design-blueprint-and-stitch-handoff.md, config/runtime-config.ts, shared/api/api-client.ts
Allowed to change: app/, config/, features/, shared/, mocks/, index.html, package.json, vite.config.ts, tsconfig.json
Do not change: ASP.NET Core API contract, database, permission enforcement, business state transitions hoặc legacy prototype reference khi chưa có migration acceptance
Completion criteria: type-check/build pass, API access chỉ qua adapter, shell internal/customer tách boundary, preview chạy được khi backend chưa active
```

## What is ready

- React + Vite + TypeScript target lives in `src/ui`.
- `app/main.tsx` owns bootstrap states: booting, API unavailable, and ready.
- `shared/api/api-client.ts` is the only network boundary in the foundation. It
  currently checks `/health` and can be extended with typed endpoints later.
- `config/runtime-config.ts` centralizes API URL, timeout, and preview mode.
- `app-shell.tsx` is a stable facade. The concrete implementations are split
  into `internal-shell.tsx`, `customer-link-shell.tsx`, and `status-screens.tsx`.
- `shared/components/` contains the unified shared layout components (`AppHeader`, `AppSidebar`, `AppFooter`, `CustomerHeader`, `CustomerFooter`), monochrome SVG icon suite (`icons.tsx`), and primitives (`ui-primitives.tsx`: `BrandMark`, `PrimaryButton`, `SecondaryButton`, `IconButton`, `TextButton`, `StatusBadge`, `OrderCode`, `Card`, `SkeletonLoader`).
- `shared/styles/tokens.css` defines the unified Design Tokens following the 85% Slate / 15% Sky `#0284c7` rule with 10 repair status semantic colors.
- `mocks/demo-shell.ts` contains preview-only data. It is not an API contract.
- `?preview=1` opens the internal shell without requiring the backend. Preview is
  read-only and must not be used to infer permissions or business rules.
- The old vanilla prototype and `app.bundle.js` are intentionally retained as
  reference artifacts.

## Reuse rules for Antigravity

1. Keep `app-shell.tsx` as the import facade so future callers do not depend on
   concrete shell filenames.
2. Put reusable visual behavior in `shared/components/` only after at least two
   consumers exist. Keep components presentational and prop-driven.
3. Put API calls in `shared/api/` or a feature API module that delegates to the
   adapter. Never call `fetch` from JSX or render functions.
4. Keep server decisions in the API. The browser may display loading, empty,
   error, forbidden, and disabled states but must not enforce permission or
   workflow transitions.
5. Put business-screen state and rendering under `features/<feature-name>/`.
   Keep `app/` focused on startup, shell composition, and route boundaries.
6. Keep preview fixtures in `mocks/` and replace them through an adapter rather
   than changing components to understand two data shapes.
7. Prefer one responsibility per module. Split a module when it owns more than
   one independently changing concern; do not create abstractions only for line
   count.
8. **Strict Icon Standard (No Emojis / No Multi-Color Icons / No Icon Spamming)**:
   - Absolutely NO system emojis (📊, 📋, ⏳, 👥, 📱, ⚙, 🏢, etc.) or multi-colored icons anywhere.
   - Use 100% Monochrome Line SVG icons from `shared/components/icons.tsx` (`stroke="currentColor"`, stroke 1.75px).
   - Do NOT spam icons: use them strictly where needed for functional navigation and controls; keep page titles, forms, badges, and general buttons typography-first.

## Extension points

| Need | Add/change | Boundary to preserve |
| --- | --- | --- |
| Login/session context | `features/auth/` + app context | API owns session and permission decisions |
| Role-aware navigation | `features/navigation/` or shell config | UI consumes server-provided capabilities |
| Dashboard data | `features/dashboard/` + typed API adapter method | Demo fixtures stay in `mocks/` |
| Customer OTP | `features/customer-link/` | Do not render public DTO before OTP context |
| Shared feedback UI | `shared/components/` | Keep toast/modal state outside API client |

## Commands

Run from this directory:

```powershell
npm install
npm run type-check
npm run build
npm run dev
```

The default dev URL is `http://localhost:5173`. Use
`http://localhost:5173/?preview=1` while the backend health endpoint is not
available. The normal mode checks `VITE_API_BASE_URL` (default:
`http://localhost:5000`) before rendering the internal shell.

## Verification completed for this handoff

- `npm install` — passed; 70 packages audited, no vulnerabilities reported.
- `npm run type-check` — passed.
- `npm run build` — passed; Vite generated `dist/` successfully.

Visual behavior, real API integration, authentication, role-aware access, and
business screens remain Antigravity work. Codex should not add feature UI unless
the ownership boundary is explicitly changed.
