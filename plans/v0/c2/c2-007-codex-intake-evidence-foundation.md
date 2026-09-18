# C2-007 — Codex intake evidence foundation

Plan ID: c2-007

Title: Codex evidence API, storage boundary và authorization cho ảnh hiện trạng

Owner: Codex

Status: READY

Revision: 1

Depends on: c2-001-codex-customer-device-order-api.md,
             c2-002-antigravity-customer-area.md

Produces: Evidence contract/API, private storage boundary, schema/migration nếu
          cần, authorization và backend tests cho ảnh `before_repair`

Consumed by: c2-008-antigravity-intake-evidence-ui.md,
             c2-009-shared-intake-evidence-acceptance.md và C3 intake/evidence

## Task context

```text
Goal: Cung cấp boundary backend để ảnh hiện trạng được thu từ intake UI và trở thành evidence private của repair order.
Feature: RepairOrder evidence foundation
Read first: AGENTS.md, src/server/AGENTS.md, docs/v0/02-use-cases.md,
            docs/v0/05-database-requirements.md, docs/v0/06-ui-requirements.md,
            plans/v0/c2/README.md, c2-001, c2-002
Allowed to change: src/server/RepairFlow.Api/Features/RepairOrder/,
                   Infrastructure/Database/Migrations/, tests/server/RepairFlow.Api.Tests/Features/RepairOrder/,
                   OpenAPI/evidence docs và plan evidence liên quan
Do not change: Customer/Device business rule, C2 atomic intake semantics,
               diagnosis/quote/repair behavior, public customer link, hoặc UI component
Completion criteria: typed evidence API và storage boundary có authorization,
                     private signed access, validation, migration nếu cần và tests pass.
```

## Goal

Tạo backend contract cho ảnh hiện trạng được chụp trong Giai đoạn 2. C2-007
không chuyển quyền sở hữu evidence completion sang C2: order vẫn được tạo ở
`received`, còn C3 sở hữu checklist/evidence completion và điều kiện chuyển sang
`diagnosing`.

## Decision boundary

- `CreateRepairIntake` của c2-001 tiếp tục là command tạo Customer/Device/
  RepairOrder atomic; không nhúng binary file vào request JSON hiện tại.
- Sau khi order tồn tại, evidence command nhận ảnh `before_repair` và gắn với
  `repair_order_id`.
- UI có thể thu file trong memory ở Giai đoạn 2, sau đó gọi evidence adapter sau
  response tạo order. Nếu upload lỗi, order vẫn ở `received` và UI phải cho retry;
  không hiển thị success hoàn tất evidence giả.
- C3 là owner của minimum-photo validation ở bước intake completion. C2-007 chỉ
  cung cấp metadata, upload/access primitive và lỗi có cấu trúc.

## Scope

- Freeze request/response/error contract cho upload ảnh evidence theo repair order.
- Hỗ trợ stage `before_repair`, MIME allow-list, kích thước tối đa, filename,
  checksum và caption/description.
- Lưu metadata vào `repair_evidence` và nội dung qua private object-storage
  boundary theo docs/v0/05; không trả public URL hoặc signed URL lâu hạn.
- Cấp signed read URL có thời hạn hoặc access response tương đương theo policy.
- Enforce workspace, active session, role/capability và assignment/responsibility
  cho thao tác ghi evidence.
- Không cho truy cập evidence của workspace khác hoặc order không thuộc policy.
- Dọn object tạm khi metadata transaction thất bại và không tạo orphan record.
- Migration chỉ tạo/sửa phần schema còn thiếu; không sửa migration đã chạy.
- OpenAPI, request ID, response envelope và API tests.

## Out of scope

- React capture/upload UI và camera UX của c2-008.
- Checklist chi tiết, minimum-photo completion và transition sang `diagnosing` của C3.
- Diagnosis, quote, repair, QC, handover hoặc customer public link.
- Nhúng file binary vào `CreateRepairIntake` hiện tại.
- Public object URL, client-side permission enforcement hoặc lưu file vào localStorage.
- Tự thêm storage service ngoài boundary đã được product/docs phê duyệt.

## Input files

- `docs/v0/05-database-requirements.md` sections `evidence_stage`,
  `repair_evidence`, private object storage và retention.
- `docs/v0/06-ui-requirements.md` Stage 2 và section 6.4.
- `src/server/RepairFlow.Api/Features/RepairOrder/` hiện tại.
- `src/server/RepairFlow.Api/Features/Access/Application/AuthorizationPolicy.cs`.
- Migration runner và migration test fixtures hiện có.

## Files to write or update

- [ ] RepairOrder evidence domain/application contract theo feature-first structure.
- [ ] RepairOrder evidence API endpoint/adapter boundary.
- [ ] Private storage port và development/test double nếu boundary hiện tại chưa có.
- [ ] SQL migration mới nếu `repair_evidence` contract chưa được triển khai.
- [ ] OpenAPI contract tests và RepairOrder evidence tests.
- [ ] Plan/API handoff notes consumed by c2-008 and c2-009.

## Step-by-step implementation

- [ ] Kiểm tra schema hiện có và đối chiếu `repair_evidence` với docs/v0/05.
- [ ] Freeze endpoint, DTO, error codes và upload/access sequence trước khi code.
- [ ] Tạo feature-local evidence port/service trong RepairOrder, không tạo C2 repository chung.
- [ ] Implement MIME, size, filename và checksum validation server-side.
- [ ] Implement private storage write/delete-on-failure và metadata transaction.
- [ ] Implement workspace/capability/assignment authorization cho receptionist,
      manager/owner và technician theo responsibility được cấp.
- [ ] Implement signed read access có thời hạn; không expose object key ngoài safe DTO.
- [ ] Thêm migration theo SQL-first convention nếu cần.
- [ ] Cập nhật OpenAPI và chạy backend regression/evidence tests.
- [ ] Ghi rõ c2-008 sequence: tạo order trước, upload evidence sau, retry khi upload lỗi.

## Testing plan

- [ ] Upload ảnh hợp lệ và metadata đúng.
- [ ] MIME, extension, size và checksum không hợp lệ bị từ chối.
- [ ] Workspace isolation và forbidden/expired session.
- [ ] Receptionist chỉ ghi trong intake responsibility được phép.
- [ ] Signed read access hết hạn và không dùng public URL.
- [ ] Metadata transaction lỗi không để lại record/object mồ côi.
- [ ] Retry cùng request không tạo evidence duplicate ngoài policy.
- [ ] Migration clean run/idempotent rerun nếu có migration mới.
- [ ] OpenAPI/envelope/request ID và toàn bộ RepairOrder regression tests.

## Acceptance criteria

- [ ] Có contract/API typed để c2-008 upload ảnh `before_repair` sau khi order tồn tại.
- [ ] Evidence private, có signed access ngắn hạn và giữ workspace boundary.
- [ ] File được kiểm tra MIME/size/checksum trước khi ghi metadata hợp lệ.
- [ ] Không thay đổi `CreateRepairIntake` atomic contract ngoài phần handoff đã ghi rõ.
- [ ] Không chuyển order sang `diagnosing` trong C2-007.
- [ ] Backend tests và OpenAPI tests pass.

## Change impact

C2-007 mở backend foundation cho photo handoff nhưng không làm C2 sở hữu toàn bộ
C3 evidence workflow. c2-008 chỉ được bắt đầu sau khi contract và storage boundary
này được kiểm chứng.
