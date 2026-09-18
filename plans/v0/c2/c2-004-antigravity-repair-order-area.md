# C2-004 — Repair-order area

Plan ID: c2-004

Title: Antigravity repair-order area và tạo order lõi

Owner: Antigravity

Status: READY

Revision: 1

Depends on: c2-001-codex-customer-device-order-api.md, c2-002-antigravity-customer-area.md, c2-003-antigravity-device-area.md

Produces: Repair-order area với create/list/detail shell và test harness riêng

Consumed by: C3 intake/evidence, C4 diagnosis/quote và C9 operational views

## Task context

```text
Goal: Tạo và tra cứu repair order lõi ở received trong một area riêng.
Feature: repair-order-area
Read first: src/ui/AGENTS.md, docs/v0/02-use-cases.md UC-03/UC-12,
            docs/v0/06-ui-requirements.md, c2-001-codex-customer-device-order-api.md
Allowed to change: src/ui/features/repair-order-area, area route/adapter và tests/ui/repair-order.
Do not change: C3 intake/evidence, C4 diagnosis/quote, C5 customer link, global app shell.
Completion criteria: create/list/detail hoạt động, role context đúng, acceptance riêng.
```

## Goal

Đưa customer và device đã chọn vào một repair order lõi, trả order code unique,
trạng thái `received` và detail an toàn. Đây là điểm nối dữ liệu cho C3 nhưng
chưa hoàn tất intake.

## Main business requirements

- Customer/device phải được chọn từ cùng workspace.
- Issue khách mô tả là dữ liệu gốc, không được đổi thành diagnosis.
- Order tạo thành công có code unique và status `received`.
- Manager/Owner và Receptionist dùng cùng area nhưng action theo capability.
- User nhiều role vẫn ở cùng account/session; role context chỉ đổi focus.

## Scope

- `RepairOrderAreaShell` độc lập.
- Order list/search tối thiểu theo order code, customer, device, status.
- Create order core:
  - chọn customer hiện có hoặc mở Customer area;
  - chọn device hiện có hoặc mở Device area;
  - nhập issue khách mô tả;
  - expected completion/internal note nếu contract cho phép;
  - chọn intake staff profile nếu có quyền.
- Order detail: code, customer, device, status, creator, staff attribution, timestamps.
- Active context switcher dùng tại header area theo c2-000.
- Loading/empty/error/unavailable/success/forbidden/expired state.
- Nếu đang ở context Technician, hiển thị phạm vi assigned phù hợp; không dùng UI để bypass API.

## Draft và C3 boundary

- C2 không lưu draft nghiệp vụ vào `localStorage`.
- C2 create core tạo order `received` khi API chấp nhận dữ liệu tối thiểu.
- Checklist/ảnh hiện trạng/intake completion và server-side draft semantics thuộc C3.
- Không thêm nút “Hoàn tất intake” nếu API C3 chưa tồn tại.

## Out of scope

- Checklist condition, accessories và upload ảnh.
- Chuyển `received` sang `diagnosing`.
- Diagnosis/quote/customer link.
- Dashboard KPI đầy đủ.
- Tách area theo role hoặc chuyển account.

## Dependencies

- c2-001 API contract.
- c2-002 Customer area và c2-003 Device area có mount/link contract.
- c2-000 active-role context.

## Input files

- `src/ui/app/` bootstrap/area dispatcher.
- `src/ui/features/customer-records-area/`.
- `src/ui/features/device-area/`.
- `src/ui/shared/api/`.
- `docs/v0/02-use-cases.md` UC-03.
- `docs/v0/06-ui-requirements.md` create flow/detail.
- `docs/v0/08-ui-design-blueprint-and-stitch-handoff.md` Batch B/C.

## Output files

- Repair-order area shell/list/create/detail.
- Repair-order API adapter.
- Role-context-aware UI behavior.
- Independent test/manual checklist.

## Files to write

- [ ] `src/ui/features/repair-order-area/repair-order-area.tsx`.
- [ ] `src/ui/features/repair-order-area/repair-order-area.css`.
- [ ] `src/ui/features/repair-order-area/repair-order-api.ts`.
- [ ] `tests/ui/repair-order/repair-order-area-checklist.md`.
- [ ] `tests/ui/repair-order/` test files theo test runner đã freeze.

## Step-by-step implementation

- [ ] Lập mapping order screen → route/component/API/state.
- [ ] Tạo shell riêng và area route.
- [ ] Implement list/search/detail qua typed adapter.
- [ ] Implement create core với customer/device references.
- [ ] Hiển thị conflict/open-order warning từ API trước khi submit.
- [ ] Giữ active area khi đổi context nếu còn hợp lệ.
- [ ] Khi context không có quyền, hiển thị forbidden và không render protected detail.
- [ ] Không thêm state client thay thế status/order source of truth.
- [ ] Kiểm tra responsive/zoom và typography order code.

## Testing plan

- [ ] Create order valid/invalid/missing customer/device/issue.
- [ ] Customer/device mismatch bị reject.
- [ ] Order code/status `received` hiển thị đúng.
- [ ] Transaction failure không hiển thị success giả.
- [ ] Manager/Receptionist action matrix.
- [ ] Manager + Technician cùng account đổi context không đổi user/session.
- [ ] Technician unassigned không xem order detail ngoài scope.
- [ ] Area mount/test độc lập, không chạy cross-area integrated flow.
- [ ] Session expired/forbidden/error/unavailable state.

## Acceptance criteria

- [ ] Repair-order area chạy độc lập trong cùng `index.html`.
- [ ] Tạo được order lõi ở `received` với customer/device/issue hợp lệ.
- [ ] Không có đường tắt sang intake completion/diagnosis.
- [ ] Multi-role context switch đúng vị trí và không tạo account/session mới.
- [ ] API adapter là boundary duy nhất cho network call.
- [ ] Có evidence riêng cho Repair-order area.

## Change impact

Area này nối ba entity C2 nhưng không sở hữu intake/evidence. Không đưa business
state vào Customer/Device area và không dùng role-specific component để thay
thế backend authorization.
