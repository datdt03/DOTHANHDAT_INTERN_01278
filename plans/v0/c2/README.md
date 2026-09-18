# RepairFlow C2 — Repair intake foundation

> Plan ID: c2
>
> Title: Customer, device và repair-order foundation theo workflow tiếp nhận
>
> Owner: Codex and Antigravity
>
> Status: IN PROGRESS
>
> Revision: 3
>
> Depends on: c1-007-shared-integration-acceptance.md
>
> Produces: Feature-first Customer/Device/RepairOrder backend và một workflow
> UI `RepairIntake` để tạo phiếu trong cùng một ngữ cảnh
>
> Consumed by: C3 intake/evidence, C4 diagnosis/quote và C9 dashboard

## Quyết định điều chỉnh

C2 không expose Customer, Device và RepairOrder thành chuỗi trang bắt buộc.
Nghiệp vụ chính là **Tiếp nhận sửa chữa**. Người dùng hoàn tất một workflow có
ba giai đoạn trong cùng màn hình:

```text
1. Thông tin khách hàng
   Tìm theo số điện thoại/email hoặc chủ động chuyển sang tạo mới
        ↓
2. Thiết bị bàn giao và thông tin sửa chữa
   Luôn nhập thiết bị được mang tới; không bắt chọn thiết bị từ danh sách
        ↓
3. Tổng hợp và xác nhận
   Kiểm tra lại trước khi tạo Customer/Device/RepairOrder
```

UI là task-first nhưng backend vẫn feature-first:

```text
src/server/RepairFlow.Api/Features/
├── Customer/
├── Device/
└── RepairOrder/       ← application orchestration cho CreateRepairIntake

src/ui/features/
├── repair-intake-workflow/  ← workflow chính của C2
└── repair-order-area/       ← danh sách/chi tiết sau khi đã tạo phiếu
```

Không tạo `Features/C2`, `C2Models.cs`, `C2Contracts.cs` hoặc
`IC2Repository.cs`. Không tạo Customer/Device page riêng làm đường đi chính để
tạo phiếu.

## Task context

```text
Goal: Tạo một workflow tiếp nhận sửa chữa trực quan, atomic và ít chuyển trang.
Feature: repair-intake-workflow
Read first: docs/v0/02-use-cases.md, docs/v0/03-business-and-domain-requirements.md,
            docs/v0/05-database-requirements.md, docs/v0/06-ui-requirements.md,
            src/ui/AGENTS.md
Allowed to change: plans/v0/c2, C2 backend/API/database/test và repair-intake UI.
Do not change: C3 detailed evidence/completion, C4 diagnosis/quote, C5 customer link,
               role-specific HTML hoặc business rule chưa được quyết định.
Completion criteria: atomic intake API, một workflow UI ba giai đoạn, order list/detail
                     sau khi tạo, và acceptance evidence không phụ thuộc role-specific shell.
```

## Ranh giới C2/C3

- C2 lưu Customer, Device, RepairOrder lõi ở trạng thái `received` và phần thông
  tin bàn giao cơ bản cần để xác nhận phiếu.
- C2 giữ customer-reported issue, device identity, phụ kiện/tình trạng bàn giao
  dạng thông tin ban đầu nếu contract đã có.
- C2-007/C2-008 cung cấp điểm thu và handoff ảnh hiện trạng ban đầu trong
  workflow. C3 sở hữu evidence persistence/validation, checklist chi tiết,
  intake completion và điều kiện chuyển sang `diagnosing`.
- C2 không tự tạo server-side draft hoặc chuyển trạng thái sang diagnosis.

## Work sequence

