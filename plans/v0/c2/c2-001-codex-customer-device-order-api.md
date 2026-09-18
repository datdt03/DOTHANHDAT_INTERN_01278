# C2-001 — Customer, device và repair-order API

Plan ID: c2-001

Title: Codex customer/device/repair-order foundation

Owner: Codex

Status: READY

Revision: 1

Depends on: c2-000-shared-multi-role-ui-boundary.md

Produces: PostgreSQL schema, .NET API, authorization và test fixtures cho C2

Consumed by: c2-002, c2-003, c2-004, C3 intake/evidence

## Task context

```text
Goal: Cung cấp API thật để tạo/tra cứu customer, device và repair order lõi.
Feature: customer-device-repair-order
Read first: docs/v0/02-use-cases.md, docs/v0/03-business-and-domain-requirements.md,
            docs/v0/05-database-requirements.md, docs/v0/07-authentication-and-authorization.md,
            c2-000-shared-multi-role-ui-boundary.md
Allowed to change: src/server/RepairFlow.Api, tests/server và migration C2.
Do not change: intake/evidence, diagnosis/quote, customer link hoặc state transition
               sau trạng thái received.
Completion criteria: database sạch/migration idempotent, API contract rõ và test
                     pass cho validation, transaction, workspace và permission.
```

## Goal

Triển khai nguồn dữ liệu nghiệp vụ đầu tiên sau C1: customer, device và repair
order. Mọi dữ liệu phải được giới hạn theo workspace và mọi order mới phải có
order code unique, trạng thái `received`, creator và lịch sử ban đầu.

## Main business requirements

- Customer thuộc một workspace; chống trùng theo số điện thoại đã chuẩn hóa.
- Device thuộc customer và workspace; giữ được lịch sử nhiều order.
- Repair order là entity trung tâm, liên kết customer/device/workspace.
- Không lưu passcode/mật khẩu thiết bị.
- Staff attribution dùng `repair_order_staff`, không ghi đè lịch sử.
- Tạo order phải atomic và ghi status history/audit trong transaction.

## Scope

### Database

- Migration mới cho `customers`, `devices`, `repair_orders`,
  `repair_order_staff` và `status_history` theo docs/v0.
- Giữ `audit_logs` từ C1 và tạo index nghiệp vụ cần thiết.
- FK workspace/customer/device/user dùng `RESTRICT` theo database requirements.
- Unique customer phone theo workspace sau normalize.
- Conditional unique device serial theo workspace khi serial tồn tại.
- Unique `repair_orders.order_code` theo workspace.
- Index tìm customer phone/name, device serial/identifier và order code/status.
- Sequence/order-code generation chịu được concurrent request.

### API contract dự kiến

Tên route và DTO phải được freeze trong OpenAPI trước khi UI bắt đầu; contract
dự kiến gồm:

- `GET /api/customers?query=&phone=` — search trong workspace.
- `POST /api/customers` — create customer.
- `GET /api/customers/{customerId}` — safe customer detail.
- `GET /api/customers/{customerId}/devices` — devices của customer.
- `GET /api/devices?query=&serialNumber=&customerId=` — device search.
- `POST /api/devices` — create device.
- `GET /api/devices/{deviceId}` — device detail/history summary.
- `GET /api/repair-orders?query=&status=&customerId=&deviceId=` — order list.
- `POST /api/repair-orders` — create order lõi ở `received`.
- `GET /api/repair-orders/{orderId}` — order detail.

Response phải dùng envelope hiện có, có request ID, safe fields và không trả
credential, session secret hoặc dữ liệu ngoài workspace.

### Validation/transaction

- Customer name/phone bắt buộc; email/note tùy chọn.
- Device type/brand/model và serial/identifier validate theo policy; không tự
  sinh serial giả.
- Customer/device phải cùng workspace.
- Issue khách mô tả bắt buộc và giữ nguyên, không biến thành diagnosis.
- Cảnh báo device đang có order mở trước khi tạo order mới.
- Transaction tạo customer/device/order/assignment/status history/audit rollback
  toàn bộ khi một bước lỗi.
- Order mới chưa có intake completion; không mở đường tắt sang `diagnosing`.

### Authorization

