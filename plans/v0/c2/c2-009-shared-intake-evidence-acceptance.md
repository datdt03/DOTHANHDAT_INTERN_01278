# C2-009 — Shared intake evidence acceptance

Plan ID: c2-009

Title: Acceptance ảnh hiện trạng và boundary C2/C3

Owner: Codex and Antigravity

Status: READY

Revision: 1

Depends on: c2-005-shared-area-acceptance.md,
             c2-007-codex-intake-evidence-foundation.md,
             c2-008-antigravity-intake-evidence-ui.md

Produces: Backend/UI evidence, C2/C3 handoff record và acceptance checklist cho
          ảnh `before_repair`

Consumed by: C3 intake/evidence và C2 completion record

## Task context

```text
Goal: Chứng minh ảnh hiện trạng đi từ Giai đoạn 2 vào private evidence boundary mà không phá atomic intake hoặc chuyển status sớm.
Feature: c2-intake-evidence-acceptance
Read first: plans/v0/c2/README.md, c2-005, c2-007, c2-008,
            docs/v0/02-use-cases.md, docs/v0/05-database-requirements.md,
            docs/v0/06-ui-requirements.md
Allowed to change: tests/server C2 evidence acceptance, tests/ui/repair-intake,
                   tests/ui/c2 và acceptance evidence/docs pointer
Do not change: production behavior ngoài contract đã chốt, C3 diagnosis transition,
               role-specific HTML, database migration history hoặc global shell
Completion criteria: API, UI và security boundary cùng pass; evidence được lưu private;
                     failure/partial upload không tạo success giả.
```

## Goal

Nghiệm thu vertical slice mới: nhân viên nhập thiết bị, chụp/chọn ảnh ở Giai
đoạn 2, tạo order `received`, handoff ảnh sang evidence API, rồi xử lý lỗi hoặc
retry mà không làm sai trạng thái. Acceptance này xác nhận boundary để C3 tiếp
tục sở hữu evidence completion.

## Scope

### Backend acceptance

- Evidence upload contract, request ID, envelope và error codes.
- `before_repair` metadata, MIME/size/checksum validation.
- Private object storage boundary và signed read access.
- Workspace isolation, role/capability/assignment authorization.
- Duplicate/retry/partial upload behavior và orphan cleanup.
- Migration clean run/idempotent rerun nếu c2-007 có migration.

### UI acceptance

- Stage 2 photo capture/file picker, thumbnails, caption/remove/retry.
- Create order then evidence upload sequence.
- Upload failure giữ order ở `received` và cho retry.
- Unavailable, forbidden, expired, empty và success states.
- Mobile camera affordance, desktop picker, keyboard/focus và zoom.

### Boundary acceptance

- `CreateRepairIntake` vẫn atomic cho Customer/Device/RepairOrder.
- Evidence không được lưu vào localStorage, log, URL query hoặc public URL.
- C2 không hoàn tất checklist, không chuyển `received` → `diagnosing`.
- C3 nhận được evidence handoff contract để tiếp tục minimum-photo/completion rule.

## Out of scope

- Checklist chi tiết và transition implementation của C3.
- Diagnosis, quote, repair, QC, handover hoặc customer public link.
- Cross-browser camera permission automation ngoài manual evidence.
- Thay đổi product rule không có trong docs/v0.

## Files to write

- [ ] `tests/server/RepairFlow.Api.Tests/Features/RepairOrder/` evidence tests.
- [ ] `tests/ui/repair-intake/repair-intake-evidence-checklist.md`.
- [ ] `tests/ui/c2/c2-intake-evidence-acceptance.md`.
- [ ] Acceptance evidence và plan/index pointer nếu cần.

## Step-by-step implementation

- [ ] Freeze fixtures: workspace, receptionist/intake responsibility, manager và foreign workspace.
- [ ] Chạy backend evidence contract/security/regression tests.
- [ ] Chạy UI capture/upload/retry/failure scenarios trên viewport mục tiêu.
- [ ] Verify private access, signed URL expiry và không lộ object key.
- [ ] Verify order creation rollback/idempotency remains unchanged.
- [ ] Verify C2/C3 handoff payload và evidence completion ownership.
- [ ] Ghi evidence và chỉ mark slice DONE khi backend/UI/security cùng pass.

## Acceptance criteria

- [ ] Ảnh hợp lệ từ Stage 2 được lưu thành private `before_repair` evidence.
- [ ] Ảnh ngoài workspace hoặc actor không có quyền bị từ chối.
- [ ] Ảnh lỗi MIME/size/checksum bị từ chối rõ ràng.
- [ ] Upload lỗi không làm mất order và không hiển thị success giả.
- [ ] Retry không tạo duplicate ngoài policy.
- [ ] Không có public URL, credential leak, localStorage persistence hoặc direct fetch.
- [ ] Order vẫn ở `received` cho đến khi C3 hoàn tất evidence/checklist.
- [ ] C2-007, c2-008 và c2-009 evidence được lưu cùng acceptance record.

## Change impact

Plan này mở rộng C2 acceptance với photo handoff nhưng không làm C2 sở hữu
diagnosis transition hay toàn bộ C3 evidence workflow. Nó là cổng kiểm tra trước
khi C3 triển khai intake completion.
