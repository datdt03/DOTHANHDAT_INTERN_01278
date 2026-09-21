# C2-006 — Antigravity nhãn picker, inline-create và quản lý assignment

Plan ID: c2-006

Title: UX/UI chọn nhiều nhãn, tạo nhanh và quản lý nhãn trước giai đoạn sửa chữa

Owner: Antigravity

Status: DONE — implementation and verification complete

Revision: 2

Depends on: c2-002-antigravity-customer-area.md,
             c2-004-antigravity-repair-order-area.md,
             c2-005-codex-workspace-tag-api.md

Produces: Nhãn picker nhiều lựa chọn trên từng repair item, inline-create tự
          chọn, chỉnh sửa assignment trước giai đoạn kỹ thuật, create/rename/
          delete interaction và nhãn projection trong order list/detail.

Consumed by: c2-009 vertical acceptance và C9 filtering

## Quy tắc phạm vi

Customer directory read-only không còn là slice active của C2. Nhu cầu đó được
defer về C9/plan vận hành sau; không dùng c2-006 để tạo lại Customer → Device →
Order navigation.

## Task context

```text
Goal: Cho nhân viên chọn nhiều nhãn tự do trên từng thiết bị, tạo nhãn ngay
      trong ô tìm kiếm và chỉnh sửa assignment trước giai đoạn kỹ thuật bằng
      UI rõ ràng.
Feature: repair-intake-workflow tag picker và repair-order-area tag projection
Read first: src/ui/AGENTS.md, c2-002, c2-004, c2-005,
            docs/v0/06-ui-requirements.md.
Allowed to change: repair-intake-workflow, repair-order-area tag rendering,
                    typed UI adapter, route tối thiểu và tests UI.
Do not change: backend authorization, database, photo/evidence UI, global shell,
               customer directory, role-specific HTML hoặc direct fetch trong
               component.
Completion criteria: item chọn được nhiều nhãn từ workspace catalog; không tìm
                     thấy thì tạo được ngay và tự chọn; assignment chỉnh sửa
                     được trước giai đoạn kỹ thuật; create, rename và
                     delete-unreferenced có state/error rõ ràng.
```

## UX contract

- UI dùng từ **Nhãn**; `tag`, `tagIds` chỉ dùng trong code/API.
- Nhãn picker nằm trong Giai đoạn 2, bên trong từng repair item.
- Có search/autocomplete, multi-select, remove chip và create nhãn mới.
- Khi query không có kết quả và không rỗng, hiển thị `+ Tạo nhãn "{query}"`.
- Nhãn mới tạo qua typed adapter `POST /api/tags`, sau đó tự động được chọn ngay
  vào item đang thao tác; người dùng không phải đi qua trang quản lý nhãn.
- Nếu API trả `409 TAG_NAME_EXISTS`, reload/nhận existing tag và tự động chọn
  nhãn đã tồn tại thay vì hiển thị lỗi chết luồng.
- Review Giai đoạn 3 hiển thị nhãn theo thứ tự ổn định.
- Order detail hiển thị nhãn theo từng item; không gộp nhãn của nhiều thiết bị.
- Khi order còn `received`, detail có action `Chỉnh sửa nhãn` để thêm/xóa nhãn
  trên item đã tạo và gửi đúng assignment API.
- Khi order đã chuyển sang `diagnosing` hoặc sau đó, detail chỉ hiển thị nhãn;
  ẩn/disable action chỉnh sửa và vẫn xử lý `409 TAG_ASSIGNMENT_LOCKED` nếu
  backend từ chối thao tác cạnh tranh.
- Nhãn đang được dùng khi delete phải hiển thị thông báo rõ: không thể xóa vì
  đã được tham chiếu; không âm thầm bỏ khỏi phiếu cũ.
- Rename cập nhật catalog và các projection sau reload; confirmation phải nói
  rõ đổi tên sẽ ảnh hưởng mọi phiếu đang dùng nhãn đó.
- Không dùng nhãn để hiển thị hoặc suy luận workflow status.
- Display language 100% tiếng Việt, màu/chip tuân thủ chuẩn 85/15 và không lạm
  dụng icon/emoji.

