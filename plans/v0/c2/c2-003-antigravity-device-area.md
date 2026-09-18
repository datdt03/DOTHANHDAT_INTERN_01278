# C2-003 — Supporting customer/device views

Plan ID: c2-003

Title: Antigravity supporting lookup, profile và history views

Owner: Antigravity

Status: DEFERRED

Revision: 2

Depends on: c2-001-codex-customer-device-order-api.md, c2-002-antigravity-customer-area.md

Produces: Các view tra cứu/profile/history phụ trợ khi có nhu cầu quản trị

Consumed by: c2-004, C3/C9 khi cần history projection

## Quyết định

Không triển khai Device area độc lập như một bước bắt buộc của intake. Tại luồng
chính, nhân viên luôn nhập thiết bị được bàn giao trong `repair-intake-workflow`.
Plan này chỉ được kích hoạt khi có yêu cầu rõ ràng về tra cứu, profile hoặc lịch
sử; nó không block C2 và không được tạo lại navigation Customer → Device → Order.

## Task context

```text
Goal: Cung cấp view tra cứu/profile/history phụ trợ mà không làm phình workflow intake.
Feature: customer-device-supporting-views
Read first: src/ui/AGENTS.md, plans/v0/c2/README.md, c2-001, c2-002,
            docs/v0/06-ui-requirements.md
Allowed to change: supporting feature components và tests riêng khi plan được activate.
Do not change: repair-intake workflow, C3 evidence, role-specific shell hoặc backend
               business rule.
Completion criteria: chỉ có view phụ trợ cần thiết, không biến thành bắt buộc cho intake.
```

## Future scope khi activate

- Customer profile/history với order links an toàn.
- Device profile/history theo serial/identifier.
- Search/read-only projection theo workspace/capability.
- Có thể dùng inline panel hoặc order detail tab thay vì page riêng.
- Không tạo device từ đây để thay thế form bàn giao trong intake.

## Out of scope

- Device lookup/select trong bước tạo phiếu.
- Tạo repair order từ Device page.
- Intake checklist/photo/evidence.
- Diagnosis/quote/repair.

## Acceptance khi activate

- [ ] View phụ trợ mount độc lập và không được import vào primary intake để quản lý
      business state.
- [ ] History/ownership/workspace boundary lấy từ API thật.
- [ ] Không có direct fetch/database trong component.
- [ ] Có loading, empty, error, unavailable và forbidden state.
