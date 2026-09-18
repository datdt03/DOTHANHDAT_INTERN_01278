# RepairFlow backend architecture rules

## Feature-first organization

Backend code is organized by business feature, not by roadmap cluster.

Valid feature roots:

- `Features/Access/`
- `Features/Customer/`
- `Features/Device/`
- `Features/RepairOrder/`

`C2`, `C3` and similar labels are plan/roadmap clusters. Never create:

- `Features/C2/`
- `Features/C3/`
- `C2Models.cs`
- `C2Contracts.cs`
- `IC2Repository.cs`

## Feature responsibilities

Each feature may use these subdirectories:

- `Api/`: HTTP endpoints, request/response DTOs, HTTP status mapping and OpenAPI metadata.
- `Application/`: use cases, orchestration, transaction boundaries, authorization orchestration and repository ports/interfaces.
- `Domain/`: entities, value objects and business invariants.
- `Infrastructure/`: repository implementations, SQL/Npgsql/EF Core mapping and external I/O.

## Dependency direction

```text
Api -> Application -> Domain
Infrastructure -> Application ports
Infrastructure -> Domain
```

Rules:

- `Api/` must not access `DbContext`, execute SQL or contain business rules.
- `Application/` must not embed a concrete database implementation.
- `Domain/` must not reference ASP.NET Core, EF Core, Npgsql or HTTP.
- `Infrastructure/` implements persistence and external I/O; it does not define product permission or workflow decisions.
- Customer, Device and RepairOrder keep separate models, contracts and repository boundaries.
- Shared migrations remain under `Infrastructure/Database/Migrations/`, not under a cluster folder.

## Before implementation

Every backend task must provide a small context block with:

- feature boundary;
- files to create/change;
- dependency direction;
- files or namespaces that are forbidden;
- verifiable completion criteria.

## Completion checks

- No namespace contains `Features.C2` or another cluster-based feature namespace.
- No business code is placed under `Features/C2`.
- No cluster-wide model, contract or repository replaces feature-specific boundaries.
- `dotnet build` and the relevant `dotnet test` commands pass.
