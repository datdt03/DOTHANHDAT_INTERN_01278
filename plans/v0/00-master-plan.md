# RepairFlow v0 — master implementation plan

> Plan ID: v0-master
>
> Status: ACTIVE
>
> Revision: 6
>
> Baseline: Gate D0 closed on 2026-09-16; C0 target-stack migration accepted on 2026-09-17. C1 is complete; c1-001 through c1-007 are complete; C2 is in progress with c2-000 complete and c2-001 next under `plans/v0/c2/`.

## Goal

Triển khai RepairFlow theo từng capability có thể kiểm thử, giữ một luồng thống
nhất từ requirements → ASP.NET Core API → React UI → integration. Mọi business
rule, permission, state transition, transaction và evidence trail phải bám đúng
docs/v0.

## Scope

- Migrate runtime compatibility prototype sang ASP.NET Core Web API trên .NET.
- Migrate UI prototype sang React + Vite + TypeScript.
- Giữ PostgreSQL là source of truth; dùng EF Core + Npgsql cho data access và
  versioned SQL migrations chạy bởi backend .NET.
- Triển khai C0–C10 theo dependency của product workflow.
- Mỗi cluster tách thành task có sequence và owner rõ ràng.
- Codex phụ trách server/API, database access, backend behavior và tests.
- Antigravity phụ trách React UI, component, state, adapter và visual QA.
- Mỗi lát đi theo vòng API/server → UI → API adjustment nếu cần → UI refinement
  → shared integration acceptance.

## Out of scope

- Không tự thêm business rule, role, permission hoặc state ngoài docs/v0.
- Không đổi product scope hoặc API contract chỉ để làm implementation thuận tiện.
- Không chuyển sang microservices, queue, Redis hoặc data warehouse.
- Không để React chứa business rule, gọi database hoặc làm security boundary.
- Không dùng `src/app/` FastAPI hay UI vanilla hiện tại làm nền tảng target cho
  C1 trở đi; chúng chỉ là compatibility/functional reference trong lúc migrate.
- Không khôi phục các file database/migration prototype cũ chỉ để tiếp tục plan.
  Khi implementation cần schema artifact target, task C0/C1 phải ghi rõ file
  mới và đối chiếu docs/v0/05 trước khi tạo.
- Không dùng `docs/v0/archive/` làm requirements.

## Source of truth

- `AGENTS.md`
- `docs/README.md`
- `docs/v0/README.md`
- `docs/v0/01-requirements-closure.md`
- `docs/v0/02-use-cases.md`
- `docs/v0/03-business-and-domain-requirements.md`
- `docs/v0/04-architecture-c4-arc42.md`
- `docs/v0/05-database-requirements.md`
- `docs/v0/06-ui-requirements.md`
- `docs/v0/07-authentication-and-authorization.md`
- `docs/v0/08-ui-design-blueprint-and-stitch-handoff.md`

Nếu plan phát hiện xung đột với các nguồn trên, dừng phần bị ảnh hưởng, cập
nhật source of truth trước rồi mới tăng revision hoặc mở task mới.

## Target architecture và folder direction

### Backend — modular monolith, 3 logical tiers

Backend target sẽ được tạo trong `src/server/` theo ba tầng logic trong một
solution/project boundary:

```text
src/server/
├── RepairFlow.sln
└── RepairFlow.Api/
    ├── Api/                 # presentation, contracts, middleware, OpenAPI
    ├── Features/<feature>/  # endpoint + application + domain theo feature
    ├── Application/         # use case, policy, port và transaction boundary
    ├── Domain/              # entity, value object, state rule
    └── Infrastructure/      # EF Core, Npgsql, repository, SQL migration runner
```

Ba tầng cần giữ rõ là `Api/`, `Application/Domain/` và `Infrastructure/`.
Không tách microservice chỉ vì tách folder. Tên project/file cụ thể được C0
freeze khi scaffold và phải được các plan C1–C10 dùng nhất quán.

### Web — React static frontend

`src/ui/` được chuyển thành Vite app nhưng giữ làm target web root để tránh tạo
thêm một frontend song song:

```text
src/ui/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── app/                     # bootstrap, router, shell và app state
├── config/                  # API URL, routes, presentation config
├── features/<feature>/      # page, component, state theo feature
└── shared/                  # api adapter, UI primitives, styles, utils
```

Các file vanilla/bundle cũ chỉ được giữ làm reference cho tới khi React shell
và C0 acceptance pass; không sửa generated bundle thủ công.

## Cluster sequence

| Cluster | Capability | Depends on | Main output |
| --- | --- | --- | --- |
| C0 | Target runtime foundation và stack migration | — | ASP.NET Core health/API foundation, .NET migration boundary, React/Vite foundation, adapter và test/build baseline |
| C1 | Access và application shell | C0 | Login/session boundary, authorization, role-aware React shell và access tests |
| C2 | Customer, device, repair order | C1 | Tạo/tra cứu customer, device và order |
| C3 | Intake và evidence | C2 | Checklist, phụ kiện, ảnh hiện trạng và intake lock |
| C4 | Diagnosis và quote draft | C3 | Diagnosis, assignment và quote draft có backend calculation |
| C5 | Quote publishing và customer decision | C4 | Link, OTP, quote version, approve/reject và audit |
| C6 | Repair execution | C5 | Work log, repair checklist, actual work và after evidence |
| C7 | Quality check và rework | C6 | QC pass/fail, reason và rework loop |
| C8 | Handover và history | C7 | Handover/return, customer confirmation, timeline và history |
| C9 | Dashboard và operational views | C1–C8 | KPI, filters, role-specific views và receptionist lookup |
| C10 | Hardening và final verification | C1–C9 | End-to-end, security, migration, error và local verification |

