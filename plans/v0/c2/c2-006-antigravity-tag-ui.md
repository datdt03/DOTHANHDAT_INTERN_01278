# C2-006 — Antigravity tag picker và quản lý tag trong intake

Plan ID: c2-006

Title: UX/UI chọn nhiều tag và quản lý workspace tag trong repair intake

Owner: Antigravity

Status: READY

Revision: 1

Depends on: c2-002-antigravity-customer-area.md,
             c2-004-antigravity-repair-order-area.md,
             c2-005-codex-workspace-tag-api.md

Produces: Tag picker nhiều lựa chọn trên từng repair item, create/rename/delete
          interaction và tag projection trong order list/detail.

Consumed by: c2-009 vertical acceptance và C9 filtering

## Quy tắc phạm vi

Customer directory read-only không còn là slice active của C2. Nhu cầu đó được
defer về C9/plan vận hành sau; không dùng c2-006 để tạo lại Customer → Device →
Order navigation.

## Task context

```text
Goal: Cho nhân viên chọn nhiều tag tự do trên từng thiết bị và quản lý catalog
      tag chung của workspace bằng UI rõ ràng.
Feature: repair-intake-workflow tag picker và repair-order-area tag projection
Read first: src/ui/AGENTS.md, c2-002, c2-004, c2-005,
            docs/v0/06-ui-requirements.md.
Allowed to change: repair-intake-workflow, repair-order-area tag rendering,
                    typed UI adapter, route tối thiểu và tests UI.
Do not change: backend authorization, database, photo/evidence UI, global shell,
               customer directory, role-specific HTML hoặc direct fetch trong
               component.
Completion criteria: item chọn được nhiều tag từ workspace catalog; create,
                     rename và delete-unreferenced có state/error rõ ràng.
```

## UX contract

- Tag picker nằm trong Giai đoạn 2, bên trong từng repair item.
- Có search/autocomplete, multi-select, remove chip và create tag mới.
- Tag mới tạo qua typed adapter `POST /api/tags`, sau đó được chọn ngay.
- Review Giai đoạn 3 hiển thị tags theo thứ tự ổn định.
- Order detail hiển thị tags theo từng item; không gộp tags của nhiều thiết bị.
- Tag đang được dùng khi delete phải hiển thị thông báo rõ: không thể xóa vì đã
  được tham chiếu; không âm thầm bỏ khỏi phiếu cũ.
- Rename cập nhật catalog và các projection sau reload.
- Không dùng tag để hiển thị hoặc suy luận workflow status.
- Display language 100% tiếng Việt, màu/chip tuân thủ chuẩn 85/15 và không lạm
  dụng icon/emoji.

## Required states

- Loading khi nạp catalog.
- Empty khi workspace chưa có tag, có CTA `Tạo tag đầu tiên`.
- Search miss có copy rõ và CTA tạo tag mới.
- Create/rename success và error/retry.
- Delete success khi unreferenced.
- Delete conflict khi `TAG_IN_USE`.
- Forbidden/session expired/unavailable/preview.
- Keyboard navigation, focus return, accessible labels và responsive/zoom.

## Implementation sequence

- [ ] Tạo typed tag adapter theo API contract c2-005.
- [ ] Thêm tag state riêng cho mỗi `RepairItemDraft`, không dùng global/localStorage.
- [ ] Render picker trong item form và tags trong review.
- [ ] Thêm create/rename/delete interaction với confirmation phù hợp.
- [ ] Gửi `tagIds[]` đúng item trong intake payload.
- [ ] Render tags trong order detail/list khi DTO có `tags[]`.
- [ ] Không gửi tên tag tùy ý thay cho id đã được backend cấp.
- [ ] Viết checklist UI độc lập với global shell.

## Testing plan

- [ ] Chọn một tag và nhiều tag trên một item.
- [ ] Hai item chọn các tag khác nhau, không bị trộn state.
- [ ] Tạo tag mới, chọn ngay và giữ sau review/back/forward.
- [ ] Rename phản ánh đúng sau reload.
- [ ] Delete unused thành công.
- [ ] Delete referenced hiển thị conflict và không mất assignment.
- [ ] Workspace/API error không làm mất dữ liệu local chưa submit.
- [ ] Preview là read-only.
- [ ] Keyboard/focus, viewport 1440×1024, 768×1024 và mobile.
- [ ] Không có direct fetch, database access hoặc permission inference trong component.

## Acceptance criteria

- [ ] Nhân viên tạo phiếu chọn được nhiều tag cho từng thiết bị.
- [ ] Các nhân viên trong cùng workspace thấy cùng catalog tag.
- [ ] Tag của item A không xuất hiện nhầm trên item B.
- [ ] UI phản ánh đúng hard-delete guard từ API.
- [ ] Order list/detail hiển thị tags an toàn, không làm thay đổi status.
- [ ] Không tạo thêm customer directory hoặc CRUD flow ngoài phạm vi.
