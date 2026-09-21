# Checklist Kiểm thử Khu vực Phiếu sửa chữa (Repair-Order Area Checklist) — C2-004

Tài liệu kiểm thử và bằng chứng nghiệm thu khu vực nghiệp vụ `repair-order-area` độc lập trong RepairFlow React UI theo kế hoạch C2-004.

---

## 1. Môi trường kiểm thử

| Thành phần | Cấu hình |
|---|---|
| React UI | `http://localhost:5173` (Vite 7.1.7, React 19.1.1, TypeScript 5.9.2) |
| ASP.NET Core API | `http://localhost:5191` (`RepairFlow.Api`, .NET 8) |
| Database | PostgreSQL `127.0.0.1:5432/repairflow` |
| Seed Accounts | • `manager@repairflow.vn` (Mật khẩu: `dat123456`) — Manager/Owner<br/>• `receptionist@repairflow.vn` (Mật khẩu: `dat123456`) — Receptionist<br/>• `technician@repairflow.vn` (Mật khẩu: `dat123456`) — Technician |

---

## 2. Bảng ma trận kiểm thử (Test Matrix)

### A. Route Mount & Area Boundary Independence
- [x] **TC-ORD-MOUNT-01 (Mount danh sách qua hash `#/orders`)**:
  - Truy cập hash `#/orders`.
  - Kết quả: Render `<RepairOrderArea />` với view danh sách phiếu.
  - Component độc lập, tuân thủ contract `C2AreaMountProps` (`context`, `onNavigate`).
- [x] **TC-ORD-MOUNT-02 (Mount chi tiết qua hash `#/orders/{orderId}`)**:
  - Truy cập hash `#/orders/ord-001` hoặc mã phiếu tương ứng.
  - Kết quả: Area tự động khởi tạo ở view chi tiết phiếu (`RepairOrderDetail`), gọi API `getOrder(orderId)` hiển thị skeleton loader trong khi nạp và hiển thị toàn bộ hồ sơ phiếu khi hoàn tất.
- [x] **TC-ORD-MOUNT-03 (Direct link không bị Client Route Guard chặn nhầm)**:
  - Truy cập trực tiếp link chi tiết `#/orders/ord-001` trên thanh địa chỉ trình duyệt.
  - Hàm `canAccessRoute` trong `role-entry.ts` chuẩn hóa `#/orders/...` về base route `#/orders`. Người dùng Manager/Receptionist vào thẳng chi tiết mà không bị chặn thành `ForbiddenState`.

---

### B. Danh sách phiếu sửa chữa — Desktop (Order List Desktop)
- [x] **TC-ORD-LST-01 (Cấu trúc cột chuẩn & Typography)**:
  - Header có breadcrumb "Phiếu sửa chữa", tiêu đề và nút CTA `+ Tạo phiếu tiếp nhận`.
  - Bảng dữ liệu bao gồm các cột:
    1. **Mã phiếu**: Hiển thị bằng component `<OrderCode />` (`JetBrains Mono`), là nút bấm có `aria-label="Xem chi tiết phiếu RF-..."` dẫn vào chi tiết. Không làm toàn bộ row thành div click được.
    2. **Khách hàng**: Tên khách hàng (chữ đậm) + số điện thoại font monospace (`JetBrains Mono`).
    3. **Thiết bị**: Tên thiết bị đầu tiên; nếu phiếu có nhiều thiết bị thì hiển thị thêm badge `+N thiết bị`.
    4. **Trạng thái**: Hiển thị bằng `<StatusBadge />` ánh xạ sang tiếng Việt 100% (ví dụ: "Đã tiếp nhận", "Đang chẩn đoán", "Chờ khách duyệt", "Sẵn sàng bàn giao"). Tuyệt đối không để lộ raw enum.
    5. **Người phụ trách**: Tên nhân viên phụ trách chính hoặc lễ tân tiếp nhận.
    6. **Thời gian**: Ngày nhận và Ngày hẹn hoàn thành định dạng chuẩn `vi-VN`.
    7. **Thao tác**: Nút "Xem chi tiết" rõ ràng, keyboard accessible.

---

### C. Danh sách phiếu sửa chữa — Mobile (Order List Mobile Cards)
- [x] **TC-ORD-MOB-01 (Chuyển đổi sang Card layout trên màn hình 390px)**:
  - Resize trình duyệt về 390px (hoặc thiết bị di động).
  - Bảng desktop tự động ẩn (`display: none`), thay thế bằng danh sách Card dọc (`.rf-order-mobile-cards`).
  - Mỗi card có cấu trúc tinh gọn:
    - Hàng trên: Mã phiếu + StatusBadge tiếng Việt.
    - Hàng giữa: Khách hàng (Tên • SĐT).
    - Hàng giữa: Thiết bị (+N thiết bị nếu có).
    - Hàng dưới: Ngày nhận • Ngày hẹn.
    - Nút full-width: "Xem chi tiết".
  - Không sinh thanh cuộn ngang body (`overflow-x`).