“Open for implementation” chỉ có nghĩa requirements đã cho phép bắt đầu; không
có nghĩa capability đã code xong.

## Implementation direction

### Server/API — Codex

1. Đọc use case, business rule, auth matrix, database rule và C4 component của
   cluster.
2. Xác định input/output/error behavior cho một lát nhỏ; contract phải xuất hiện
   trong OpenAPI 3.0 của ASP.NET Core.
3. Implement endpoint ở `Api`, use case/policy ở `Application`/`Domain`, và
   persistence ở `Infrastructure` theo feature.
4. Dùng EF Core + Npgsql; mọi transaction, state transition và permission phải
   được enforce ở backend.
5. Dùng versioned SQL migration runner target .NET, giữ schema contract và
   thứ tự đã chốt; không tự ý sửa migration lịch sử.
6. Viết unit/API/integration/migration tests cùng task; không để UI đoán behavior.

### UI — Antigravity

1. Đọc UI requirements, screen blueprint và acceptance scenario của cluster.
2. Dựng React component/screen/state trong `src/ui` theo feature-first.
3. Gọi API qua adapter typed; không gọi database, không nhúng business rule và
   không coi menu ẩn là authorization.
4. Có loading, empty, error, forbidden, expired, success và conflict state khi
   flow yêu cầu.
5. Dùng Vite cho dev/build, kiểm tra type và visual/responsive behavior.
6. Ghi nhận server gap thành task Codex kế tiếp, không tự đổi contract trong UI.

### Shared integration

Hai bên chỉ đánh dấu lát hoàn thành khi UI gọi được behavior server thật (hoặc
adapter mock có cùng shape khi server chưa chạy), backend test và UI check cùng
pass acceptance scenario, và không có business rule chỉ tồn tại ở client.

## C0 migration gate — accepted 2026-09-17

```text
c0-001 Codex: ASP.NET Core/.NET API foundation
    ↓
c0-002 Antigravity: React + Vite + TypeScript foundation
    ↓
c0-003 Shared: stack migration acceptance — DONE
    ↓
c1-001 Codex: access API foundation — DONE
```

C0 đã xác nhận health contract `/health`, request ID, error/response envelope,
OpenAPI 3.0, PostgreSQL provider boundary, migration convention/runner và UI
adapter trên database sạch. C1 đã hoàn tất: c1-001 access API foundation,
React shell, authentication/session, auth UI, permission/workspace enforcement,
role-aware navigation và shared integration acceptance đều đã pass; C2 là
capability tiếp theo.

## C1 execution map

```text
c0-003 Shared: stack migration acceptance
  ↓
c1-001 Codex: access API foundation
  ↓
c1-002 Antigravity: React application shell
  ↓
c1-003 Codex: authentication/session
  ↓
c1-004 Antigravity: login/session UI
  ↓
c1-005 Codex: permission/workspace enforcement
  ↓
c1-006 Antigravity: role-aware navigation
  ↓
c1-007 Shared: real integration and acceptance
```

C1 không làm dashboard data, customer/order workflow hoặc repair workflow; các
capability đó thuộc C2–C9.

## Shared Definition of Done

- [ ] Task có status, owner, dependency, input/output và acceptance rõ ràng.
- [ ] Backend target .NET có test pass cho behavior đã triển khai.
- [ ] UI React có đủ state và build/type-check pass.
- [ ] OpenAPI, database, UI và tests dùng cùng business vocabulary.
- [ ] Không có thay đổi ngoài scope hoặc business rule chưa được ghi nhận.
- [ ] Integration scenario của cluster pass.
- [ ] `plans/v0/README.md` và master plan phản ánh status mới.

## Change management

- Thay đổi business rule, permission, state, data model hoặc API contract: cập
  nhật docs/v0 trước, sau đó cập nhật plan bị ảnh hưởng.
- Thay đổi nhỏ trong cùng scope: tăng Revision của plan hiện tại.
- Phát sinh task mới: dùng sequence tiếp theo, không renumber task đã bắt đầu.
- Thay đổi ảnh hưởng nhiều cluster: cập nhật master plan và thêm amendment plan.
- Task `DONE` không viết lại để che lịch sử; behavior mới dùng task mới và link
  task cũ.

## Risk boundary

Business endpoint chưa có, UI còn mock hoặc test chưa đủ là trạng thái triển khai,
không mở lại Gate D0. Nếu phát hiện mâu thuẫn với requirements đã chốt, dừng
task hiện tại và ghi nhận change impact trước khi sửa implementation.
