# C2-003 — Supporting customer/device views

Plan ID: c2-003

Title: Antigravity supporting lookup, profile và history views

Owner: Antigravity

Status: SUPERSEDED

Revision: 2

Depends on: c2-001-codex-customer-device-order-api.md, c2-002-antigravity-customer-area.md

Produces: Các view tra cứu/profile/history phụ trợ khi có nhu cầu quản trị

Consumed by: none (historical; replaced by c2-006)

Superseded by: c2-006-antigravity-receptionist-customer-directory.md

## Historical note

Plan này không còn là active execution plan. Không triển khai bằng cách đổi
scope hoặc đánh dấu lại nội dung trong file này. Nhu cầu hiện tại của Lễ tân
được tách thành c2-006 với phạm vi hẹp hơn: danh sách và hồ sơ khách hàng
read-only, không mở lại mô hình Customer → Device → Order cho intake.

## Quyết định lịch sử

Không triển khai Device area độc lập như một bước bắt buộc của intake. Tại luồng
chính, nhân viên luôn nhập thiết bị được bàn giao trong `repair-intake-workflow`.
Đây là quyết định của plan cũ; plan đã được supersede bởi c2-006 cho nhu cầu
customer directory read-only của Lễ tân. Không dùng file này để tạo task mới,
không block C2 và không tạo lại navigation Customer → Device → Order.

## Task context

```text
Goal: Cung cấp view tra cứu/profile/history phụ trợ mà không làm phình workflow intake.
Feature: customer-device-supporting-views
Read first: src/ui/AGENTS.md, plans/v0/c2/README.md, c2-001, c2-002,
            docs/v0/06-ui-requirements.md
Allowed to change: none; historical reference only.
Do not change: repair-intake workflow, C3 evidence, role-specific shell hoặc backend
               business rule.
Completion criteria: not applicable; execution is replaced by c2-006.
```

## Historical future scope (not active)

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

## Historical acceptance (not active)

- [ ] View phụ trợ mount độc lập và không được import vào primary intake để quản lý
      business state.
- [ ] History/ownership/workspace boundary lấy từ API thật.
- [ ] Không có direct fetch/database trong component.
- [ ] Có loading, empty, error, unavailable và forbidden state.
