# C2-005 — Codex workspace tag catalog, assignments và lifecycle lock

Plan ID: c2-005

Title: Backend/API cho nhãn dùng chung theo workspace, nhiều nhãn trên thiết bị
       và khóa chỉnh sửa theo giai đoạn sửa chữa

Owner: Codex

Status: DONE — implementation and verification complete

Revision: 2

Depends on: c2-001-codex-customer-device-order-api.md

Produces: Workspace tag catalog, tag lifecycle API, repair-item tag assignments,
          assignment mutation trước giai đoạn kỹ thuật và intake contract mở
          rộng bằng `tagIds`.

Consumed by: c2-006 tag UI, c2-009 vertical acceptance, C9 filtering

## Quy tắc không thay đổi lịch sử

Đây là plan mới thay cho nội dung acceptance cũ của c2-005. Không sửa plan
c2-000/c2-001 và không sửa migration lịch sử. Mọi database change phải là
migration SQL mới theo sequence kế tiếp.

## Task context

```text
Goal: Cung cấp tag tự do nhưng có kiểm soát theo workspace; một repair item có
      thể có nhiều tag và tag đang được tham chiếu không thể bị xóa.
Feature: RepairTag / workspace-tag-catalog
Read first: src/server/AGENTS.md, c2-001, docs/v0/05-database-requirements.md,
            docs/v0/07-authentication-and-authorization.md và current access policy.
Allowed to change: new RepairTag feature, new SQL migration, RepairOrder intake
                    contract/application/repository projection, OpenAPI và tests.
Do not change: completed c2-000/c2-001 plan files, customer/device rules,
               evidence storage, diagnosis/quote/repair behavior hoặc UI.
Completion criteria: workspace-scoped tag CRUD, inline-create-compatible
                     multi-tag assignment, pre-repair assignment mutation,
                     hard-delete guard, lifecycle lock và API tests pass.
```

## Product rules

- Tag gắn vào `RepairOrderItem`, là thiết bị/sản phẩm thực tế được tiếp nhận.
- Một item có nhiều tag; một tag dùng được cho nhiều item.
- Tag catalog dùng chung trong workspace, không phụ thuộc người tạo.
- API catalog phải hỗ trợ UI tạo nhãn ngay trong ô tìm kiếm; UI không cần đi qua
  một trang quản lý riêng để tạo nhãn.
- Tag name trim và normalize; `Android`, `android` và ` android ` không tạo
  duplicate logic.
- Tên nhãn là Unicode 1–64 ký tự sau khi trim; cho phép tiếng Việt, dấu, số,
  khoảng trắng, gạch ngang và gạch dưới; không nhận control character hoặc
  xuống dòng.
- Đổi tên tag giữ nguyên tất cả assignment lịch sử.
- Không có soft delete hoặc `deleted_at`.
- Tag còn bất kỳ assignment nào không được xóa; trả `409 TAG_IN_USE`.
- Tag không có assignment được hard-delete trong transaction.
- Không tạo order-level tag trong plan này.
- Assignment trên repair item được thêm/xóa khi order còn ở trạng thái
  `received`. Khi order chuyển sang giai đoạn kỹ thuật (`diagnosing`) hoặc
  bất kỳ trạng thái sau đó, assignment trở thành read-only; backend là nơi
  quyết định và trả `409 TAG_ASSIGNMENT_LOCKED`.
- Backend là authority cho workspace/capability; UI không được tự quyết định.

## Data model

Tạo migration mới, dùng sequence kế tiếp sau migration hiện tại:

```text
workspace_tags
- id uuid primary key
- workspace_id uuid not null
- name text not null
- normalized_name text not null
- created_by uuid not null
- created_at timestamptz not null
- updated_at timestamptz not null
- unique(workspace_id, normalized_name)

repair_order_item_tags
- repair_order_item_id uuid not null
- tag_id uuid not null
- created_by uuid not null
- created_at timestamptz not null
- primary key(repair_order_item_id, tag_id)
- foreign key(tag_id) references workspace_tags(id) on delete restrict
```

Không sửa migration `20260917_*` hoặc `20260918_*`. Nếu schema thực tế đã có
phần tương đương, ghi rõ reuse/compatibility trong evidence thay vì tạo bảng
trùng.

## API contract

```text
GET    /api/tags?query=&includeUnused=
POST   /api/tags                 { name }
PATCH  /api/tags/{tagId}         { name }
DELETE /api/tags/{tagId}
PUT    /api/repair-orders/{orderId}/items/{itemId}/tags
                                  { tagIds: [] }
```

Rules:

- Workspace lấy từ access context hiện tại, không tin workspace id do client gửi.
- `POST` trim/normalize và duplicate theo normalized name trả `409 TAG_NAME_EXISTS`
  kèm `existingTagId`/safe existing tag để UI có thể tự chọn nhãn đã tồn tại.
- `PATCH` re-check unique trong cùng workspace và cũng trả `409 TAG_NAME_EXISTS`.
- Tên nhãn hợp lệ dài 1–64 Unicode ký tự sau khi trim; validation lỗi dùng
  `TAG_NAME_REQUIRED`, `TAG_NAME_TOO_LONG` hoặc `TAG_NAME_INVALID`.
