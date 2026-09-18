# C2-005 — Acceptance cho repair intake workflow

Plan ID: c2-005

Title: Nghiệm thu C2 theo workflow nghiệp vụ và backend contract

Owner: Codex and Antigravity

Status: READY — replan

Revision: 2

Depends on: c2-001-codex-customer-device-order-api.md,
             c2-002-antigravity-customer-area.md,
             c2-004-antigravity-repair-order-area.md

Produces: API evidence, repair-intake workflow evidence và order list/detail evidence

Consumed by: C3 intake/evidence và C2 completion record

## Task context

```text
Goal: Chứng minh luồng Tiếp nhận sửa chữa hoạt động atomic, trực quan và đúng quyền.
Feature: c2-repair-intake-acceptance
Read first: plans/v0/c2/README.md, c2-001, c2-002, c2-004,
            docs/v0/06-ui-requirements.md
Allowed to change: tests/ui/c2, tests/server C2 acceptance và evidence/docs pointer.
Do not change: C3/C4/C5 behavior, role-specific HTML hoặc tạo shared role shell.
Completion criteria: API pass; intake workflow pass; order list/detail pass; không
                     yêu cầu ba page CRUD độc lập.
```

## Goal

Nghiệm thu theo task thực tế: nhân viên bắt đầu ở `Tiếp nhận sửa chữa`, resolve
customer, nhập thiết bị bàn giao, nhập lỗi/thông tin tiếp nhận, review và xác nhận
một lần. Backend phải tạo Customer/Device/RepairOrder atomic.

## Scope

### API acceptance

- Migration clean run/idempotent rerun từ baseline.
- Customer phone/email search và duplicate handling.
- Atomic `POST /api/repair-orders/intake` với existing/new customer.
- Device intake validation và identifier conflict policy.
- Workspace isolation, capability/assignment matrix.
- Order code unique, initial `received`, status history/audit.
- Rollback và idempotency/double-submit.
- Credential capture per repair item: encrypted ciphertext trong database hiện tại,
  consent, expiry/destroy, reveal authorization; không plaintext trong DTO/log/audit.
- OpenAPI/envelope/request ID/safe DTO.

### Repair intake workflow acceptance

- Direct mount workflow không cần Customer/Device page khác.
- Giai đoạn 1: search phone/email hoặc chủ động chuyển sang create customer.
- Giai đoạn 2: luôn nhập device bàn giao và thông tin repair intake.
- Giai đoạn 3: review summary, back/edit và confirm.
- Existing customer không tạo duplicate.
- New customer + device + order tạo thành công qua một command.
- Một RepairOrder có nhiều repair item và mỗi item giữ issue/notes/credential status
  riêng.
- Credential field được mask, không lưu browser-side và không yêu cầu external
  vault/container/storage service.
- Loading, validation, empty, duplicate, error/retry, unavailable/preview,
  forbidden/session expired và success.
- Vietnamese copy, keyboard/focus và viewport evidence.

### Repair-order area acceptance

- Order list/search/detail độc lập.
- Primary action mở intake workflow, không có form create thứ hai.
- Customer/device/order safe projection và assignment/read-only behavior.

Supporting customer/device history views trong c2-003 đã SUPERSEDED và không
được triển khai từ plan cũ. Customer directory read-only của Lễ tân thuộc
c2-006; đây là acceptance slice riêng và không block intake workflow.

## Out of scope

- E2E qua các page Customer → Device → Order vì đó không còn là workflow chính.
- C3 checklist/photo/evidence/intake completion.
- C4 diagnosis/quote.
- C5 customer public link/OTP.
- Test nhiều account để mô phỏng nhiều role.
- Role-specific HTML hoặc nhiều repository.

## Files to write

- [ ] Backend API acceptance tests theo feature.
- [ ] `tests/ui/c2/repair-intake-workflow-checklist.md`.
- [ ] `tests/ui/c2/repair-order-area-checklist.md`.
- [ ] `tests/ui/c2/c2-acceptance-evidence.md`.
- [ ] Test config/package script chỉ khi runner hiện có yêu cầu.

## Step-by-step implementation

- [ ] Freeze API command/error matrix và test fixtures.
- [ ] Chạy backend regression + atomic intake tests.
- [ ] Chạy workflow UI theo ba giai đoạn.
- [ ] Kiểm tra direct mount, capability, session expiry và unavailable state.
- [ ] Chạy order list/detail evidence.
- [ ] Kiểm tra không có direct fetch/database/client-only permission.
- [ ] Tổng hợp evidence và chỉ đánh dấu C2 DONE khi API + workflow + order area pass.

## Acceptance criteria

- [ ] Một nhân viên có thể tạo phiếu mà không cần chuyển qua ba trang entity.
- [ ] Có lựa chọn tìm hoặc tạo customer trong cùng màn hình.
- [ ] Thiết bị được ghi nhận bằng form bàn giao, không bắt tìm trong customer device list.
- [ ] Review/confirm tạo đúng order `received` và không có dữ liệu mồ côi khi lỗi.
- [ ] Credential nếu được cung cấp chỉ tồn tại dạng ciphertext trong database hiện
      tại, reveal/destroy đúng quyền và không lộ trong response/log/audit.
- [ ] Multi-role vẫn dùng một account, session và `index.html`.
- [ ] UI không được thay thế authorization backend.
- [ ] C2 không làm C3/C4/C5 thay đổi ngoài contract đã chốt.

## Change impact

Revision 2 thay thế acceptance theo ba UI area độc lập bằng acceptance của một
workflow nghiệp vụ và các view phụ trợ. Shared ở đây chỉ là evidence/index, không
phải shared application shell.
