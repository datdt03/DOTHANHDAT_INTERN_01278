# Checklist Kiểm thử Khu vực Khách hàng (Customer Records Area Checklist) — C2-002

Tài liệu kiểm thử và bằng chứng nghiệm thu khu vực nghiệp vụ `customer-records-area` độc lập trong RepairFlow React UI theo kế hoạch C2-002.

---

## 1. Môi trường kiểm thử

| Thành phần | Cấu hình |
|---|---|
| React UI | `http://localhost:5173` (Vite 7.3.6, React 19, TypeScript 5.9) |
| ASP.NET Core API | `http://localhost:5191` (`RepairFlow.Api`, .NET 8) |
| Database | PostgreSQL `127.0.0.1:5432/repairflow` |
| Seed Data / Accounts | • `manager@repairflow.vn` (Mật khẩu: `dat123456`) — Manager/Technician multi-role<br/>• `receptionist@repairflow.vn` (Mật khẩu: `dat123456`) — Receptionist<br/>• `technician@repairflow.vn` (Mật khẩu: `dat123456`) — Technician |

---

## 2. Bảng ma trận kiểm thử (Test Matrix)

### A. Độc lập Area & Mount trực tiếp (Area Mount Independence)
- [x] **TC-MOUNT-01 (Mount độc lập qua Route Dispatcher)**:
  - Truy cập hash `#/customers`.
  - Kết quả: Render `<CustomerRecordsArea />` với Area-owned Shell riêng (`#customer-records-area`).
  - Tuyệt đối không import hoặc render `RoleAwareNavigationShell`, không phụ thuộc vào state của Device hoặc RepairOrder.
- [x] **TC-MOUNT-02 (Mount trực tiếp vào Detail qua tham số URL)**:
  - Truy cập hash `#/customers/:customerId` (ví dụ `#/customers/cust-001`).
  - Kết quả: Area tự động khởi tạo ở trạng thái chi tiết (Detail view), gọi API `getCustomer(customerId)`, hiển thị skeleton loader trong khi nạp và hiển thị hồ sơ khách hàng khi hoàn tất.

---

### B. Tra cứu khách hàng (Customer Search Flow)
- [x] **TC-SRCH-01 (Search có kết quả - Search Hit)**:
  - Nhập tên (ví dụ "An") hoặc số điện thoại (ví dụ "0912345678").
  - Giao diện có debounce 300ms và hỗ trợ phím Enter hoặc nút "Tìm kiếm".
  - Kết quả: Hiển thị bảng khách hàng với các cột: Họ và tên, Số điện thoại (`JetBrains Mono`), Email, Ghi chú, Ngày tạo, Nút "Xem hồ sơ".
- [x] **TC-SRCH-02 (Search không có kết quả - Empty State)**:
  - Nhập từ khóa không tồn tại (ví dụ "KhachKhongTonTai9999").
  - Kết quả: Hiển thị Empty state chuẩn 100% tiếng Việt: *"Không tìm thấy khách hàng phù hợp"*, mô tả hướng dẫn và nút CTA "Tạo hồ sơ khách hàng mới" (nếu có quyền).
- [x] **TC-SRCH-03 (Loading Skeleton)**:
  - Khi đang gửi request tìm kiếm (`isLoading === true`), hiển thị danh sách skeleton dạng shimmer animation, không làm giật layout giao diện.
- [x] **TC-SRCH-04 (Chống Race-Condition giữa các lượt tìm kiếm)**:
  - Người dùng gõ liên tục hoặc gửi yêu cầu mới khi yêu cầu cũ chưa hoàn tất.
  - Sử dụng AbortController và sequence tracking (`activeRequestSeq`). Yêu cầu cũ bị hủy hoặc bị chặn, không bao giờ ghi đè kết quả của yêu cầu mới hơn.

---

### C. Xử lý lỗi kết nối & Ngoại tuyến (API Unavailable & Retry)
- [x] **TC-ERR-01 (API Unavailable / Network Error)**:
  - Khi API backend không phản hồi hoặc mất mạng, UI hiển thị banner cảnh báo lỗi thân thiện: *"Không thể tải danh sách khách hàng. Vui lòng thử lại."*
  - Tuyệt đối không để lộ mã lỗi HTTP thô (raw status code như 500, 502, 503).
  - Có nút "Thử lại" (`onRetry`): bấm nút sẽ kích hoạt lại hàm tìm kiếm mà không cần tải lại toàn bộ trang.
- [x] **TC-ERR-02 (Chế độ Xem trước - Preview Mode Fallback)**:
  - Khi chạy với cờ `previewMode` (`?preview=1` hoặc `VITE_UI_PREVIEW=true`), adapter chuyển sang `MockCustomerRecordsAdapter`.
  - Hiển thị banner trạng thái màu vàng thông báo chế độ xem trước (Read-Only).
  - Dữ liệu tra cứu được lấy từ `src/ui/mocks/customer-mock-data.ts`.
  - Thao tác tạo mới bị vô hiệu hóa an toàn, không giả vờ lưu thành công vào database.

