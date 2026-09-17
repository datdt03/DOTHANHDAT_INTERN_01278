# C2-003 — Device area

Plan ID: c2-003

Title: Antigravity device area độc lập

Owner: Antigravity

Status: READY

Revision: 1

Depends on: c2-001-codex-customer-device-order-api.md

Produces: Device area với shell, API adapter và test harness riêng

Consumed by: c2-004-antigravity-repair-order-area.md và C3 device/intake flow

## Task context

```text
Goal: Cho phép tra cứu/tạo device và xem history mà không phụ thuộc Customer/Order UI.
Feature: device-area
Read first: src/ui/AGENTS.md, docs/v0/02-use-cases.md, docs/v0/05-database-requirements.md,
            docs/v0/06-ui-requirements.md, c2-001-codex-customer-device-order-api.md
Allowed to change: src/ui/features/device-area, area route/adapter và tests/ui/device.
Do not change: repair-order workflow, intake evidence, role-specific HTML.
Completion criteria: device area mount/test độc lập, ownership/history/duplicate cases pass.
```

## Goal

Triển khai vùng device độc lập để chọn đúng thiết bị của customer, giữ lịch sử
sửa chữa và cảnh báo order đang mở trước khi tạo order mới.

## Main business requirements

- Device luôn thuộc đúng customer và workspace.
- Tìm được bằng serial/identifier hoặc customer context.
- Device có thể có nhiều repair order theo thời gian.
- Serial trùng trong workspace phải bị chặn hoặc gắn với flow xác nhận theo API.
- Không lưu passcode/mật khẩu thiết bị.

## Scope

- `DeviceAreaShell` và route riêng.
- Search device theo serial/identifier/customer.
- Create device với device type, brand, model, serial/identifier, note.
- Detail/history view với order summaries safe.
- Open-order warning.
- Ownership/workspace error rõ ràng.
- Capability-driven create/read action.
- Đủ loading, empty, error, unavailable và success state.
- Responsive theo viewport UI standard.

## Out of scope

- Tạo repair order trong Device area.
- Intake checklist, accessories, condition photo/evidence.
- Diagnosis, quote, repair work.
- Customer public view.
- Role-specific HTML hoặc shared integration flow.

## Dependencies

- c2-000 area boundary/multi-role context.
- c2-001 device API contract và history projection.

## Input files

- `src/ui/app/` route dispatcher.
- `src/ui/shared/api/`.
- `src/ui/shared/components/` và styles.
- `docs/v0/02-use-cases.md` UC-03/UC-12.
- `docs/v0/05-database-requirements.md` mục `devices`.
- `docs/v0/06-ui-requirements.md` Step 2 create flow.

## Output files

- Device area shell/page/components.
- Device API adapter.
- Device-specific states and checklist/evidence.

## Files to write

- [ ] `src/ui/features/device-area/device-area.tsx`.
- [ ] `src/ui/features/device-area/device-area.css`.
- [ ] `src/ui/features/device-area/device-api.ts`.
- [ ] `tests/ui/device/device-area-checklist.md`.
- [ ] `tests/ui/device/` test files theo test runner đã freeze.

## Step-by-step implementation

- [ ] Lập mapping device screen → route/component/API/state.
- [ ] Tạo shell và local state riêng.
- [ ] Nối search/create/detail/history qua adapter typed.
- [ ] Hiển thị customer context và open-order warning từ API.
- [ ] Không cho user tự đổi customer/device relationship bằng client state.
- [ ] Đảm bảo mã serial/identifier dùng typography mono theo UI rules.
- [ ] Hoàn thiện accessibility/responsive/zoom.
- [ ] Ghi evidence chỉ cho Device area.

## Testing plan

- [ ] Search theo serial/identifier/customer.
- [ ] Device not found/empty/error/unavailable.
- [ ] Create valid/invalid device.
- [ ] Wrong customer/workspace bị từ chối.
- [ ] Serial duplicate và open-order warning.
- [ ] History hiển thị đúng order summary safe.
- [ ] Area mount/test độc lập, không boot Customer/Order area.
- [ ] Session expired/revoked không giữ protected device data.

## Acceptance criteria

- [ ] Device area có shell/state/test riêng.
- [ ] Không gọi trực tiếp `fetch` trong component.
- [ ] Device chỉ hiển thị đúng workspace/customer.
- [ ] History và open-order warning không phải dữ liệu mock tĩnh.
- [ ] Có evidence riêng, không gộp với Customer hoặc Repair Order acceptance.

## Change impact

Không mở rộng device business rule ngoài docs/v0. Nếu API chưa trả đủ history
hoặc warning, ghi server gap cho c2-001 thay vì tự suy luận ở UI.
