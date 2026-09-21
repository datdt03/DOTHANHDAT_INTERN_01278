# C2-004 — Repair-order area và entry point tiếp nhận

Plan ID: c2-004

Title: Antigravity order list/detail UI và kết nối workflow tiếp nhận

Owner: Antigravity

Status: DONE

Revision: 3

Depends on: c2-002-antigravity-customer-area.md,
             c2-001-codex-customer-device-order-api.md

Produces: `repair-order-area` cho list/detail và entry point mở
          `repair-intake-workflow`.

Consumed by: c2-006 tag UI, c2-009 C2 vertical acceptance, C3/C4/C9

## Plan boundary

Đây là plan UI duy nhất cho order list/detail trong C2. Plan không tạo lại
Customer/Device CRUD flow và không đưa business rule vào React. Tag picker được
triển khai ở c2-006; ảnh/evidence được triển khai ở c2-008.

## Task context

```text
Goal: Tra cứu phiếu đã tạo và mở đúng workflow tiếp nhận từ một order area duy nhất.
Feature: repair-order-area
Read first: src/ui/AGENTS.md, docs/v0/02-use-cases.md, docs/v0/06-ui-requirements.md,
            c2-001, c2-002 và current route/area boundary.
Allowed to change: src/ui/features/repair-order-area, route/adapter tối thiểu,
                    typed API adapter và tests UI liên quan.
Do not change: c2-000/c2-001 plan files, server business rules, Customer/Device
               create flow, evidence upload, diagnosis/quote, global shell hoặc
               role-specific HTML.
Completion criteria: list/detail dùng safe DTO thật, mở được intake workflow,
                     có đủ network states và không tạo workflow nhập liệu thứ hai.
```

## Scope

- Order list theo workspace, tìm theo order code/customer/device/status nếu API
  hiện có hỗ trợ.
- Order detail hiển thị order code, customer, các repair item, reported issue,
  handover summary, status, staff attribution và timestamps theo safe DTO.
- Nút `Tạo phiếu tiếp nhận` mở `repair-intake-workflow`.
- Sau khi intake thành công, điều hướng tới detail bằng `orderId` từ API.
- Hiển thị nhiều repair item theo thứ tự backend trả về.
- Giữ vị trí hiển thị cho tags ở item/order detail để c2-006 tích hợp; c2-004
  không tự tạo tag logic.
- Bắt buộc có loading skeleton, empty, error/retry, unavailable/preview,
  forbidden, expired session và ready state.
- Responsive desktop/mobile và zoom 110–150% theo `src/ui/AGENTS.md`.

## Out of scope

- Tạo Customer/Device/RepairOrder bằng chuỗi API từ order area.
- Tag catalog, create/rename/delete tag; thuộc c2-005/c2-006.
- Chụp, upload hoặc hoàn tất evidence; thuộc c2-007/c2-008.
- Customer directory riêng cho Receptionist; defer về C9 hoặc plan vận hành sau.
- Diagnosis, quotation, repair, QC, handover và customer public link.

## Implementation sequence

- [ ] Map route → component → adapter → state trước khi code.
- [ ] Tạo area mount độc lập, không import global role shell làm business state.
- [ ] Implement list/search/detail bằng typed adapter; component không gọi fetch.
- [ ] Nối CTA tới route/mount của `repair-intake-workflow`.
- [ ] Hiển thị status tiếng Việt, order code bằng typography chuẩn và safe DTO.
- [ ] Chuẩn bị item rendering để nhận `tags[]` khi c2-006 hoàn tất, không thêm
      mock tag hoặc client-side inference.
- [ ] Viết UI checklist và evidence cho các network/accessibility states.

## Testing plan

- [ ] List hit/miss/empty/error/unavailable.
- [ ] Detail đúng customer, device, repair item và status thật từ API.
- [ ] Một order có nhiều item không bị gộp hoặc đảo thứ tự.
- [ ] Nút tạo phiếu mở đúng intake workflow, không tạo form thứ hai.
- [ ] Forbidden/session expired không hiển thị protected detail cũ.
- [ ] Receptionist read-only và Technician assignment scope đúng projection.
- [ ] Không có direct fetch/database trong component.
- [ ] Keyboard/focus, responsive và zoom evidence.

## Acceptance criteria

- [ ] Order area là nơi xem list/detail, không trở thành luồng nhập liệu khác.
- [ ] Tạo phiếu mới luôn đi qua `repair-intake-workflow`.
- [ ] Detail hiển thị dữ liệu thật và hỗ trợ nhiều repair item.
- [ ] UI không tự quyết định permission hoặc status transition.
- [ ] Có typed adapter và evidence độc lập cho area này.

## Change impact

Plan này thay thế c2-004 READY cũ ở mức nội dung, không thay đổi c2-000/c2-001
đã DONE. Customer directory bị loại khỏi C2 active sequence và không phải
dependency của order area.