| Sequence | Plan | Owner | Nội dung | Status |
| ---: | --- | --- | --- | --- |
| 000 | [c2-000-shared-multi-role-ui-boundary.md](./c2-000-shared-multi-role-ui-boundary.md) | Codex + Antigravity | Multi-role context và area boundary | DONE |
| 001 | [c2-001-codex-customer-device-order-api.md](./c2-001-codex-customer-device-order-api.md) | Codex | API nền và atomic `CreateRepairIntake` | DONE — implementation verified |
| 002 | [c2-002-antigravity-customer-area.md](./c2-002-antigravity-customer-area.md) | Antigravity | Một `repair-intake-workflow` ba giai đoạn | READY — replan |
| 003 | [c2-003-antigravity-device-area.md](./c2-003-antigravity-device-area.md) | Antigravity | Historical supporting device/customer history views | SUPERSEDED - không triển khai |
| 004 | [c2-004-antigravity-repair-order-area.md](./c2-004-antigravity-repair-order-area.md) | Antigravity | Order list/detail và mở lại intake workflow | READY — replan |
| 005 | [c2-005-shared-area-acceptance.md](./c2-005-shared-area-acceptance.md) | Codex + Antigravity | Acceptance workflow + API | READY — replan |
| 006 | [c2-006-antigravity-receptionist-customer-directory.md](./c2-006-antigravity-receptionist-customer-directory.md) | Antigravity | Danh sách/hồ sơ khách hàng read-only cho Lễ tân | READY |
| 007 | [c2-007-codex-intake-evidence-foundation.md](./c2-007-codex-intake-evidence-foundation.md) | Codex | Evidence API/storage boundary cho ảnh hiện trạng | READY |
| 008 | [c2-008-antigravity-intake-evidence-ui.md](./c2-008-antigravity-intake-evidence-ui.md) | Antigravity | Thu ảnh hiện trạng trong Giai đoạn 2 và handoff C3 | READY |
| 009 | [c2-009-shared-intake-evidence-acceptance.md](./c2-009-shared-intake-evidence-acceptance.md) | Codex + Antigravity | Acceptance ảnh hiện trạng và boundary C2/C3 | READY |

C2-003 là historical plan đã bị supersede, không được kích hoạt hoặc viết đè.
Nhu cầu danh sách khách hàng của Lễ tân được thực hiện riêng trong c2-006.
c2-006 không được đưa lại mô hình bắt người dùng đi qua Customer page rồi Device
page để tạo order; intake chính vẫn thuộc c2-002.

c2-007 phải hoàn tất contract/API trước c2-008. c2-008 là amendment UI cho
c2-002, chỉ thu ảnh trong memory và handoff sau khi order đã tồn tại; C3 vẫn là
owner của evidence completion và status transition.

## Scope

- Search customer theo số điện thoại/email trong workspace.
- Chuyển chủ động giữa mode tìm customer cũ và form tạo customer mới trong cùng
  màn hình.
- Nhập thiết bị thực tế được bàn giao, không bắt người dùng chọn thiết bị có sẵn
  theo customer context.
- Nhập lỗi khách mô tả và thông tin tiếp nhận cơ bản.
- Mỗi device/repair item có mô tả lỗi, ghi chú và trạng thái/credential unlock
  riêng khi cần.
- Review trước khi xác nhận.
- Một application command tạo hoặc resolve Customer, tạo/resolve Device theo
  identity policy và tạo RepairOrder `received` trong một transaction.
- Order code unique theo workspace, creator, attribution, status history và audit.
- Multi-role context trong cùng account/session/index.
- Order list/detail sau khi tạo.

## Out of scope

- Customer/Device CRUD page là đường đi chính của intake.
- C3 checklist chi tiết, evidence persistence/completion và intake transition;
  initial photo capture/handoff được định nghĩa trong c2-007/c2-008.
- C4 diagnosis, quotation và calculation.
- C5 customer public link, OTP và customer decision.
- C9 dashboard KPI và operational reporting đầy đủ.
- Server-side draft/resume nếu chưa có state decision riêng.
- Tách UI theo role, nhiều HTML hoặc microfrontend runtime.

## Shared Definition of Done cho C2

- Migration/API hiện có tiếp tục pass; amendment không phá vỡ CRUD contract đã
  freeze.
- Có OpenAPI contract cho atomic intake command, response envelope, request ID và
  safe DTO.
- Customer search/create, device intake và order create enforce workspace,
  capability và assignment policy ở backend.
- Một request intake thành công trả về customer, device và order liên quan.
- Lỗi ở bất kỳ bước nào không để lại dữ liệu rời rạc.
- Nếu cần lưu passcode, chỉ dùng encrypted storage bên trong RepairFlow API và
  database hiện tại; không thêm container, vault hoặc storage service khác.
- UI có một mount point cho `repair-intake-workflow`, state local và adapter
  typed; không gọi database/fetch trực tiếp trong component.
- Workflow có loading, validation, empty/search miss, duplicate, error/retry,
  unavailable/preview và success state.
- C2 acceptance kiểm tra workflow chính; không yêu cầu ba trang CRUD độc lập.
- C2 không làm C3/C4/C5 thay đổi ngoài contract đã chốt.

## Change impact

Revision 3 thay đổi navigation/UX từ entity-first sang task-first. C2-001 cần
amend application/API contract để tạo intake atomic. C2-002 trở thành workflow
chính; c2-003 không còn là dependency bắt buộc. Các đoạn cũ về wizard bốn bước,
`tìm/tạo device` và ba UI area đã được đồng bộ trong UI requirements và Stitch
handoff.
