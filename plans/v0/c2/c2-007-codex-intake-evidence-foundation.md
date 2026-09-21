# C2-007 — Codex intake evidence API và private storage boundary

Plan ID: c2-007

Title: Backend/API cho ảnh ngoại quan trước sửa chữa

Owner: Codex

Status: READY

Revision: 2

Depends on: c2-001-codex-customer-device-order-api.md

Produces: Evidence API/storage boundary cho `before_repair`, gắn ảnh vào từng
          `RepairOrderItem`, có caption/shot type tùy chọn và access control.

Consumed by: c2-008 evidence UI, c2-009 vertical acceptance và C3

## Task context

```text
Goal: Cung cấp backend contract để UI upload một hoặc nhiều ảnh ngoại quan sau
      khi order tồn tại, có private access và retry an toàn.
Feature: RepairOrder evidence foundation
Read first: src/server/AGENTS.md, c2-001, docs/v0/05-database-requirements.md,
            docs/v0/06-ui-requirements.md và existing migration runner.
Allowed to change: RepairOrder evidence feature, migration mới nếu thiếu schema,
                    private storage port/test double, OpenAPI và server tests.
Do not change: CreateRepairIntake atomic semantics, tag feature c2-005, UI,
               diagnosis/quote/repair, public customer link hoặc C3 transition.
Completion criteria: typed upload/read contract, validation, authorization,
                     orphan cleanup và tests pass.
```

## Product/technical rules

- Evidence gắn với `repair_order_item_id`, không gắn mơ hồ chỉ với order.
- Stage bắt buộc là `before_repair`.
- `CreateRepairIntake` không nhận binary file và không thay đổi thành multipart.
- UI tạo order trước, sau đó upload từng ảnh bằng item id.
- Ảnh hợp lệ phải qua MIME, extension, size và checksum validation.
- File nằm trong private storage boundary; không trả public URL lâu hạn.
- Read access dùng signed URL ngắn hạn hoặc access response tương đương.
- Workspace, session, capability và assignment/responsibility được enforce ở API.
- Không để lại metadata/object mồ côi khi metadata transaction thất bại.
- Không chuyển `received` → `diagnosing`; C3 vẫn quyết định evidence completion.

## Evidence metadata

Reuse `repair_evidence` schema/contract nếu đã có; nếu chưa có thì tạo migration
mới, không sửa migration lịch sử:

```text
repair_evidence
- id
- workspace_id
- repair_order_item_id
- stage = before_repair
- storage_key/private object reference
- original_filename
- mime_type
- size
- checksum
- caption nullable
- shot_type nullable
- created_by
- created_at
```

`shot_type` nhận các giá trị gợi ý `front`, `back`, `edges`, `damage`,
`accessories`, `custom`. Caption/bình luận từng ảnh là optional.

Mô tả tổng tình trạng dùng field `handoverCondition` hiện có của item. Khi
client yêu cầu evidence upload, API phải trả lỗi rõ nếu item chưa có mô tả tổng;
không tạo thêm cột trùng nghĩa nếu audit xác nhận field hiện tại đúng semantic.

## API contract

Freeze trong OpenAPI trước khi code, theo envelope/request ID hiện có:

```text
POST   /api/repair-order-items/{itemId}/evidence
GET    /api/repair-order-items/{itemId}/evidence
DELETE /api/repair-order-items/{itemId}/evidence/{evidenceId}
GET    /api/evidence/{evidenceId}/access
```

Upload request gồm file và metadata `stage`, `caption?`, `shotType?`, checksum
hoặc server-computed checksum theo contract. Response chỉ trả safe metadata,
không lộ storage key nội bộ.

Upload rules:

- item phải thuộc order và workspace của access context;
- actor phải có responsibility/capability ghi evidence;
- duplicate retry theo checksum/request key không tạo bản ghi duplicate ngoài
  policy;
- delete evidence không phải delete order và phải được audit theo policy;
- signed access hết hạn, không usable như public URL.

## Implementation sequence

- [ ] Audit schema và migration runner.
- [ ] Freeze DTO/error code/upload sequence.
- [ ] Tạo feature-local evidence port/service/repository.
- [ ] Implement validation, private write, metadata transaction và cleanup.
- [ ] Implement workspace/capability/assignment authorization.
- [ ] Implement signed read access ngắn hạn.
- [ ] Thêm migration nếu cần, clean run/idempotent rerun.
- [ ] Viết OpenAPI, contract/security/regression tests.
- [ ] Ghi handoff cho c2-008: tạo order trước, upload sau, retry từng ảnh.

## Testing plan

- [ ] Upload một ảnh và nhiều ảnh trên đúng item.
- [ ] Caption/shot type optional không làm hỏng upload.
- [ ] Thiếu mô tả tổng bị từ chối rõ ràng.
- [ ] MIME/extension/size/checksum invalid bị từ chối.
- [ ] Cross-workspace, expired session, forbidden actor bị từ chối.
- [ ] Signed read access hết hạn.
- [ ] Metadata transaction lỗi không để orphan object/record.
- [ ] Retry không tạo duplicate ngoài policy.
- [ ] Normal DTO/log/error không chứa plaintext hoặc storage key nhạy cảm.
- [ ] Existing c2-001 regression vẫn pass.

## Acceptance criteria

- [ ] Có API typed để c2-008 upload `before_repair` sau khi order tồn tại.
- [ ] Một item nhận được nhiều ảnh và mỗi ảnh có thể có caption.
- [ ] Evidence gắn đúng item trong order nhiều thiết bị.
- [ ] Evidence private, có workspace boundary và signed access ngắn hạn.
- [ ] Mô tả tổng thiếu bị từ chối ở evidence boundary.
- [ ] Không nhúng binary vào `CreateRepairIntake`.
- [ ] Không chuyển status sang `diagnosing`.
