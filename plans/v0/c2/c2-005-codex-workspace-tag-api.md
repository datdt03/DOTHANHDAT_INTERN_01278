# C2-005 — Codex workspace tag catalog và repair-item assignments

Plan ID: c2-005

Title: Backend/API cho tag dùng chung theo workspace và nhiều tag trên thiết bị

Owner: Codex

Status: READY

Revision: 1

Depends on: c2-001-codex-customer-device-order-api.md

Produces: Workspace tag catalog, tag lifecycle API, repair-item tag assignments
          và intake contract mở rộng bằng `tagIds`.

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
Completion criteria: workspace-scoped tag CRUD, multi-tag assignment, hard-delete
                     guard và API tests pass.
```

## Product rules

- Tag gắn vào `RepairOrderItem`, là thiết bị/sản phẩm thực tế được tiếp nhận.
- Một item có nhiều tag; một tag dùng được cho nhiều item.
- Tag catalog dùng chung trong workspace, không phụ thuộc người tạo.
- Tag name trim và normalize; `Android`, `android` và ` android ` không tạo
  duplicate logic.
- Đổi tên tag giữ nguyên tất cả assignment lịch sử.
- Không có soft delete hoặc `deleted_at`.
- Tag còn bất kỳ assignment nào không được xóa; trả `409 TAG_IN_USE`.
- Tag không có assignment được hard-delete trong transaction.
- Không tạo order-level tag trong plan này.
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
```

Rules:

- Workspace lấy từ access context hiện tại, không tin workspace id do client gửi.
- `POST` trim/normalize và xử lý duplicate theo error hoặc idempotent policy đã
  được freeze trong OpenAPI; không tạo hai tag logic giống nhau.
- `PATCH` re-check unique trong cùng workspace.
- `DELETE` lock/check assignment trong transaction; có reference trả conflict,
  không reference mới hard-delete.
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

## Implementation sequence

- [ ] Audit schema/migration runner và freeze normalized-name policy.
- [ ] Tạo migration workspace tag + item assignment.
- [ ] Tạo feature-local domain/application/infrastructure/API; không tạo
      `Features/C2`, `C2Models.cs`, `IC2Repository.cs`.
- [ ] Implement list/create/rename/delete guard.
- [ ] Mở rộng intake command, normalization và transaction assignment.
- [ ] Thêm tags vào order/item safe projections.
- [ ] Cập nhật OpenAPI examples và structured errors.
- [ ] Chạy migration clean/idempotent rerun.

## Testing plan

- [ ] Workspace A không đọc/sửa/xóa tag của workspace B.
- [ ] Case/whitespace duplicate không tạo bản ghi thứ hai.
- [ ] Một item có nhiều tag; assignment duplicate bị chặn.
- [ ] Nhiều item dùng chung một tag.
- [ ] Đổi tên giữ assignment.
- [ ] Xóa tag đang được dùng trả `409 TAG_IN_USE`, dữ liệu vẫn còn.
- [ ] Xóa tag không có reference hard-delete thành công.
- [ ] Tag id workspace khác trong intake bị từ chối.
- [ ] Permission/session/assignment denial và safe error envelope.
- [ ] Existing c2-001 intake regression vẫn pass.

## Acceptance criteria

- [ ] Nhân viên có quyền intake tạo và dùng tag tự do trong workspace.
- [ ] Một repair item có nhiều tag.
- [ ] Tag được dùng chung bởi các nhân viên cùng workspace.
- [ ] Tag đang có reference không thể xóa.
- [ ] Tag không có reference được xóa cứng.
- [ ] API trả tags trong item projection để UI hiển thị.
- [ ] Không thay đổi business rule hoặc migration lịch sử.
