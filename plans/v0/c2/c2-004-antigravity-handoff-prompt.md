# C2-004 Antigravity handoff prompt — Repair-order area

> Đây là prompt triển khai cho Antigravity, không phải plan mới và không thay
> thế c2-004. Không sửa các plan `DONE`.

## Prompt

Bạn là Antigravity, phụ trách UX/UI React cho RepairFlow. Hãy triển khai đúng
phạm vi `c2-004`: **order list/detail area và entry point mở workflow tiếp nhận**.

### Bối cảnh bắt buộc

- Stack hiện tại: React 19.1.1, Vite 7.1.7, TypeScript 5.9.2.
- UI hiển thị 100% tiếng Việt.
- C2 dùng một `index.html`, một internal shell và các business area độc lập.
- C2-002 là workflow chính `repair-intake-workflow` gồm customer → device →
  review/confirm. Không tạo lại workflow Customer → Device → Order.
- C2-001 đã hoàn tất backend Customer/Device/RepairOrder và các contract list,
  detail, atomic intake. Không tự phát minh API hoặc DTO mới.
- C2-005/c2-006 sẽ phụ trách tag API và tag UI; c2-007/c2-008 sẽ phụ trách ảnh
  evidence. Không triển khai tag picker hoặc photo upload trong c2-004.

### Đọc trước khi sửa

1. `AGENTS.md`
2. `src/ui/AGENTS.md`
3. `plans/v0/c2/c2-004-antigravity-repair-order-area.md`
4. `plans/v0/c2/c2-002-antigravity-customer-area.md`
5. `src/ui/app/area-boundary.ts`
6. `src/ui/app/navigation.tsx`
7. `src/ui/app/role-entry.ts`
8. `src/server/RepairFlow.Api/Features/RepairOrder/Api/RepairOrderEndpoints.cs`
9. `src/server/RepairFlow.Api/Features/RepairOrder/Api/RepairOrderContracts.cs`
10. `src/ui/shared/components/index.ts` và các primitive hiện có.

Nếu server contract và plan khác nhau, dừng lại và ghi rõ conflict; không tự
đổi API để làm UI chạy.

## Mục tiêu trải nghiệm

Luồng chính:

```text
Phiếu sửa chữa
  → tìm/lọc phiếu
  → mở chi tiết phiếu
  → quay lại vẫn giữ ngữ cảnh tìm kiếm
  → Tạo phiếu tiếp nhận
  → hoàn tất intake workflow
  → Xem chi tiết phiếu vừa tạo
```

Người dùng luôn phải biết:

- đang xem phiếu nào;
- phiếu đang ở trạng thái nào;
- thiết bị/khách hàng nào liên quan;
- hành động tiếp theo là gì;
- dữ liệu đang tải, rỗng, lỗi hay bị hạn chế quyền.

Không dùng KPI dashboard hoặc nhiều card trang trí trong order area. Đây là màn
hình vận hành để tìm và mở phiếu nhanh.

## Thiết kế UX/UI cần triển khai

### A. Order list — desktop

Dùng layout:

```text
[Breadcrumb: Phiếu sửa chữa]
[Tiêu đề: Phiếu sửa chữa]                         [ + Tạo phiếu tiếp nhận ]
[Tìm mã phiếu, khách hàng, SĐT, thiết bị ] [Trạng thái] [Xóa bộ lọc]
[Tóm tắt số kết quả]
[Bảng danh sách phiếu]
```

Các cột chính:

- Mã phiếu: dùng `OrderCode`, là link tới detail.
- Khách hàng: tên + số điện thoại phụ.
- Thiết bị: item đầu tiên; nếu có nhiều item hiển thị `+N thiết bị`.
- Trạng thái: dùng `StatusBadge` và map sang tiếng Việt; không hiển thị raw
  enum như `waiting_for_approval`.
- Người phụ trách/nhân viên tiếp nhận nếu DTO có dữ liệu.
- Ngày tiếp nhận và ngày dự kiến hoàn thành nếu DTO có dữ liệu.
- Hành động nhỏ, rõ ràng: `Xem chi tiết`.

Không làm toàn bộ row thành một `div` click được. Có link/button thật, focus rõ,
keyboard hoạt động và accessible name có ngữ cảnh, ví dụ `Xem chi tiết phiếu RF-...`.

### B. Order list — mobile

Không cố ép bảng desktop trên màn hình 390px. Chuyển thành danh sách card:

```text
[RF-2026-0001] [Đã tiếp nhận]
Nguyễn Văn A · 090...
Apple iPhone 13 · +1 thiết bị
Nhận: 21/09/2026 · Hẹn: 28/09/2026
[Xem chi tiết]
```

