# RepairFlow C2 — Customer, Device và Repair Order

> Plan ID: c2
>
> Title: Customer, device và repair-order foundation
>
> Owner: Codex and Antigravity
>
> Status: READY
>
> Revision: 1
>
> Depends on: c1-007-shared-integration-acceptance.md
>
> Produces: Customer/device/order API và các UI business area độc lập để triển khai tiếp các capability C3–C5
>
> Consumed by: C3 intake/evidence, C4 diagnosis/quote và C9 dashboard

## Task context

```text
Goal: Xây nền customer, device và repair order ở trạng thái received.
Feature: C2 customer-device-repair-order
Read first: docs/v0/02-use-cases.md, docs/v0/03-business-and-domain-requirements.md,
            docs/v0/05-database-requirements.md, docs/v0/06-ui-requirements.md,
            src/ui/AGENTS.md
Allowed to change: plans/c2, C2 backend/API/database/test và các UI area C2.
Do not change: C3 intake/evidence, C4 diagnosis/quote, C5 customer link,
               business rule chưa được quyết định trong docs/v0.
Completion criteria: API, migration, multi-role context và ba business area
                     có test/evidence độc lập; không có shared UI integration test.
```

## C2 direction đã chốt

C2 không tách UI theo role và không tạo HTML riêng cho Manager, Receptionist
hoặc Technician. Một user có thể có nhiều role trong cùng workspace và vẫn dùng
một account, một session, một `index.html`.

UI được tách theo business area:

```text
src/ui/index.html
  └── app bootstrap tối thiểu
      ├── Customer records area
      ├── Device area
      └── Repair-order area
```

Mỗi area sở hữu application shell, route boundary, local state và test harness
riêng. Chỉ dùng chung design tokens, icon SVG, API contract/HTTP client và
primitive component. Không dùng chung application shell, role navigation,
business state hoặc UI integration flow.

### Role context trong giao diện

Role không quyết định cấu trúc HTML. Backend trả về `roles[]`, `activeRole` và
`effectiveCapabilities` cho workspace hiện tại.

- Desktop: nút `Ngữ cảnh làm việc` nằm trong header, sau Workspace switcher và
  trước Notification/Avatar.
- Mobile: đặt trong Account menu để không chiếm chiều rộng header.
- Chỉ hiển thị bộ chọn khi user có từ hai role.
- Chuyển role không logout, không đổi account, không tạo session mới và không
  dùng role chưa được cấp.
- `activeRole` chỉ đổi navigation/focus/attribution context; permission vẫn do
  backend kiểm tra bằng membership, capability và assignment.

### Ranh giới C2/C3

- C2 tạo customer, device và repair order lõi; order bắt đầu ở `received`.
- C3 sở hữu intake checklist, ảnh hiện trạng, hoàn tất intake và điều kiện mở
  sang `diagnosing`.
- C2 không tạo localStorage draft nghiệp vụ. Nếu cần draft server-side, C3 phải
  có schema/state decision riêng trước khi triển khai.

## Work sequence

| Sequence | Plan | Owner | Nội dung | Status |
| ---: | --- | --- | --- | --- |
| 000 | [c2-000-shared-multi-role-ui-boundary.md](./c2-000-shared-multi-role-ui-boundary.md) | Codex + Antigravity | Multi-role context và area-owned shell | READY |
| 001 | [c2-001-codex-customer-device-order-api.md](./c2-001-codex-customer-device-order-api.md) | Codex | Schema, migration, API và permission | READY |
| 002 | [c2-002-antigravity-customer-area.md](./c2-002-antigravity-customer-area.md) | Antigravity | Customer records area | READY |
| 003 | [c2-003-antigravity-device-area.md](./c2-003-antigravity-device-area.md) | Antigravity | Device area | READY |
| 004 | [c2-004-antigravity-repair-order-area.md](./c2-004-antigravity-repair-order-area.md) | Antigravity | Repair-order area và create core order | READY |
| 005 | [c2-005-shared-area-acceptance.md](./c2-005-shared-area-acceptance.md) | Codex + Antigravity | Acceptance riêng từng area | READY |

`c2-005` là bước tổng hợp bằng chứng, không phải shared UI integration. Không
có test flow chuyển role hoặc đi xuyên qua cả ba area trong cùng một scenario.

## Scope

- Customer search/create/detail trong workspace.
- Device search/create/detail và device history.
- Repair order search/list/detail tối thiểu.
- Tạo repair order lõi với customer, device, issue và trạng thái `received`.
- Order code unique theo workspace.
- Ghi creator, optional intake attribution, status history và audit.
- Multi-role context switch trong cùng account/session.
- UI area độc lập và acceptance độc lập.

## Out of scope

- Intake checklist, condition photo/evidence và intake completion — C3.
- Diagnosis, quotation và calculation — C4.
- Customer public link, OTP và customer decision — C5.
- Dashboard KPI và operational reporting đầy đủ — C9.
- Tách thành nhiều repository hoặc microfrontend runtime.
- Role-specific HTML hoặc role-specific application shell.

## Shared Definition of Done cho C2

- Migration chạy được trên database sạch và idempotent.
- API có OpenAPI, response envelope, request ID và safe DTO.
- Workspace isolation, role/capability và assignment được enforce tại backend.
- Customer/device/order transaction không để lại dữ liệu rời rạc khi lỗi.
- Mỗi area có mount point/route, shell, state và test riêng trong cùng `index.html`.
- Không có component nào gọi database hoặc `fetch` trực tiếp.
- Có loading, empty, error, unavailable và success state.
- Customer, Device và Repair Order được test/evidence độc lập.
- C2 không làm thay đổi business rule C3–C5.

## Change impact

Plan này yêu cầu cập nhật access context từ một role sang nhiều role và thay đổi
quy tắc UI từ shared application shell sang area-owned shell. Phải tạo migration
mới và cập nhật `src/ui/AGENTS.md`/UI blueprint; không sửa migration C1 đã chạy,
không xóa code C1 trước khi kiểm tra usage.
