# C2-002 — Customer records area

Plan ID: c2-002

Title: Antigravity customer records area độc lập

Owner: Antigravity

Status: READY

Revision: 1

Depends on: c2-001-codex-customer-device-order-api.md

Produces: Customer records area với shell, API adapter và test harness riêng

Consumed by: c2-004-antigravity-repair-order-area.md và C3/C9 khi cần liên kết

## Task context

```text
Goal: Cho phép tìm/tạo/xem customer trong workspace bằng một business area riêng.
Feature: customer-records-area
Read first: src/ui/AGENTS.md, docs/v0/02-use-cases.md, docs/v0/06-ui-requirements.md,
            docs/v0/08-ui-design-blueprint-and-stitch-handoff.md,
            c2-001-codex-customer-device-order-api.md
Allowed to change: src/ui/features/customer-records-area, area route/adapter và tests/ui/customer.
Do not change: shared application shell, role-specific HTML, device/order business rule.
Completion criteria: area mount trực tiếp, dùng API adapter, đủ UI states và test độc lập.
```

## Goal

Xây vùng nghiệp vụ customer độc lập với các vùng Device và Repair Order. Vùng này
không phải một app theo role; Manager, Receptionist hoặc role khác chỉ khác nhau
ở action/capability mà backend trả về.

## Main business requirements

- Tìm customer theo số điện thoại hoặc query trong workspace.
- Gợi ý hồ sơ hiện có trước khi tạo mới.
- Không tạo bản ghi trùng chỉ vì khác định dạng số điện thoại.
- Hiển thị detail và thông tin liên kết tối thiểu an toàn.
- Không lộ customer của workspace khác.

## Scope

- `CustomerRecordsAreaShell` và route area riêng.
- Search form có debounce/submit rõ ràng, không gọi database trực tiếp.
- Result list với name, phone, email tùy quyền và số lượng device/order nếu API cho phép.
- Create customer form với validation name/phone/email/note.
- Duplicate suggestion và lựa chọn dùng hồ sơ cũ.
- Detail view có link sang Device/Repair Order area bằng ID hợp lệ.
- Loading skeleton, empty state, error/retry, unavailable/preview boundary và success.
- Capability-driven action visibility; API vẫn là authority.
- Desktop `1440×1024`, responsive ở `768×1024`; mobile nếu dùng trong receptionist flow.

## Out of scope

- Tạo device hoặc repair order trong customer area.
- Sửa/xóa lịch sử, audit hoặc dữ liệu ngoài customer contract.
- Customer public link/OTP.
- Role-specific HTML hoặc role-specific shell.
- Lưu business draft bằng localStorage.

## Dependencies

- c2-000 area boundary và multi-role context.
- c2-001 customer API contract đã freeze.

## Input files

- `src/ui/app/main.tsx` và route dispatcher mỏng.
- `src/ui/shared/api/`.
- `src/ui/shared/components/`.
- `src/ui/shared/styles/`.
- `docs/v0/02-use-cases.md` UC-03/UC-12.
- `docs/v0/06-ui-requirements.md` mục customer/create flow.
- `docs/v0/08-ui-design-blueprint-and-stitch-handoff.md` Batch B.

## Output files

- Customer area shell/page/components.
- Customer API adapter theo contract.
- Area route registration không tạo role route.
- Unit/component/manual evidence riêng cho customer area.

## Files to write

- [ ] `src/ui/features/customer-records-area/customer-records-area.tsx`.
- [ ] `src/ui/features/customer-records-area/customer-records-area.css`.
- [ ] `src/ui/features/customer-records-area/customer-records-api.ts`.
- [ ] `tests/ui/customer/customer-records-area-checklist.md`.
- [ ] `tests/ui/customer/` test files theo test runner đã freeze.

## Step-by-step implementation

- [ ] Lập mapping customer screen → route/component/API/state trước khi code.
- [ ] Tạo shell riêng, không import `RoleAwareNavigationShell`.
- [ ] Nối search/create/detail qua adapter typed.
- [ ] Xử lý duplicate suggestion theo response API, không tự quyết định ở client.
- [ ] Hiển thị action theo `effectiveCapabilities` và active context.
- [ ] Thêm accessible form, keyboard focus và Vietnamese copy.
- [ ] Hoàn thiện responsive/zoom theo UI standards.
- [ ] Ghi evidence area riêng, không gộp với Device/Order flow.

## Testing plan

- [ ] Search hit/miss, empty và API unavailable.
- [ ] Create valid/invalid customer.
- [ ] Duplicate phone suggestion và không tạo bản ghi thứ hai khi chọn existing.
- [ ] Workspace isolation ở adapter/API boundary.
- [ ] Permission action ẩn/disabled không thay thế backend denial.
- [ ] Refresh/session expired không hiển thị data cũ như protected data hợp lệ.
- [ ] Mount area trực tiếp, không cần boot toàn bộ application shell.
- [ ] Manual visual check riêng tại viewport đã chốt.

## Acceptance criteria

- [ ] Customer area chạy độc lập trong cùng `index.html` nhưng không phụ thuộc area khác.
- [ ] Manager/Receptionist có action đúng capability; user nhiều role vẫn một account.
- [ ] Customer duplicate, validation và workspace boundary hoạt động đúng.
- [ ] Không có fetch/database call trong component.
- [ ] Có evidence và test result riêng cho area.

## Change impact

Chỉ thêm customer records area và adapter contract. Không đổi schema/API ngoài
contract đã được c2-001 freeze; mọi gap phải trả về Codex bằng issue/plan adjustment.