- `DELETE` lock/check assignment trong transaction; có reference trả conflict,
  không reference mới hard-delete.
- `PUT .../tags` thay toàn bộ assignment của một repair item trong transaction;
  tag IDs phải thuộc workspace, được loại duplicate và trả `tags[]` trong
  projection. Operation chỉ thành công khi order còn `received`; trạng thái
  khác trả `409 TAG_ASSIGNMENT_LOCKED`.
- Quyền mặc định: Receptionist và Manager được đọc/tìm/tạo/gán nhãn khi còn
  `received`; Manager được đổi tên và xóa catalog. Nếu sản phẩm cần Receptionist
  đổi tên/xóa, phải cấp capability riêng và test rõ, không suy luận ở UI.
- `GET /api/tags` tìm không phân biệt hoa thường; exact match đứng trước prefix,
  prefix đứng trước contains; danh sách rỗng query sắp xếp theo
  `normalized_name ASC` với thứ tự ổn định.
- Tất cả response dùng envelope, request ID, safe DTO và error code hiện có.
- Mọi endpoint enforce active session, workspace và capability server-side.

Mở rộng `POST /api/repair-orders/intake`:

```json
{
  "repairItems": [
    {
      "tagIds": ["tag-android", "tag-screen-damaged"]
    }
  ]
}
```

Backend phải kiểm tra tag thuộc workspace, loại duplicate trong cùng item, lưu
assignment cùng transaction với order và trả `tags[]` trong safe `RepairItemDto`.
Tag được tạo qua catalog endpoint trước khi submit intake; không tự tạo tag từ
chuỗi tùy ý bên trong command nếu chưa có policy riêng.

Assignment sau intake dùng `PUT /api/repair-orders/{orderId}/items/{itemId}/tags`
và phải kiểm tra lại workspace, item thuộc order, capability của actor và
trạng thái khóa. Không dùng UI để quyết định nhãn đã bị khóa hay chưa.

## Implementation sequence

- [x] Audit schema/migration runner và freeze normalized-name policy.
- [x] Tạo migration workspace tag + item assignment.
- [x] Tạo feature-local domain/application/infrastructure/API; không tạo
      `Features/C2`, `C2Models.cs`, `IC2Repository.cs`.
- [x] Implement list/create/rename/delete guard.
- [x] Freeze name validation, duplicate response và search/sort semantics trong
      OpenAPI.
- [x] Mở rộng intake command, normalization và transaction assignment.
- [x] Implement assignment replacement cho repair item khi order còn `received`;
      khóa từ `diagnosing` trở đi.
- [x] Thêm tags vào order/item safe projections.
- [x] Cập nhật OpenAPI examples và structured errors.
- [x] Chạy migration clean/idempotent rerun.

## Testing plan

- [x] Workspace A không đọc/sửa/xóa tag của workspace B.
- [x] Case/whitespace duplicate không tạo bản ghi thứ hai.
- [x] Một item có nhiều tag; assignment duplicate bị chặn.
- [x] Nhiều item dùng chung một tag.
- [x] Assignment có thể thêm/xóa trên item đã tạo khi order còn `received`.
- [x] Assignment bị khóa từ `diagnosing` trở đi và trả `409 TAG_ASSIGNMENT_LOCKED`.
- [x] Đổi tên giữ assignment.
- [x] Xóa tag đang được dùng trả `409 TAG_IN_USE`, dữ liệu vẫn còn.
- [x] Xóa tag không có reference hard-delete thành công.
- [x] Duplicate create/rename trả `409 TAG_NAME_EXISTS` và không tạo bản ghi thứ hai.
- [x] Tên dài hơn 64 ký tự, rỗng hoặc chứa control character bị từ chối.
- [x] Search exact/prefix/contains và sort theo normalized name ổn định.
- [x] Tag id workspace khác trong intake bị từ chối.
- [x] Permission/session/assignment denial và safe error envelope.
- [x] Existing c2-001 intake regression vẫn pass.

## Acceptance criteria

- [x] Nhân viên có quyền intake tạo và dùng tag tự do trong workspace.
- [x] Một repair item có nhiều tag.
- [x] Tag được dùng chung bởi các nhân viên cùng workspace.
- [x] Tag đang có reference không thể xóa.
- [x] Tag không có reference được xóa cứng.
- [x] Assignment của item chỉ sửa được trước giai đoạn kỹ thuật.
- [x] API trả tags trong item projection để UI hiển thị.
- [x] Không thay đổi business rule hoặc migration lịch sử.

## Completion evidence

- Migration `20260921_0006__spec-v0__create-workspace-tags-and-assignments.sql`
  tạo catalog tag theo workspace và bảng assignment với `ON DELETE RESTRICT`.
- Backend feature `Features/RepairTag` cung cấp catalog CRUD, normalize/duplicate
  policy, workspace isolation, hard-delete guard và assignment lifecycle lock.
- Intake và order detail projections trả `tags[]`; item tag hydration dùng query
  batch sau khi đóng reader thiết bị, tránh `NpgsqlOperationInProgressException`.
- Nullable tag search parameter được khai báo kiểu PostgreSQL `text`; request
  cancellation được phân loại riêng trong exception middleware.
- Verification: `dotnet test` đạt `69/69`; OpenAPI/access/tag feature tests pass.