---

### D. Tìm kiếm & Lọc trạng thái (Search & Filter Flow)
- [x] **TC-ORD-FLT-01 (Tìm kiếm đa năng)**:
  - Nhập mã phiếu (ví dụ "RF-2026"), tên khách (ví dụ "An"), số điện thoại (ví dụ "0912") hoặc tên thiết bị (ví dụ "iPhone").
  - Giao diện có debounce 300ms, hủy request cũ bằng `AbortController` chống race-condition.
  - Kết quả: Bảng cập nhật tức thời và hiển thị tóm tắt: *"Tìm thấy N phiếu sửa chữa phù hợp với bộ lọc"*.
- [x] **TC-ORD-FLT-02 (Lọc theo trạng thái)**:
  - Chọn trạng thái trong dropdown (ví dụ "Đang chẩn đoán", "Chờ khách duyệt").
  - Bảng chỉ hiển thị các phiếu ở trạng thái được chọn.
  - Hiển thị nút "Xóa bộ lọc" (`IconClose`); bấm nút sẽ xóa từ khóa và trả dropdown về "Tất cả trạng thái".
- [x] **TC-ORD-FLT-03 (Bảo lưu ngữ cảnh khi quay lại từ Detail)**:
  - Đang lọc từ khóa "iPhone", bấm "Xem chi tiết" để mở phiếu `RF-2026-0001`.
  - Bấm `← Quay lại danh sách`.
  - Bộ lọc "iPhone" vẫn được giữ nguyên trong state in-memory của Area, không bị reset, không dùng localStorage lưu business state.

---

### E. Chi tiết phiếu sửa chữa & Multi-Device (Order Detail View)
- [x] **TC-ORD-DET-01 (Header & Tóm tắt 2 cột)**:
  - Header có nút `← Quay lại danh sách`, Mã phiếu (`<OrderCode />`), StatusBadge, Thời gian tiếp nhận và cập nhật.
  - Cột 1: Thông tin khách hàng (Họ tên, SĐT monospace, Email, Ghi chú khách).
  - Cột 2: Tóm tắt tiếp nhận (Mô tả lỗi tổng quát, Nhân sự phân công, Hẹn hoàn thành, Tổng số thiết bị).
- [x] **TC-ORD-DET-02 (Chuyển tab nhiều thiết bị — Multi-device Switcher)**:
  - Phiếu `RF-2026-0001` có 2 thiết bị: Thiết bị #1 (iPhone 13) và Thiết bị #2 (iPad Air 5).
  - Hiển thị tab strip với `role="tablist"` và `role="tab"`, có `aria-selected` và số thứ tự `#1`, `#2` ổn định.
  - Bấm đổi tab giữa Thiết bị #1 và #2: panel nội dung bên dưới cập nhật chính xác theo thiết bị được chọn, không bị trộn lẫn dữ liệu.
- [x] **TC-ORD-DET-03 (Bằng chứng tiếp nhận & Lỗi khách mô tả)**:
  - Lỗi khách mô tả (`reportedIssue`) được đóng khung nổi bật với badge `LỖI KHÁCH MÔ TẢ (INTAKE REPORT)`.
  - Các trường bàn giao: Tình trạng ban đầu khi nhận, Phụ kiện kèm theo, Ghi chú kỹ thuật hiển thị dạng summary card rõ ràng.
- [x] **TC-ORD-DET-04 (Bảo mật Credential / Passcode)**:
  - Thiết bị hiển thị trạng thái passcode bảo mật (ví dụ: *"Khách hàng đã trực tiếp mở khóa máy tại quầy"* hoặc *"Mật khẩu đã được mã hóa an toàn"*).
  - Tuyệt đối không hiển thị plaintext password hay nút giải mã không cần thiết trong view detail thông thường.
- [x] **TC-ORD-DET-05 (Slot cho C2-006 Tagging và C2-008 Evidence)**:
  - Có sẵn slot component cho nhãn thẻ (`.rf-slot-placeholder--tags`) và ảnh hiện trạng bàn giao (`.rf-slot-placeholder--evidence`).
  - Không gọi API giả hay tạo mock tag/ảnh cạnh tranh trong phạm vi c2-004.
- [x] **TC-ORD-DET-06 (Định hướng bước tiếp theo & Lịch sử trạng thái)**:
  - Hiển thị panel thông báo hướng dẫn quy trình: *"Bước tiếp theo của quy trình: Phiếu sửa chữa đã hoàn tất tiếp nhận thành công..."*
  - Không tạo nút bấm Diagnosis/Quote/QC giả khi contract C3/C4 chưa tồn tại.
  - Lịch sử trạng thái (`statusHistory`) hiển thị timeline chuyển đổi trạng thái với timestamp và lý do chuyển đổi.

