# C2-007 — Codex intake evidence API và private S3-compatible storage boundary

Plan ID: c2-007

Title: Backend/API cho ảnh ngoại quan trước sửa chữa

Owner: Codex

Status: IN PROGRESS

Revision: 4

Depends on: c2-001-codex-customer-device-order-api.md

Produces: Evidence API/storage boundary cho `before_repair`, gắn ảnh vào từng
          `RepairOrderItem`, private object storage, checksum dedupe và access control.

Consumed by: c2-008 evidence UI, c2-009 vertical acceptance và C3

## Task context

```text
Goal: Cung cấp backend contract để UI upload một hoặc nhiều ảnh ngoại quan sau
      khi order tồn tại, có private access và retry an toàn.
Feature: RepairOrder evidence foundation
Read first: src/server/AGENTS.md, c2-001, docs/v0/05-database-requirements.md,
            docs/v0/06-ui-requirements.md và existing migration runner.
Allowed to change: RepairOrder evidence feature, migration mới nếu thiếu schema,
                    private storage port/test double, local Docker Compose storage
                    wiring, OpenAPI và server tests.
Do not change: CreateRepairIntake atomic semantics, tag feature c2-005, UI,
               diagnosis/quote/repair, public customer link hoặc C3 transition.
Completion criteria: typed upload/read/delete contract, validation,
                     authorization, item lock, orphan cleanup và tests pass.
```

## Product/technical rules

- Evidence gắn với `repair_order_item_id`, không gắn mơ hồ chỉ với order.
- Stage bắt buộc là `before_repair`.
- `CreateRepairIntake` không nhận binary file và không thay đổi thành multipart.
- UI tạo order trước, sau đó upload từng ảnh bằng item id.
- Ảnh hợp lệ phải là JPG/JPEG hoặc PNG, tối đa 1 MB/ảnh và tối đa 5 ảnh chưa
  bị xóa trên mỗi item.
- Server tự tính SHA-256 checksum; checksum client gửi nếu có chỉ là hint để
  tối ưu, không phải nguồn tin cậy.
- File nằm trong private S3-compatible Object Storage; không lưu binary trong
  PostgreSQL hoặc thư mục local của API làm nguồn chính.
- Local development dùng MinIO qua Docker volume và bucket private
  `repairflow-private`; production provider được cấu hình qua endpoint/secret,
  không hard-code trong feature.
- Read access dùng signed URL ngắn hạn hoặc access response tương đương.
- Workspace, session, capability và assignment/responsibility được enforce ở API.
- Không để lại metadata/object mồ côi khi metadata transaction thất bại.
- API không trả object key nội bộ, storage credential hoặc public URL dài hạn.
- Không chuyển `received` → `diagnosing`; C3 vẫn quyết định evidence completion.

## C2 business decisions

- Mỗi item có một mô tả tổng tình trạng bắt buộc, lưu trong
  `repair_order_items.handover_condition`; text được phép có newline.
- C2 không lưu caption, `shot_type`, `important flag`, EXIF/GPS hoặc ảnh đã
  chỉnh sửa. Guided shot suggestions chỉ là UI hint.
- Actor có quyền xem phiếu được xem evidence. Actor có quyền xử lý phiếu được
  upload/xóa khi item chưa khóa; người tạo intake tiếp tục được thao tác khi
  chưa có Technician nhận bàn giao.
- Khi Technician thực hiện hành động **xác nhận nhận bàn giao** cho một item,
  API ghi `evidence_locked_at`/`evidence_locked_by` và từ chối upload, xóa hoặc
  ghi đè ảnh của item đó. Assignment đơn thuần không tự khóa.
- Xóa ảnh trước khi khóa là soft delete metadata/audit; object sẽ được cleanup,
  không hard-delete record evidence trong luồng nghiệp vụ thường.
- Lock theo từng item, không lock toàn bộ order. Full intake baseline vẫn có
  mốc khóa riêng khi order chuyển `received` → `diagnosing`.

## Evidence metadata

Reuse `repair_evidence` schema/contract nếu đã có; nếu chưa có thì tạo migration
mới, không sửa migration lịch sử:

```text
repair_evidence
- id
- workspace_id
- repair_order_item_id
- stage = before_repair
- object_key/private object reference
- original_filename
- mime_type
- size
- checksum
- created_by
- created_at
- deleted_at nullable
- deleted_by nullable
- idempotency_key
```

Implementation note: `idempotency_key` supports retry conflict detection and
`deleted_by` preserves the actor for soft-delete audit. Item lock state is stored
on `repair_order_items` as `evidence_locked_at`/`evidence_locked_by`.

Mô tả tổng tình trạng dùng field `handoverCondition` hiện có của item. Khi
client yêu cầu evidence upload, API phải trả lỗi rõ nếu item chưa có mô tả tổng;
không tạo thêm cột trùng nghĩa.

## Storage decision and upload transaction

Use the existing private Object Storage boundary with an S3-compatible adapter.
The C2 local runtime may add a MinIO service and named volume to
`docker-compose.yml`; production provider selection remains deployment-specific.

Object key shape:

```text
workspaces/{workspaceId}/repair-orders/{orderId}/items/{itemId}/evidence/before-repair/{evidenceId}.{extension}
```

The original filename is metadata only. Upload flow:

