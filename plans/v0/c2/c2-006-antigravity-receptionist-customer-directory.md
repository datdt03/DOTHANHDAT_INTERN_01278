# C2-006 — Receptionist customer directory

Plan ID: c2-006

Title: Antigravity receptionist customer directory và safe profile lookup

Owner: Antigravity

Status: READY

Revision: 1

Depends on: c2-000-shared-multi-role-ui-boundary.md,
             c2-001-codex-customer-device-order-api.md,
             c2-002-antigravity-customer-area.md

Produces: Danh sách và hồ sơ khách hàng read-only cho Lễ tân, được mount từ
          customer area nhưng không trở thành đường đi chính của intake

Consumed by: c2-005-shared-area-acceptance.md và các flow vận hành của Lễ tân

## Task context

```text
Goal: Cho phép Lễ tân tìm và xem hồ sơ khách hàng trong workspace để hỗ trợ tiếp nhận và chăm sóc khách.
Feature: receptionist-customer-directory
Read first: src/ui/AGENTS.md, plans/v0/c2/README.md, c2-001, c2-002,
            docs/v0/02-use-cases.md, docs/v0/06-ui-requirements.md
Allowed to change: src/ui/features/customer-records-area, receptionist navigation,
                   route/adapter tối thiểu và tests/ui/customer
Do not change: repair-intake-workflow boundary, c2-004 order area, C3/C4 behavior,
               API/database contract, permission enforcement hoặc global shell
Completion criteria: receptionist có entry point rõ ràng tới customer directory;
                     list/search/detail read-only dùng API thật và có acceptance evidence.
```

## Goal

Bổ sung một điểm tra cứu khách hàng rõ ràng cho Lễ tân. Đây là supporting view
cho việc tìm hồ sơ theo tên, số điện thoại hoặc email; không thay thế workflow
`repair-intake-workflow` và không tạo chuỗi điều hướng Customer → Device → Order.

## Scope

- Thêm entry point `Khách hàng` trong navigation của Lễ tân.
- Danh sách khách hàng trong workspace hiện tại.
- Tìm theo tên, số điện thoại hoặc email qua typed customer adapter.
- Xem safe profile summary: họ tên, số điện thoại, email và metadata cần thiết
  cho vận hành; không hiển thị credential, raw technical note, audit hoặc dữ liệu
  ngoài workspace.
- Read-only presentation cho Lễ tân; tạo khách hàng mới vẫn thực hiện trong
  `repair-intake-workflow`.
- Loading, empty, error/retry, unavailable, forbidden, expired và success state.
- Responsive/zoom checks và acceptance evidence riêng.

## Out of scope

- Device directory hoặc device history page.
- Tạo/sửa/xóa Customer từ customer directory.
- Tạo RepairOrder từ customer directory.
- Thay thế customer search/create trong c2-002.
- Order list/detail của c2-004.
- Raw technical data, credentials, audit log hoặc dữ liệu cross-workspace.
- Thay đổi API contract, database schema hoặc backend authorization rule.

## Dependencies

- c2-001 cung cấp customer search/detail API và workspace boundary.
- c2-002 giữ intake là task-first workflow, không phụ thuộc customer directory.
- c2-000 cung cấp authenticated role/context và area mount boundary.

## Files to write or update

- [ ] `src/ui/features/customer-records-area/customer-records-area.tsx` nếu cần
      tách rõ read-only mode cho receptionist.
- [ ] `src/ui/features/customer-records-area/customer-search-panel.tsx` nếu cần
      hoàn thiện search theo email và safe empty/error state.
- [ ] `src/ui/shared/api/access-api.ts` hoặc route/navigation file tối thiểu để
      expose entry point cho receptionist, không đổi permission source of truth.
- [ ] `tests/ui/customer/customer-directory-checklist.md`.
- [ ] `tests/ui/customer/` test/evidence files theo runner hiện có.

## Step-by-step implementation

- [ ] Chốt route và mapping customer list/detail → component/API/state.
- [ ] Thêm navigation item `Khách hàng` cho receptionist nếu capability contract
      cho phép; không thêm quyền mới chỉ vì UI có menu.
- [ ] Mount customer directory bằng existing customer area/adapter.
- [ ] Giữ customer directory read-only cho receptionist; không hiển thị create
      action ngoài intake.
- [ ] Kiểm tra API response chỉ hiển thị safe customer projection trong workspace.
- [ ] Bổ sung search theo tên, phone và email; không fallback sang dữ liệu mẫu khi
      live API lỗi.
- [ ] Viết checklist/evidence cho desktop, mobile, zoom và session lifecycle.

## Testing plan

- [ ] Receptionist thấy menu và mở được customer directory.
- [ ] Search hit/miss theo tên, phone và email.
- [ ] List/detail không hiển thị customer ngoài workspace.
- [ ] Receptionist không thấy nút tạo/sửa/xóa từ directory.
- [ ] Tạo customer từ intake vẫn hoạt động độc lập với directory.
- [ ] Loading, empty, error/retry, unavailable, forbidden và expired state.
- [ ] Manager/Owner không bị thay đổi route hoặc capability hiện có.
- [ ] Không có direct fetch/database trong component.
- [ ] Không tạo lại flow Customer → Device → Order.

## Acceptance criteria

- [ ] Lễ tân có entry point rõ ràng tới danh sách khách hàng.
- [ ] Danh sách tìm được theo tên, số điện thoại và email bằng API thật.
- [ ] Hồ sơ hiển thị đúng safe projection trong workspace hiện tại.
- [ ] Directory là read-only; customer creation vẫn thuộc intake workflow.
- [ ] Không thay đổi API/database/business rule hoặc C2-002 primary flow.
- [ ] Có evidence riêng và checklist được cập nhật trong `tests/ui/customer`.

## Change impact

Plan này thay thế nhu cầu supporting-view rộng và chưa triển khai của c2-003
bằng một slice hẹp, có lý do vận hành rõ ràng cho Lễ tân. c2-003 vẫn được giữ
ở trạng thái `SUPERSEDED` làm lịch sử; không sửa scope cũ và không kéo device
history vào C2.