---

### F. Điều hướng luồng tiếp nhận (Intake Entry Point)
- [x] **TC-ORD-INTK-01 (Kích hoạt workflow tiếp nhận từ Order List)**:
  - Bấm nút `+ Tạo phiếu tiếp nhận` ở góc phải header danh sách phiếu.
  - Điều hướng tới `#/repair-intake/new` (Workflow tiếp nhận 3 giai đoạn của C2-002).
- [x] **TC-ORD-INTK-02 (Đón kết quả sau khi tiếp nhận thành công)**:
  - Hoàn tất quy trình tiếp nhận trong `repair-intake-workflow`.
  - Tại màn hình xác nhận thành công, bấm "Xem chi tiết phiếu sửa chữa →".
  - Workflow gọi `onNavigate('repair-order-area', order.id)`, chuyển hướng thẳng tới `#/orders/{orderId}` và hiển thị đúng phiếu vừa tạo.

---

### G. Ma trận trạng thái mạng & Lỗi (Network States Matrix)
- [x] **TC-ORD-NET-01 (Loading State)**:
  - Hiển thị skeleton shimmer cho thanh tìm kiếm, bộ lọc và các dòng bảng.
- [x] **TC-ORD-NET-02 (Empty State - Chưa có phiếu nào)**:
  - Khi danh sách hoàn toàn rỗng và không áp dụng bộ lọc: Hiển thị `<EmptyState />` tiêu đề *"Chưa có phiếu sửa chữa nào"* cùng nút CTA `+ Tạo phiếu tiếp nhận`.
- [x] **TC-ORD-NET-03 (Search Miss State)**:
  - Khi từ khóa tìm kiếm hoặc bộ lọc không khớp: Hiển thị EmptyState *"Không tìm thấy phiếu sửa chữa phù hợp"* cùng nút `Xóa bộ lọc và xem toàn bộ`.
- [x] **TC-ORD-NET-04 (Error / Network Failure & Retry)**:
  - Khi backend lỗi hoặc mất kết nối: Hiển thị `<Alert variant="danger">` với thông điệp tiếng Việt thân thiện và nút `Thử lại`.
- [x] **TC-ORD-NET-05 (Chế độ Xem trước - Preview Mode)**:
  - Chạy ứng dụng với `?preview=1` hoặc `VITE_UI_PREVIEW=true`.
  - Hiển thị banner màu vàng thông báo Chế độ xem trước (Read-Only).
  - Tải dữ liệu từ `MockRepairOrderAdapter` với đầy đủ các ca thử nghiệm đơn và đa thiết bị.
- [x] **TC-ORD-NET-06 (Detail Not Found)**:
  - Nhập mã phiếu không tồn tại (ví dụ `#/orders/non-existent-id`).
  - Hiển thị thông báo lỗi thân thiện cùng nút `Quay lại danh sách phiếu`.

---

### H. Phân quyền vai trò (Role Permissions & Security Boundaries)
- [x] **TC-ORD-ROLE-01 (Owner / Manager / Receptionist)**:
  - Có route `#/orders` trong danh sách cho phép (`ROLE_ALLOWED_ROUTES`).
  - Truy cập danh sách phiếu, xem chi tiết tất cả phiếu trong chi nhánh.
  - Có nút CTA `+ Tạo phiếu tiếp nhận`.
- [x] **TC-ORD-ROLE-02 (Technician Boundary)**:
  - Technician không có route `#/orders` trong allowed routes; role mặc định là `#/my-work` (hàng chờ theo phân công).
  - Khi Technician cố tình truy cập `#/orders`: Client route guard hiển thị `<ForbiddenState />` an toàn, không để lộ dữ liệu danh sách hoặc chi tiết phiếu cũ.

---

### I. Khả năng co giãn & Zoom Resilience (Zoom Elasticity)
- [x] **TC-ORD-ZOOM-01 (110% Baseline)**:
  - Kiểm tra tỷ lệ hiển thị ở mức zoom 110%: Cân đối, khoảng cách lề và kích thước font chữ hài hòa.
- [x] **TC-ORD-ZOOM-02 (125% – 150% Reflow)**:
  - Phóng to trình duyệt lên 125% và 150%:
  - Không sinh thanh cuộn ngang toàn trang (`body horizontal scroll`).
  - Bảng dữ liệu tự động bọc trong container cuộn ngang cục bộ (`.rf-table-responsive`).
  - Lưới card 2 cột tự động reflow thành 1 cột mượt mà.