---

### D. Tạo mới khách hàng & Xác thực dữ liệu (Create Customer & Validation Flow)
- [x] **TC-CRT-01 (Tạo mới thành công với dữ liệu hợp lệ)**:
  - Nhập đầy đủ thông tin: Họ tên "Nguyễn Văn Test", Số điện thoại "0981112233", Email "test@repairflow.vn", Ghi chú "Khách test C2-002".
  - Bấm "Lưu hồ sơ khách hàng".
  - Nút chuyển sang trạng thái disabled hiển thị "Đang lưu..." để chống double submit.
  - Sau khi backend trả về 201 Created, UI tự động chuyển sang màn hình chi tiết (Detail) và hiển thị banner thông báo màu xanh lá: *"Hồ sơ khách hàng đã được lưu trữ an toàn trong không gian làm việc."*
- [x] **TC-CRT-02 (Client-side Validation 100% tiếng Việt)**:
  - Bỏ trống Họ tên -> Báo lỗi: *"Vui lòng nhập họ và tên khách hàng."*
  - Họ tên > 160 ký tự -> Báo lỗi: *"Họ và tên không được vượt quá 160 ký tự."*
  - Bỏ trống Số điện thoại -> Báo lỗi: *"Vui lòng nhập số điện thoại liên hệ."*
  - Số điện thoại dưới 6 chữ số -> Báo lỗi: *"Số điện thoại không hợp lệ (tối thiểu 6 chữ số)."*
  - Nhập Email sai định dạng (ví dụ "abc@") -> Báo lỗi: *"Địa chỉ email không đúng định dạng."*
  - Email > 320 ký tự -> Báo lỗi: *"Email không được vượt quá 320 ký tự."*
  - Ghi chú > 4000 ký tự -> Báo lỗi: *"Ghi chú không được vượt quá 4000 ký tự."*
- [x] **TC-CRT-03 (Chuẩn hóa số điện thoại theo Contract)**:
  - Input cho phép người dùng nhập khoảng trắng, dấu gạch ngang, dấu chấm, dấu ngoặc (ví dụ: `(098) 123-4567`).
  - Adapter chuẩn hóa loại bỏ các ký tự phân cách trước khi gửi lên API, phù hợp với chính sách backend.

---

### E. Luồng xử lý trùng số điện thoại (Duplicate Phone Conflict Flow)
- [x] **TC-DUP-01 (Bắt lỗi 409 customer_phone_exists từ Backend)**:
  - Nhập số điện thoại đã tồn tại trong workspace.
  - Backend trả về 409 Conflict với error code `customer_phone_exists`.
  - UI hiển thị panel cảnh báo màu vàng: *"Số điện thoại này đã được đăng ký trong chi nhánh. Hệ thống đã tự động tra cứu hồ sơ hiện có."*
- [x] **TC-DUP-02 (Tự động tra cứu hồ sơ hiện có & Không tự phát minh customerId)**:
  - Adapter không tự đoán ID từ response lỗi, mà chủ động kích hoạt `searchCustomers({ phone })` để tìm nạp hồ sơ gốc chính xác.
  - Panel hiển thị thẻ thông tin của khách hàng hiện hữu (Tên, Số điện thoại, Email).
- [x] **TC-DUP-03 (Tùy chọn "Dùng hồ sơ hiện có" - Không tạo bản ghi trùng lặp)**:
  - Người dùng bấm nút "Dùng hồ sơ hiện có".
  - UI chuyển ngay sang xem chi tiết hồ sơ cũ đó.
  - Tuyệt đối không gửi thêm request POST tạo mới nào, đảm bảo toàn vẹn dữ liệu chi nhánh.

---

### F. Chi tiết khách hàng & Điều hướng liên kết (Detail View & Area Navigation)
- [x] **TC-DET-01 (Hiển thị đầy đủ thông tin hồ sơ)**:
  - Chi tiết bao gồm: Họ và tên (chữ to, nổi bật), Số điện thoại (`JetBrains Mono`, Tech Blue), Email, Mã định danh ID hệ thống, Thời gian tiếp nhận, Cập nhật gần nhất, Ghi chú.
- [x] **TC-DET-02 (Điều hướng sang Device Area)**:
  - Bấm nút "Thiết bị của khách hàng" -> Kích hoạt `onNavigate('device-area', customer.id)`.
  - Thay đổi hash sang `#/devices/:customerId` mà không tạo dependency trực tiếp vào mã nguồn của Device area.
