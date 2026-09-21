# C2-009 — C2 vertical acceptance cho intake, tags và evidence

Plan ID: c2-009

Title: Nghiệm thu cuối C2 theo một vertical slice hoàn chỉnh

Owner: Codex + Antigravity

Status: READY

Revision: 2

Depends on: c2-002-antigravity-customer-area.md,
             c2-004-antigravity-repair-order-area.md,
             c2-005-codex-workspace-tag-api.md,
             c2-006-antigravity-tag-ui.md,
             c2-007-codex-intake-evidence-foundation.md,
             c2-008-antigravity-intake-evidence-ui.md

Produces: C2 acceptance evidence và handoff record cho C3.

## Plan boundary

Đây là plan acceptance duy nhất của chuỗi mới. Nó hợp nhất nội dung acceptance
cũ của c2-005 và c2-009, không tạo thêm production behavior. Không tạo một
shared application shell và không sửa các plan đã `DONE`.

## Task context

```text
Goal: Chứng minh luồng Tiếp nhận sửa chữa chạy từ customer/device/order đến tag
      và ảnh ngoại quan đúng quyền, đúng transaction và có retry an toàn.
Feature: c2-vertical-acceptance
Read first: plans/v0/c2/README.md, c2-002, c2-004, c2-005, c2-006, c2-007,
            c2-008, docs/v0/06-ui-requirements.md.
Allowed to change: tests/server, tests/ui, acceptance evidence và pointer docs.
Do not change: production behavior ngoài contract đã hoàn thành, C3 transition,
               C4/C5 behavior, global shell, migration history hoặc DONE plans.
Completion criteria: backend/API, tag lifecycle, UI intake/order, photo upload,
                     security và failure/retry scenarios cùng pass.
```

## Acceptance matrix

### Core intake

- Existing/new customer trong cùng workflow.
- Một hoặc nhiều repair item trong một order.
- Atomic create, rollback, idempotency/double-submit.
- Workspace, role, assignment và safe DTO enforcement.
- Initial order/item status `received`, order code, history/audit.
- Credential ciphertext, expiry/destroy/reveal policy từ baseline c2-001.

### Order area

- List/detail thật từ API.
- CTA mở đúng intake workflow.
- Không có Customer → Device → Order workflow thứ hai.
- Loading, empty, error/retry, unavailable, forbidden, expired.

### Tags

- Workspace A/B isolation.
- Create/search/rename tag.
- Một item có nhiều tag; nhiều item dùng chung tag.
- Tạo nhãn ngay từ search miss trong intake và tự động chọn nhãn vừa tạo.
- Duplicate create trả `409 TAG_NAME_EXISTS` nhưng UI nhận diện/chọn nhãn đã có.
- Assignment của item có thể thêm/xóa khi order còn `received`.
- Assignment bị khóa từ `diagnosing` trở đi, trả `409 TAG_ASSIGNMENT_LOCKED` và
  không làm mất nhãn hiện có.
- Duplicate normalized name và duplicate assignment.
- Referenced tag trả `409 TAG_IN_USE` và không mất lịch sử.
- Unreferenced tag hard-delete thành công.
- Tags hiển thị đúng item trong review/list/detail.

### Condition evidence

- Một/nhiều ảnh cho từng item.
- Caption từng ảnh optional.
- Mô tả tổng tình trạng bắt buộc.
- Gợi ý shot process không biến thành rule bắt buộc đủ mọi góc.
- MIME/size/checksum/private storage/signed access.
- Create order trước, upload sau.
- Partial upload failure, per-photo retry, không tạo order thứ hai.
- Không có public URL, localStorage photo, credential leak hoặc direct fetch.

### C2/C3 boundary

- Order vẫn `received` khi evidence chưa hoàn tất.
- C2 không chuyển `received` → `diagnosing`.
- C3 nhận được evidence metadata và chịu trách nhiệm completion/checklist.

## Implementation sequence

- [ ] Freeze fixtures cho workspace, manager, receptionist, technician,
      assigned/unassigned actor và foreign workspace.
- [ ] Chạy server build/test và migration clean/idempotent evidence.
- [ ] Chạy tag lifecycle/security/API tests.
- [ ] Chạy intake transaction/idempotency/regression tests.
- [ ] Chạy order list/detail UI checklist.
- [ ] Chạy tag picker/multi-item/rename/delete-guard UI checklist.
- [ ] Chạy inline-create, duplicate-resolution và pre-repair assignment-edit
      checklist.
- [ ] Chạy lifecycle-lock checklist từ `diagnosing` trở đi.
- [ ] Chạy photo capture/upload/retry/failure checklist trên target viewports.
- [ ] Kiểm tra private access, signed URL expiry và no-leak conditions.
- [ ] Ghi acceptance evidence và C2/C3 handoff.
- [ ] Chỉ mark C2 completion sau khi Codex backend gate và Antigravity UI gate
      đều có evidence pass.

## Required verification commands

```text
dotnet build src/server/RepairFlow.sln --no-restore
dotnet test src/server/RepairFlow.sln --no-restore
npm --prefix src/ui run type-check
npm --prefix src/ui run build
```

Ngoài command, phải có evidence runtime cho PostgreSQL migration, API upload,
workspace isolation và UI retry; build xanh một mình không đủ để mark DONE.

## Acceptance criteria

- [ ] Nhân viên hoàn tất được intake một màn hình với một/nhiều item.
- [ ] Mỗi item có thể dùng nhiều tag workspace và tag lifecycle đúng quy tắc.
- [ ] Mỗi item có ít nhất một ảnh và mô tả tổng trước khi UI báo hoàn tất.
- [ ] Ảnh có caption tùy chọn và guided capture flow.
- [ ] Upload lỗi retry được mà không tạo order trùng.
- [ ] Backend vẫn là authority cho quyền, workspace và status.
- [ ] C2 không triển khai diagnosis hoặc transition sang `diagnosing`.
- [ ] Không sửa hoặc cập nhật ngược plan `DONE`.

## Deferred items

- Receptionist customer directory chuyển sang C9/plan operational views.
- Order-level tags chuyển sang một decision/plan riêng nếu product cần.
- Customer public visibility cho ảnh chuyển sang C5 sau khi có privacy policy.