- Owner/Manager: đọc/ghi trong workspace theo capability.
- Receptionist: create/search/read theo intake/operational policy.
- Technician: chỉ đọc/thao tác order được assignment cho phần được cấp; C2 chưa
  mở diagnosis/repair write.
- Workspace khác: trả 403/404 phù hợp, không lộ existence.

## Out of scope

- Upload/evidence/checklist.
- Diagnosis, quote, customer link.
- Dashboard aggregation đầy đủ.
- Delete customer/device/order.
- Tự động email/SMS.

## Dependencies

- C1 session/auth/authorization pass.
- c2-000 multi-role contract pass.
- Database migration convention trong `plans/README.md` và mục migration docs.

## Input files

- `src/server/RepairFlow.Api/Features/Access/`.
- `src/server/RepairFlow.Api/Infrastructure/Database/`.
- `src/server/RepairFlow.Api/Api/Responses/`.
- `tests/server/RepairFlow.Api.Tests/Features/Access/`.
- `docs/v0/02-use-cases.md` mục UC-03/UC-12/AT-01/AT-02/AT-17/AT-19.
- `docs/v0/05-database-requirements.md` mục 5.4–5.7, 7 và 9.

## Output files

- C2 SQL migration(s).
- Feature folders cho customer, device và repair order trong server.
- OpenAPI contracts và safe DTOs.
- Unit/API/integration/migration tests.
- Development fixtures đủ workspace, duplicate, open-order và assignment cases.

## Files to write

- [ ] `src/server/RepairFlow.Api/Infrastructure/Database/Migrations/20260917_0003__spec-v0__create-customer-device-repair-order.sql`.
- [ ] `src/server/RepairFlow.Api/Features/Customer/`.
- [ ] `src/server/RepairFlow.Api/Features/Device/`.
- [ ] `src/server/RepairFlow.Api/Features/RepairOrder/`.
- [ ] `tests/server/RepairFlow.Api.Tests/Features/Customer/`.
- [ ] `tests/server/RepairFlow.Api.Tests/Features/Device/`.
- [ ] `tests/server/RepairFlow.Api.Tests/Features/RepairOrder/`.

## Step-by-step implementation

- [ ] Freeze schema/API mapping against docs/v0 before writing SQL.
- [ ] Create SQL migration with metadata, constraints, indexes and seed-safe behavior.
- [ ] Add domain/application models and transaction boundary.
- [ ] Implement customer search/create/detail with normalized phone handling.
- [ ] Implement device search/create/detail/history and ownership checks.
- [ ] Implement order create/list/detail and concurrent order-code generation.
- [ ] Implement staff attribution and initial status history/audit.
- [ ] Add policies for workspace, capability and assignment.
- [ ] Add OpenAPI descriptions and safe response/error behavior.
- [ ] Run migration on clean database and rerun without duplicate application.

## Testing plan

- [ ] Missing/invalid customer, device and issue validation.
- [ ] Duplicate customer phone behavior inside/outside workspace.
- [ ] Device ownership, serial uniqueness and open-order warning.
- [ ] Atomic rollback when customer/device/order step fails.
- [ ] Concurrent order-code uniqueness.
- [ ] Initial status `received`, status history and audit are created together.
- [ ] Cross-workspace read/write denial.
- [ ] Receptionist, Manager and Technician capability matrix.
- [ ] Safe DTO does not expose credential/token/internal secrets.
- [ ] Migration clean run and idempotent rerun.

## Acceptance criteria

- [ ] C2 entities exist only through target .NET migration boundary.
- [ ] Customer/device/order API is available in OpenAPI and has request IDs.
- [ ] A valid create request returns a unique order code and `received` order.
- [ ] No diagnosis/intake completion is possible through C2 endpoints.
- [ ] All reads/writes enforce workspace and capability/assignment policy.
- [ ] Failed transaction leaves no orphan customer/device/order.
- [ ] C2 UI areas can consume the contract without guessing business rules.

## Change impact

Đây là migration/schema mở rộng đầu tiên sau access schema C1. Không sửa
migration lịch sử. Nếu docs/v0 không đủ để freeze một route, field hoặc draft
semantics, dừng phần đó và ghi decision trước khi implement.