Search nằm trên cùng. Filter trạng thái mở thành control full-width. Mỗi card có
một điểm nhấn chính, không dùng nhiều màu tag/status cạnh tranh nhau.

### C. Order detail

Layout desktop:

```text
[← Phiếu sửa chữa]  Phiếu RF-2026-0001                 [Đã tiếp nhận]
Nguyễn Văn A · 090...                                  Cập nhật ...

[Thông tin khách hàng]        [Tóm tắt tiếp nhận]

[Thiết bị #1] [Thiết bị #2] ...
[Thông tin thiết bị đang chọn]
[Lỗi khách mô tả]
[Tình trạng khi nhận / phụ kiện / ghi chú]

[Lịch sử tối thiểu hoặc trạng thái hiện tại nếu API đã cung cấp]
```

Chi tiết cần có:

- Header có breadcrumb, order code, status, ngày nhận và customer summary.
- Multi-device dùng tab hoặc segmented navigation theo item; mỗi item phải có
  `aria-selected`, tên dễ hiểu và số thứ tự ổn định.
- Dùng summary-list/key-value cho các cặp thông tin; không dùng bảng cho một
  nhóm metadata đơn giản.
- Hiển thị reported issue và handover summary vì đây là bằng chứng đầu vào của
  quy trình.
- Credential/passcode không được hiển thị trong order detail thông thường.
- Không hiển thị nút Diagnosis/Quote/Repair/QC nếu contract C3/C4 chưa tồn tại.
  Có thể để vùng nội dung `Bước tiếp theo sẽ được mở sau khi tiếp nhận` nếu
  cần định hướng, nhưng không tạo success giả hoặc action giả.
- Khu vực tags/evidence có thể để slot component rõ ràng cho các plan sau, nhưng
  c2-004 không gọi tag/evidence API và không tạo mock data giả.

### D. Entry point và điều hướng

- `#/orders` render order list.
- `#/orders/{orderId}` render order detail.
- `#/repair-intake/new` vẫn là route duy nhất để tạo phiếu.
- Nút `Tạo phiếu tiếp nhận` ở list gọi đúng route intake.
- `IntakeReviewStep` sau khi tạo thành công gọi `onNavigateToOrder(order.id)`.
- Khi quay lại list từ detail, cố gắng giữ query/filter/search context nếu router
  hiện tại hỗ trợ; không dùng localStorage để lưu business state.

## Contract chính và nơi cần sửa

### 1. Area mount

Đã có contract trong `src/ui/app/area-boundary.ts`:

```ts
interface C2AreaMountProps {
  context: AreaMountContext;
  onNavigate: (area: C2AreaId, resourceId?: string) => void;
}
```

`repair-order-area` đã có trong `C2_AREA_IDS`. Không tạo type area mới và không
import `RoleAwareNavigationShell` vào feature.

### 2. Route mount

Sửa tối thiểu `src/ui/app/navigation.tsx`:

- import `RepairOrderArea`;
- nhận diện `#/orders` và `#/orders/{id}`;
- tạo `AreaMountContext` từ session hiện tại;
- truyền `context`, `onNavigate`, `initialOrderId` và `previewMode` nếu component
  cần;
- dùng chung `handleNavigate`, không nhân bản route logic cho từng feature.

Kiểm tra `src/ui/app/role-entry.ts`:

- `#/orders` đã là allowed route của manager/owner/receptionist;
- thêm normalize cho `#/orders/{id}` về base route `#/orders` nếu cần để detail
  không bị chặn nhầm ở client presentation boundary;
- không cấp thêm quyền mới ở UI và không dùng route allow-list thay cho backend.

Chỉ sửa `src/ui/app/routes.tsx` nếu kiểm tra thực tế cho thấy route boundary
hiện tại cần biết order route. Không refactor router toàn cục.

### 3. API adapter

Tạo `src/ui/features/repair-order-area/repair-order-api.ts` hoặc adapter ở
boundary hiện có, nhưng trước tiên đọc OpenAPI/server contract chính xác.

Adapter cần có dạng tương đương:

```ts
interface RepairOrderApi {
  listOrders(query: RepairOrderListQuery): Promise<RepairOrderListResult>;
  getOrder(orderId: string): Promise<RepairOrderDetailDto>;
}
```

Tên field/query phải lấy từ API hiện có. Không tự thêm endpoint, status enum,
pagination hay response shape chỉ để thuận tiện cho UI.

API adapter phải:

- dùng `createApiClient`;
- đưa request ID/error code qua `ApiClientError` hiện có;
- không gọi `fetch` trực tiếp trong component;
- không fallback sang mock khi live API trả lỗi;
- preview mode chỉ đọc và có trạng thái rõ ràng.

### 4. Feature files

Tạo tối thiểu:

```text
src/ui/features/repair-order-area/
├── repair-order-area.tsx          # primary mount
├── repair-order-area.css
├── repair-order-api.ts
├── repair-order-list.tsx          # tách nếu primary file vượt khoảng 250 dòng
└── repair-order-detail.tsx        # tách nếu cần
```

Tests/checklist:

```text
tests/ui/repair-order/repair-order-area-checklist.md
tests/ui/repair-order/...
```

Tái sử dụng `PageHeader`, `DataTable`, `StatusBadge`, `OrderCode`,
`SkeletonLoader`, `EmptyState`, `Alert`, `CardPanel` từ
`src/ui/shared/components`. Chỉ tạo shared component mới nếu có ít nhất hai
consumer thực tế.

## State matrix bắt buộc

| State | UI cần thể hiện |
|---|---|
| Loading | Skeleton cho header/filter/table hoặc detail |
| Ready | Dữ liệu thật, action đúng quyền |
| Empty | Không có phiếu; CTA `Tạo phiếu tiếp nhận` |
| Search miss | Nói rõ không có kết quả và nút xóa bộ lọc |
| Error | Message tiếng Việt + `Thử lại`, giữ query hiện tại |
| Unavailable/preview | Read-only, không giả tạo dữ liệu ghi thật |
| Forbidden | Không render protected detail cũ; link về khu vực hợp lệ |
| Expired session | Hiển thị session state của app, không lộ dữ liệu cũ |
| Detail not found | Mã phiếu không tồn tại + quay về danh sách |
| Multi-item | Item switcher, không gộp nhầm dữ liệu |

## Quy tắc UX/accessibility bắt buộc

- Mỗi input có visible label hoặc instruction; required field phải nói rõ bắt
  buộc, không chỉ dùng màu/asterisk.
- Error phải chỉ đúng trường/item lỗi và hướng dẫn sửa; không chỉ đổi border đỏ.
- Search/filter dùng control native/semantic, label không bị thay bằng icon-only.
- Các action trong summary/detail phải có accessible name đầy đủ ngữ cảnh.
- Status/tag chỉ dùng màu bổ trợ; text vẫn phải nói rõ ý nghĩa.
- Không dùng emoji hoặc icon màu; dùng icon line SVG hiện có.
- Không tạo body horizontal overflow ở 125%/150% zoom.

## Không được làm trong c2-004

- Không thêm migration, endpoint server hoặc database.
- Không thêm tag catalog/tag picker; phần này thuộc c2-005/c2-006.
- Không thêm photo picker/upload/evidence; phần này thuộc c2-007/c2-008.
- Không tạo customer directory hoặc device page mới.
- Không sửa role capability để làm route hiển thị được.
- Không đưa business status transition, diagnosis, quote hoặc price calculation
  vào React.
- Không sửa các file UI đang có thay đổi ngoài phạm vi nếu không có lý do trực
  tiếp; giữ nguyên thay đổi của người dùng.

## Definition of Done

- [ ] `#/orders` có list thật và đầy đủ state.
- [ ] `#/orders/{id}` có detail thật, multi-item và safe projection.
- [ ] `Tạo phiếu tiếp nhận` mở đúng `#/repair-intake/new`.
- [ ] Intake success điều hướng đúng tới detail.
- [ ] Direct link detail không bị client route guard chặn nhầm; backend vẫn là
      authority.
- [ ] Manager/Owner/Receptionist theo đúng role boundary hiện có.
- [ ] Technician không được mở rộng quyền ngoài contract.
- [ ] Không có direct fetch/database trong component.
- [ ] Không có mock success khi API lỗi.
- [ ] `npm --prefix src/ui run type-check` pass.
- [ ] `npm --prefix src/ui run build` pass.
- [ ] Có checklist/evidence cho desktop, mobile, keyboard, zoom và failure states.

## Official UX references used for this handoff

- W3C labels/instructions and error identification:
  https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions
  https://www.w3.org/WAI/WCAG22/Understanding/error-identification
- GOV.UK Summary list for key/value detail views:
  https://design-system.service.gov.uk/components/summary-list/
- GOV.UK Tag guidance for non-interactive display tags and not relying on colour:
  https://design-system.service.gov.uk/components/tag/
- MDN file input guidance for the later evidence plan (`multiple`, `accept`,
  `capture`; `accept` is only a hint and server validation remains required):
  https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/file