1. API validates access, item state, count, MIME/extension and size.
2. API streams the file to the storage port and calculates server-side SHA-256.
3. API checks `(repair_order_item_id, stage, checksum)` for an active duplicate;
   duplicate retry returns the existing evidence and creates no new row.
4. API inserts metadata in PostgreSQL with `object_key`, size, MIME, checksum,
   creator and timestamps.
5. If metadata insertion fails, API deletes the just-created object. A cleanup
   failure must be observable and must not be reported as a successful upload.
6. Read access authorizes first, then returns safe metadata and a short-lived
   signed GET URL. The signed URL is never persisted as the canonical file URL.

For the C2 file size (<= 1 MB), use a single backend-mediated upload. Do not
introduce browser-direct presigned upload complexity into this slice; keep the
storage port replaceable for a later large-file plan.

## API contract

Freeze trong OpenAPI trước khi code, theo envelope/request ID hiện có:

```text
POST   /api/repair-order-items/{itemId}/evidence
GET    /api/repair-order-items/{itemId}/evidence
DELETE /api/repair-order-items/{itemId}/evidence/{evidenceId}
GET    /api/evidence/{evidenceId}/access
POST   /api/repair-order-items/{itemId}/evidence-lock
```

Upload request gồm file và optional client checksum. Stage được server cố định là
`before_repair`; không nhận caption hoặc shot type trong C2. Request cần
`Idempotency-Key` để retry an toàn. Response chỉ trả safe metadata, không lộ
storage key nội bộ.

`POST .../evidence-lock` là command idempotent cho Technician xác nhận nhận bàn
giao item. Command chỉ ghi `evidence_locked_at`/`evidence_locked_by`, không đổi
status sang `diagnosing` và không thay thế C3 checklist/transition.

Upload rules:

- item phải thuộc order và workspace của access context;
- actor phải có capability ghi evidence và assignment hợp lệ nếu là Technician;
- item phải có `handover_condition` không rỗng;
- item chưa có `evidence_locked_at`;
- duplicate retry theo server checksum/request key không tạo bản ghi duplicate;
- delete evidence không phải delete order, chỉ soft-delete trước khi item lock
  và phải có audit;
- signed access hết hạn, không usable như public URL.

## Implementation sequence

- [x] Audit schema và migration runner.
- [x] Freeze DTO/error code/upload sequence.
- [x] Tạo feature-local evidence port/service/repository.
- [x] Add/configure local MinIO private bucket boundary without committing secrets.
- [x] Implement validation, private write, metadata transaction và cleanup.
- [x] Implement workspace/capability/assignment authorization.
- [x] Implement item handover-acceptance lock and lock-aware authorization.
- [x] Implement signed read access ngắn hạn.
- [x] Thêm migration nếu cần, clean run/idempotent rerun.
- [x] Viết OpenAPI, contract/security/regression tests.
- [x] Ghi handoff cho c2-008: tạo order trước, upload sau, retry từng ảnh.

## Current implementation evidence

- `dotnet build src/server/RepairFlow.sln --no-restore`: pass.
- `dotnet test tests/server/RepairFlow.Api.Tests/RepairFlow.Api.Tests.csproj
  --no-restore`: 73/73 pass, including evidence validation, idempotency,
  lock behavior, OpenAPI paths and secret/object-key projection checks.
- Migration `20260921_0007` applied successfully and rerun idempotently.
- `docker compose --env-file .env.example config --quiet`: pass.
- Runtime MinIO upload/read/delete smoke test and c2-008 UI acceptance remain
  pending; therefore this plan stays `IN PROGRESS`, not `DONE`.

## Testing plan

- [ ] Upload một ảnh và nhiều ảnh trên đúng item.
- [ ] Reject MIME/extension ngoài JPG/JPEG/PNG, ảnh > 1 MB và ảnh thứ 6.
- [ ] Thiếu mô tả tổng bị từ chối rõ ràng.
- [ ] Multi-line `handover_condition` được giữ nguyên khi đọc lại.
- [ ] MIME/extension/size/checksum invalid bị từ chối.
- [ ] Cross-workspace, expired session, forbidden actor bị từ chối.
- [ ] Signed read access hết hạn.
- [ ] Metadata transaction lỗi không để orphan object/record.
- [ ] Retry cùng checksum/idempotency key không tạo duplicate.
- [ ] Upload/delete bị từ chối sau khi Technician xác nhận nhận bàn giao.
- [ ] Delete trước lock ẩn record khỏi read list và cleanup object theo policy.
- [ ] Normal DTO/log/error không chứa plaintext hoặc storage key nhạy cảm.
- [ ] Existing c2-001 regression vẫn pass.

## Acceptance criteria

- [ ] Có API typed để c2-008 upload `before_repair` sau khi order tồn tại.
- [ ] Một item nhận tối đa 5 ảnh JPG/JPEG/PNG, mỗi ảnh <= 1 MB.
- [ ] Evidence gắn đúng item trong order nhiều thiết bị.
- [ ] Evidence private, có workspace boundary và signed access ngắn hạn.
- [ ] Mô tả tổng thiếu bị từ chối ở evidence boundary.
- [ ] Evidence lock theo item sau Technician handover acceptance.
- [ ] Storage provider được thay thế qua adapter mà không đổi API contract.
- [ ] Không nhúng binary vào `CreateRepairIntake`.
- [ ] Không chuyển status sang `diagnosing`.
