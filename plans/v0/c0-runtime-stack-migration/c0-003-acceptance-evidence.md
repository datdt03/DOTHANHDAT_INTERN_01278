# C0 migration acceptance evidence

Date: 2026-09-17

Decision: `PASS — C0 complete; C1 remains approval-gated`

## Scope verified

- ASP.NET Core/.NET target runtime is under `src/server/`.
- React/Vite/TypeScript target remains under `src/ui/`.
- No login, session, permission or business workflow was added.
- No prototype database migration or `src/db` file was restored.
- The old local PostgreSQL volume was removed and replaced with a clean volume
  after explicit user instruction.

## Automated checks

| Check | Result | Evidence |
| --- | --- | --- |
| `dotnet restore src/server/RepairFlow.sln` | PASS | API and test dependencies restored. |
| `dotnet build src/server/RepairFlow.sln --no-restore` | PASS | 0 warnings, 0 errors. |
| `dotnet test src/server/RepairFlow.sln --no-restore --verbosity minimal` | PASS | 12 passed, 0 failed, 0 skipped. |
| `npm --prefix src/ui run type-check` | PASS | TypeScript check completed. |
| `npm --prefix src/ui run build` | PASS | Vite production build completed. |

## HTTP and UI smoke checks

- `GET /health` returned `200` with `data.status=ok`,
  `data.service=repairflow-api`, `data.apiVersion=v1`, matching
  `meta.requestId` and `X-Request-ID`.
- An unknown route returned JSON `404` with `error.code=not_found` and the same
  request ID in the body and response header.
- `/swagger/v1/swagger.json` returned OpenAPI `3.0.1` and did not expose the
  configured connection string.
- The React live mode loaded against the real API at `http://127.0.0.1:5191`;
  the internal login shell rendered and the browser reported no console errors.
- The UI adapter is the only network boundary for the health check. Preview is
  explicit via `?preview=1` or `VITE_UI_PREVIEW=true`.

## Database smoke status

- `docker compose ps`: PASS — `postgres:18-alpine` is `healthy` and exposes
  `127.0.0.1:5432`.
- Before the first migrator run, the fresh database had zero public tables.
- `dotnet run --project src/server/RepairFlow.Api/RepairFlow.Api.csproj
  --no-build -- --migrate`: PASS — connected to PostgreSQL and created only the
  target `schema_migrations` ledger; no business migration files were pending.
- The ledger has the target columns `migration_id`, `filename`, `spec_version`,
  `checksum` and `applied_at`, with 0 rows.
- Running the same migrator command a second time returned success and kept the
  ledger at 0 rows, proving the empty migration set is idempotent.
- After reset, the only public table is `schema_migrations`; no legacy tables
  such as `warranties`, `workspaces` or `repair_orders` remain.

## C1 handoff

C1 has no implementation changes in this acceptance. `c1-001` is READY but
implementation still requires explicit Product/Engineering approval.
