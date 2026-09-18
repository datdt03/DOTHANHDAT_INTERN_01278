# C2-004 — Repair-order list và detail area

Plan ID: c2-004

Title: Antigravity repair-order area sau workflow tiếp nhận

Owner: Antigravity

Status: READY — replan

Revision: 2

Depends on: c2-001-codex-customer-device-order-api.md,
             c2-002-antigravity-customer-area.md

Produces: Order list/detail shell và entry point mở `repair-intake-workflow`

Consumed by: C3 intake/evidence, C4 diagnosis/quote và C9 operational views

## Task context

```text
Goal: Tra cứu và xem repair order sau khi intake workflow đã tạo phiếu.
Feature: repair-order-area
Read first: src/ui/AGENTS.md, docs/v0/02-use-cases.md UC-03/UC-12,
            docs/v0/06-ui-requirements.md, c2-001 và c2-002 replan
Allowed to change: src/ui/features/repair-order-area, route/adapter và tests/ui/repair-order.
Do not change: tạo Customer/Device page riêng, C3 intake completion, C4 diagnosis/quote,
               C5 customer link hoặc global app shell.
Completion criteria: list/detail hoạt động, mở được intake workflow, acceptance riêng.
```

## Goal

Order là record trung tâm sau khi `CreateRepairIntake` thành công. Area này phục
vụ tra cứu, đọc detail và mở bước tiếp theo; không lặp lại form Customer/Device
hoặc tạo order bằng chuỗi API thủ công.

## Scope

- Order list/search theo order code, customer, device, status trong workspace.
- Order detail: code, customer, device, reported issue, handover summary, status,
  creator, attribution và timestamps theo quyền.
- Primary action `Tạo phiếu tiếp nhận` mở `repair-intake-workflow`.
- Sau submit thành công từ workflow, điều hướng tới detail bằng order ID hợp lệ.
- Loading, empty, error/retry, unavailable, forbidden, expired và success state.
- Role/capability presentation không thay thế backend authorization.

## Out of scope

- Tách Customer/Device create form trong order area.
- Checklist/ảnh/evidence và intake completion của C3.
- Diagnosis, quote, repair, QC, handover.
- Customer public link/OTP.
- Client-side status source of truth hoặc role-specific HTML.

## Dependencies

- c2-001 atomic intake API và order list/detail contract.
- c2-002 repair-intake workflow mount/return contract.
- c2-000 multi-role context.

## Files to write

- [ ] `src/ui/features/repair-order-area/repair-order-area.tsx`.
- [ ] `src/ui/features/repair-order-area/repair-order-area.css`.
- [ ] `src/ui/features/repair-order-area/repair-order-api.ts`.
- [ ] `tests/ui/repair-order/repair-order-area-checklist.md`.
- [ ] `tests/ui/repair-order/` test files theo runner hiện có.

## Step-by-step implementation

- [ ] Lập mapping list/detail → route/component/API/state.
- [ ] Tạo shell và local state riêng, không import global role shell.
- [ ] Implement list/search/detail qua typed adapter.
- [ ] Nối primary action tới `repair-intake-workflow`, không tạo form thứ hai.
- [ ] Hiển thị reported issue và handover summary đúng safe DTO.
- [ ] Giữ status/order/customer/device từ API làm source of truth.
- [ ] Kiểm tra role context, responsive/zoom và typography order code.

## Testing plan

- [ ] List/search hit/miss/empty/error/unavailable.
- [ ] Detail hiển thị đúng customer/device/order summary.
- [ ] Open new intake không làm mất current order context ngoài ý muốn.
- [ ] Forbidden/session expired không hiển thị protected detail.
- [ ] Technician assignment scope và Receptionist read-only projection.
- [ ] Không có create Customer/Device tuần tự trong area này.
- [ ] Mount/detail test độc lập.

## Acceptance criteria

- [ ] Order area không trở thành một workflow nhập liệu thứ hai.
- [ ] Tạo phiếu mới luôn dùng `repair-intake-workflow`.
- [ ] Detail hiển thị dữ liệu thật từ API và link C3/C4 chỉ khi contract cho phép.
- [ ] Không có direct fetch/database trong component.
- [ ] Có evidence riêng cho list/detail.

## Change impact

C2-004 không còn phụ thuộc vào hai page Customer/Device độc lập. Dependency tới
c2-003 là optional và chỉ dùng khi supporting history views được activate.
