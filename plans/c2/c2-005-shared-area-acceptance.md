# C2-005 — Acceptance độc lập từng business area

Plan ID: c2-005

Title: Nghiệm thu C2 theo từng UI area, không tích hợp UI chung

Owner: Codex and Antigravity

Status: READY

Revision: 1

Depends on: c2-001-codex-customer-device-order-api.md, c2-002-antigravity-customer-area.md, c2-003-antigravity-device-area.md, c2-004-antigravity-repair-order-area.md

Produces: API evidence và ba UI-area acceptance records độc lập

Consumed by: C3 intake/evidence và C2 completion record

## Task context

```text
Goal: Chứng minh từng C2 business area có thể build/test/verify độc lập.
Feature: c2-area-acceptance
Read first: plans/c2/README.md, c2-001, c2-002, c2-003, c2-004,
            plans/v0/c1-access-and-application-shell/c1-007-shared-integration-acceptance.md
Allowed to change: tests/ui/c2, tests/server C2 acceptance và evidence/docs pointer.
Do not change: tạo shared UI integration flow hoặc gộp role thành nhiều HTML.
Completion criteria: API pass; Customer/Device/Repair Order evidence pass riêng;
                     C2 không phụ thuộc một role-specific shell.
```

## Goal

Thay thế mô hình nghiệm thu UI tích hợp chung của C1 bằng mô hình test độc lập
theo business area. C2 chỉ dùng shared step để tổng hợp kết quả, không để chạy
một UI flow xuyên qua nhiều area.

## Main business requirements

- Backend là source of truth và được test riêng bằng .NET.
- Customer, Device và Repair Order có test/evidence riêng.
- Role context switch được kiểm tra trong area nơi nó xuất hiện, không dùng role
  switch để thay thế area isolation.
- Một account nhiều role vẫn là một identity/session.
- Không test Customer → Device → Order như một scenario bắt buộc.

## Scope

### API acceptance riêng

- Migration clean run và idempotent rerun.
- Customer/device/order validation, transaction, workspace isolation.
- Order code uniqueness, `received` initial state, status history/audit.
- Manager/Owner, Receptionist, Technician capability/assignment matrix.
- Multi-role context, active-role validation và session lifecycle.
- OpenAPI/envelope/request ID/safe DTO.

### Customer area acceptance

- Direct mount customer area.
- Search, duplicate suggestion, create validation, detail.
- Empty/error/unavailable/expired/forbidden states.
- Workspace boundary và capability-driven action.

### Device area acceptance

- Direct mount device area.
- Search/create/detail/history.
- Ownership, serial duplicate và open-order warning.
- Empty/error/unavailable/expired/forbidden states.

### Repair-order area acceptance

- Direct mount order area.
- Create core order `received`.
- List/detail/search và safe references.
- Manager + Technician same-account context switch.
- Không có intake/evidence/diagnosis/quote behavior.

## Out of scope

- E2E UI flow xuyên cả ba area.
- Test đăng nhập nhiều account để mô phỏng nhiều role.
- Role-specific HTML hoặc nhiều repository.
- Customer public link.
- C3/C4/C5 behavior.

## Dependencies

- Tất cả C2 implementation plans pass local checks.
- UI test runner được freeze trước khi viết test. Repo hiện chưa có frontend
  test script; phương án đề xuất là Vitest với test project/config độc lập theo
  area, không phải một suite UI chung.

## Input files

- `src/ui/package.json`.
- `src/ui/app/` và C2 feature areas.
- `src/ui/shared/api/`.
- `tests/server/RepairFlow.Api.Tests/`.
- `docs/v0/02-use-cases.md` mục AT-01/AT-02/AT-17/AT-19.
- `docs/v0/05-database-requirements.md` mục migration/query/transaction.
- `docs/v0/06-ui-requirements.md` mục error states và acceptance.

## Output files

- C2 server acceptance tests.
- `Customer`, `Device`, `Repair Order` area checklists riêng.
- C2 evidence index không chứa cross-area UI flow.
- Package scripts/config để chạy từng area độc lập.

## Files to write

- [ ] `tests/server/RepairFlow.Api.Tests/Features/Customer/C2CustomerApiTests.cs`.
- [ ] `tests/server/RepairFlow.Api.Tests/Features/Device/C2DeviceApiTests.cs`.
- [ ] `tests/server/RepairFlow.Api.Tests/Features/RepairOrder/C2RepairOrderApiTests.cs`.
- [ ] `tests/ui/c2/customer-area-checklist.md`.
- [ ] `tests/ui/c2/device-area-checklist.md`.
- [ ] `tests/ui/c2/repair-order-area-checklist.md`.
- [ ] `tests/ui/c2/c2-area-acceptance-evidence.md`.
- [ ] `src/ui/package.json` scripts/test configuration nếu cần.

## Step-by-step implementation

- [ ] Freeze test runner/config and naming convention theo area.
- [ ] Viết/run backend API tests độc lập với browser UI.
- [ ] Chạy Customer area test/build/manual evidence.
- [ ] Chạy Device area test/build/manual evidence.
- [ ] Chạy Repair-order area test/build/manual evidence.
- [ ] Chạy role context switch trong Repair-order area với cùng account/session.
- [ ] Kiểm tra mỗi area có thể mount trực tiếp mà không cần area khác.
- [ ] Kiểm tra no direct fetch/database/client-only permission.
- [ ] Tổng hợp evidence theo area; không tạo integrated UI acceptance.
- [ ] Chỉ đánh dấu C2 DONE khi cả API và từng area pass.

## Testing plan

- [ ] `dotnet test` cho C2 API/DB/permission.
- [ ] `npm run type-check`.
- [ ] Build riêng từng area.
- [ ] Test riêng từng area bằng test project/config riêng.
- [ ] Manual desktop `1440×1024` cho Manager/order và mobile `390×844` cho
  Receptionist/customer-facing usage khi area có tác vụ mobile.
- [ ] Active-role switch: cùng user/session trước và sau.
- [ ] No cross-area browser navigation as an acceptance requirement.
- [ ] Migration rerun và clean database verification.

## Acceptance criteria

- [ ] Không còn tiêu chí yêu cầu UI tích hợp chung để pass C2.
- [ ] Customer area có checklist/evidence riêng.
- [ ] Device area có checklist/evidence riêng.
- [ ] Repair-order area có checklist/evidence riêng.
- [ ] Backend/API acceptance vẫn độc lập và enforce security.
- [ ] Multi-role user dùng một account, một session và một `index.html`.
- [ ] C2 không làm C3/C4/C5 thay đổi ngoài contract đã chốt.

## Change impact

Plan này thay đổi cách nghiệm thu UI sau C1: shared chỉ tổng hợp bằng chứng và
API contract, không chạy shared UI integration. Nếu test runner hoặc browser
tooling cần thêm dependency, phải kiểm tra lockfile/package policy trước khi
install.