- [x] **TC-DET-03 (Điều hướng sang Repair Order Area)**:
  - Bấm nút "Phiếu sửa chữa liên quan" -> Kích hoạt `onNavigate('repair-order-area', customer.id)`.
  - Thay đổi hash sang `#/orders/:customerId` mà không tạo dependency trực tiếp vào mã nguồn của Repair Order area.
- [x] **TC-DET-04 (Quay lại danh sách)**:
  - Bấm "Quay lại danh sách" -> Đưa về view tra cứu khách hàng giữ nguyên trạng thái tìm kiếm.

---

### G. Phân quyền & Khả năng hiển thị hành động (Capability-driven Action Visibility)
- [x] **TC-CAP-01 (Manager / Receptionist có quyền tạo)**:
  - Khi `!capabilities.isReadOnlyLookup && !capabilities.isAssignedOnly`:
  - Nút "Tạo khách hàng" hiển thị trên Header và nút CTA trong Empty state.
  - Người dùng có thể thực hiện toàn bộ luồng tạo khách hàng.
- [x] **TC-CAP-02 (Vai trò Read-only hoặc Assigned-only)**:
  - Khi `capabilities.isReadOnlyLookup === true` hoặc `capabilities.isAssignedOnly === true`:
  - Nút "Tạo khách hàng" bị ẩn khỏi giao diện.
  - Không hiển thị nút tạo trong Empty state.
- [x] **TC-CAP-03 (Backend Authorization Authority & 403 Fallback)**:
  - Trường hợp người dùng cố tình can thiệp gửi request POST `/api/customers` khi không có quyền ghi:
  - Backend trả về 403 Forbidden (`forbidden`).
  - Form bắt lỗi 403 và hiển thị thông báo an toàn: *"Bạn không có quyền tạo hồ sơ khách hàng mới."*, không làm crash ứng dụng.

---

### H. Bảo mật, Phiên làm việc & Phân lập Workspace (Security & Workspace Isolation)
- [x] **TC-SEC-01 (Cô lập dữ liệu theo Workspace)**:
  - Mọi request `searchCustomers`, `getCustomer`, `createCustomer` đều gắn ngữ cảnh phiên của workspace hiện tại.
  - Khách hàng thuộc workspace khác không bao giờ xuất hiện trong kết quả tìm kiếm.
- [x] **TC-SEC-02 (Hết hạn phiên / Chưa xác thực)**:
  - Khi phiên hết hạn, request trả về 401 Unauthorized (`authentication_required`).
  - Giao diện xóa sạch dữ liệu khách hàng được bảo vệ, hiển thị thông báo yêu cầu đăng nhập lại.
- [x] **TC-SEC-03 (Không lưu dữ liệu nhạy cảm hoặc Draft vào localStorage)**:
  - Dữ liệu form nhập liệu khách hàng không bị ghi bừa bãi vào `localStorage`.
  - Không có cuộc gọi `fetch` trực tiếp trong component; toàn bộ đi qua `customer-records-api.ts`.

---

### I. Khả năng tiếp cận & Độ co giãn Responsive (Accessibility & Responsive Standards)
- [x] **TC-UI-01 (Chuẩn màu 85% Slate / 15% Sky Blue)**:
  - Nền ứng dụng Slate (`#f8fafc`), bề mặt thẻ trắng (`#ffffff`), đường viền (`#e2e8f0`).
  - Điểm nhấn Sky Blue (`#0284c7`, hover `#0369a1`) cho Primary CTA và số điện thoại.
- [x] **TC-UI-02 (Không sử dụng Emoji / 100% Monochrome Line SVG)**:
  - Toàn bộ icon sử dụng vector nét mảnh từ `src/ui/shared/components/icons.tsx`.
- [x] **TC-UI-03 (Điều hướng bàn phím & Focus State)**:
  - Toàn bộ input, button đều có `:focus` ring xanh Sky Blue rõ ràng (`0 0 0 3px rgba(2, 132, 199, 0.15)`).
  - Hỗ trợ phím Tab, Enter để submit form và Esc khi thao tác.
  - Các input đều liên kết đúng với `<label htmlFor="...">`.
- [x] **TC-RESP-01 (Desktop 1440x1024 & 1280x800)**:
  - Grid hiển thị thông thoáng, bảng danh sách có khoảng cách lề đạt chuẩn.
- [x] **TC-RESP-02 (Tablet 768x1024)**:
  - Bảng tự động bọc trong container cuộn ngang cục bộ (`.rf-customer-table-wrapper`), form tự reflow dạng cột đơn/đôi.
- [x] **TC-RESP-03 (Mobile 390x844)**:
  - Header thu gọn linh hoạt, các nút hành động dàn đều 100% chiều rộng, không sinh thanh cuộn ngang body (`overflow-x: hidden`).