## Required states

- Loading khi nạp catalog.
- Empty khi workspace chưa có nhãn, có CTA `Tạo nhãn đầu tiên`.
- Search miss có copy rõ và CTA tạo nhãn mới.
- Search miss có CTA tạo nhãn theo đúng nội dung đang nhập.
- Create/rename success và error/retry.
- Delete success khi unreferenced.
- Delete conflict khi `TAG_IN_USE`.
- Assignment update success/error khi order còn `received`.
- Assignment locked khi order đã vào `diagnosing` hoặc trạng thái sau đó.
- Forbidden/session expired/unavailable/preview.
- Keyboard navigation, focus return, accessible labels và responsive/zoom.

## Implementation sequence

- [x] Tạo typed tag adapter theo API contract c2-005.
- [x] Thêm nhãn state riêng cho mỗi `RepairItemDraft`, không dùng global/localStorage.
- [x] Render picker trong item form và nhãn trong review.
- [x] Render inline-create khi search miss; tự chọn kết quả create hoặc duplicate
      resolution.
- [x] Thêm create/rename/delete interaction với confirmation phù hợp.
- [x] Gửi `tagIds[]` đúng item trong intake payload.
- [x] Gọi assignment update API khi chỉnh sửa nhãn trên order detail còn `received`.
- [x] Khóa UI chỉnh sửa từ `diagnosing` trở đi nhưng vẫn hiển thị nhãn.
- [x] Render nhãn trong order detail/list khi DTO có `tags[]`.
- [x] Không gửi tên tag tùy ý thay cho id đã được backend cấp.
- [x] Viết checklist UI độc lập với global shell.

## Testing plan

- [x] Chọn một tag và nhiều tag trên một item.
- [x] Hai item chọn các tag khác nhau, không bị trộn state.
- [x] Tạo nhãn mới từ search miss, tự chọn ngay và giữ sau review/back/forward.
- [x] Duplicate create nhận existing tag và không tạo chip/bản ghi trùng.
- [x] Chỉnh sửa thêm/xóa nhãn trên detail khi order còn `received`.
- [x] Không cho chỉnh sửa nhãn từ `diagnosing` trở đi; xử lý conflict rõ ràng.
- [x] Rename phản ánh đúng sau reload và không mất assignment.
- [x] Delete unused thành công.
- [x] Delete referenced hiển thị conflict và không mất assignment.
- [x] Tên rỗng, quá 64 ký tự hoặc ký tự không hợp lệ hiển thị lỗi tại input.
- [x] Workspace/API error không làm mất dữ liệu local chưa submit.
- [x] Preview là read-only.
- [x] Keyboard/focus, viewport 1440×1024, 768×1024 và mobile.
- [x] Không có direct fetch, database access hoặc permission inference trong component.

## Acceptance criteria

- [x] Nhân viên tạo phiếu chọn được nhiều nhãn cho từng thiết bị.
- [x] Các nhân viên trong cùng workspace thấy cùng catalog nhãn.
- [x] Nhãn của item A không xuất hiện nhầm trên item B.
- [x] UI phản ánh đúng hard-delete guard từ API.
- [x] Order list/detail hiển thị nhãn an toàn, không làm thay đổi status.
- [x] Không tạo thêm customer directory hoặc CRUD flow ngoài phạm vi.

## Completion evidence

- Typed adapter, picker nhiều nhãn, inline-create và duplicate resolution nằm
  trong `src/ui/shared/api/repair-tag-api.ts` và
  `src/ui/features/repair-intake-workflow/`.
- Order detail/list và route quản lý nhãn đã tích hợp capability từ backend,
  lock theo trạng thái `received`, xử lý `TAG_ASSIGNMENT_LOCKED` và `TAG_IN_USE`.
- Checklist chi tiết: `tests/ui/repair-tags/repair-tag-picker-checklist.md` và
  `tests/ui/repair-tags/tag-management-checklist.md`.
- Verification: `npm run type-check` và `npm run build` trong `src/ui` đều pass.
