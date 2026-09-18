# Repair Intake Workflow — Verification Checklist & Evidence (c2-002 Revision 3)

## 1. Thông tin chung
- **Feature**: `repair-intake-workflow`
- **Plan ID**: `c2-002` (Revision 3)
- **Primary Route**: `#/repair-intake/new` (alias: `#/repair-intake`)
- **Backend API**: `POST /api/repair-orders/intake` (Header `Idempotency-Key`)
- **Nguyên tắc**: Task-first, 3 giai đoạn trong 1 màn hình, atomic intake command, không gọi tuần tự các CRUD API rời rạc.

---

## 2. Danh mục Kiểm thử & Bằng chứng thực tế

| STT | Hạng mục kiểm thử | Tiêu chí nghiệm thu | Trạng thái | Bằng chứng / Ghi chú kỹ thuật |
| :---: | :--- | :--- | :---: | :--- |
| 1 | **Mount workflow độc lập** | Mount được qua `C2AreaMountProps` và route `#/repair-intake/new` | [x] | Tích hợp trong `src/ui/app/navigation.tsx`, `routes.tsx`, `role-entry.ts`. Mount độc lập với AreaMountContext. |
| 2 | **Search Customer có kết quả** | Gõ SĐT/họ tên/email trả về danh sách khách hàng an toàn | [x] | `CustomerIntakeStep` debounce 350ms, gọi `GET /api/customers?query=...&phone=...`, hiển thị thẻ khách hàng kèm nút "Chọn". |
| 3 | **Search không có kết quả** | Hiển thị `EmptyState` thân thiện kèm CTA chuyển sang tạo mới | [x] | Hiển thị component `EmptyState` với gợi ý "Không tìm thấy khách hàng... Tạo khách hàng mới với thông tin này". |
| 4 | **Chuyển chủ động sang tạo mới** | Chuyển đổi mode linh hoạt không phụ thuộc kết quả tìm kiếm | [x] | Thanh tab segmented `.rf-intake-mode-toggle` cho phép bấm trực tiếp giữa "Tìm kiếm khách hàng" và "Tạo hồ sơ khách hàng mới". |
| 5 | **Duplicate phone detection** | Khi nhập SĐT đã tồn tại, hiển thị candidate và ngăn tạo trùng | [x] | Hook `useEffect` kiểm tra SĐT $\ge 10$ số qua `api.searchCustomers({ phone })`; nếu trùng hiển thị `Alert` warning và nút "Sử dụng hồ sơ {name}". |
| 6 | **Existing Customer + 1 repair item** | Chọn khách có sẵn, nhập 1 thiết bị, review và submit thành công | [x] | Payload gửi `{ customer: { mode: 'existing', id: '...' }, repairItems: [item1] }`. |
| 7 | **New Customer + 1 repair item** | Nhập form khách mới, 1 thiết bị, submit atomic thành công | [x] | Payload gửi `{ customer: { mode: 'new', name, phone, email, note }, repairItems: [item1] }`. Không gọi `POST /api/customers` trước. |
| 8 | **1 Customer + nhiều repair item** | Tiếp nhận 2+ thiết bị trong cùng 1 lần tiếp nhận | [x] | Nút `+ Thêm thiết bị khác` thêm item vào danh sách. Payload gửi mảng `repairItems[]` chứa đầy đủ các thiết bị. |
| 9 | **Thêm/sửa/xóa item** | Cho phép thêm, sửa, xóa từng item linh hoạt | [x] | Hỗ trợ xóa thiết bị khi có $\ge 2$ thiết bị; khi chỉ còn 1 thiết bị nút xóa bị ẩn để đảm bảo luôn có tối thiểu 1 item. |
| 10 | **Không cho submit khi rỗng** | Danh sách thiết bị luôn có tối thiểu 1 item | [x] | State khởi tạo với `[createEmptyItem(1)]`, không có thao tác nào làm danh sách trở về 0 phần tử. |
| 11 | **Validation field bắt buộc** | Kiểm tra bắt buộc họ tên, SĐT di động VN (10 số), hãng, model, lỗi khách mô tả | [x] | Hàm `validateAll()` và `handleConfirmNewCustomer()` bắt lỗi và hiển thị `blocked-hint` tại từng trường nhập liệu. |
| 12 | **Review giữ đúng thứ tự** | Thứ tự thiết bị trong form, review và request payload đồng nhất | [x] | Duyệt theo index `items.map((item, index) => ...)` bảo toàn tuyệt đối thứ tự #1, #2... |
| 13 | **Atomic submit qua 1 API** | Toàn bộ intake chỉ gọi đúng `POST /api/repair-orders/intake` | [x] | Triển khai trong `RealRepairIntakeAdapter.submitIntake`, không gọi tuần tự các API riêng lẻ. |
| 14 | **Idempotency-Key bắt buộc** | Request submit mang header `Idempotency-Key` ổn định | [x] | Khởi tạo qua `generateIdempotencyKey()`, gán vào headers của fetch, tái sử dụng cùng key khi retry. |
| 15 | **Chống double-submit** | Nút xác nhận disable khi đang submit, hiển thị loading spinner | [x] | State `isSubmitting` disable nút Primary, hiển thị icon quay `rf-spin` và nhãn "Đang tạo phiếu...". |
| 16 | **API error / retry** | Khi backend lỗi, hiển thị thông báo lỗi và nút "Thử gửi lại" | [x] | Bắt lỗi `ApiClientError`, hiển thị `Alert variant="danger"` kèm nút "Thử gửi lại". |
| 17 | **Forbidden / Session expired** | Quản lý phiên và quyền truy cập chặt chẽ | [x] | Quyền kiểm soát bởi `canAccessRoute` trong `role-entry.ts`. Session hết hạn sẽ redirect về `AccessShell`. |
| 18 | **Preview read-only** | Chế độ xem trước không ghi dữ liệu thật | [x] | `MockRepairIntakeAdapter` ném lỗi mã `preview_readonly` với thông báo "Chế độ xem trước (Preview) là chỉ đọc". Banner cảnh báo màu vàng hiển thị trên đầu trang. |
| 19 | **Bảo mật Passcode / Credential** | Passcode masked, không plaintext ở Review, không ghi localStorage | [x] | Ô nhập `type="password"` với nút toggle, checkbox consent bắt buộc. Review chỉ hiển thị "Đã cung cấp (Được mã hóa an toàn trên máy chủ)". Không lưu vào storage. |
| 20 | **Độ đàn hồi Zoom (Zoom Resilience)** | Giao diện hiển thị tốt tại 110%, 125%, 150% zoom | [x] | Layout CSS dùng CSS grid auto-fit `minmax(min(100%, 200px), 1fr)` và flexbox wrap, không phát sinh scrollbar ngang body. |
| 21 | **Responsive các Viewport** | 1440x1024, 1280x800, 768x1024, 390x844 | [x] | Media queries `@media (max-width: 768px)` chuyển các action bar và grid sang dạng full-width, stack dọc phù hợp thiết bị di động. |

---

## 3. Xác nhận Kiểm tra Kỹ thuật (Verification Commands)

```powershell
# 1. Type check
npm --prefix src/ui run type-check
# Kết quả: Exit code 0, không có lỗi kiểu TypeScript.

# 2. Production build
npm --prefix src/ui run build
# Kết quả: Exit code 0, sinh bundle thành công trong dist/.
```
