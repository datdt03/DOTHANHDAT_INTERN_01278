# Checklist Kiểm thử Xác thực và Quản lý Phiên (Authentication & Session UI Checklist) — C1-004

Tài liệu kiểm thử xác thực và phiên làm việc giữa React UI và ASP.NET Core Access API theo kế hoạch C1-004.

---

## 1. Môi trường kiểm thử

| Thành phần | Cấu hình |
|---|---|
| ASP.NET Core API | `http://localhost:5191` (`ASPNETCORE_ENVIRONMENT=Development`) |
| React UI | `http://localhost:5173` |
| Database | PostgreSQL `127.0.0.1:5432/repairflow` |
| Seed Data | 3 tài khoản: `manager@repairflow.vn`, `receptionist@repairflow.vn`, `technician@repairflow.vn` (Mật khẩu: `dat123456`) |

---

## 2. Bảng ma trận kiểm thử (Test Matrix)

### A. Kiểm tra tính hợp lệ của Form (Client-side Validation)
- [x] **TC-VAL-01**: Bỏ trống email khi bấm Đăng nhập -> Hiển thị thông báo *"Vui lòng nhập địa chỉ email tài khoản."*, không gửi API request.
- [x] **TC-VAL-02**: Nhập email không đúng định dạng (ví dụ: `abc`, `user@`, `user@domain`) -> Hiển thị thông báo *"Địa chỉ email không đúng định dạng."*, không gửi API request.
- [x] **TC-VAL-03**: Nhập email đúng định dạng nhưng bỏ trống mật khẩu -> Hiển thị thông báo *"Vui lòng nhập mật khẩu."*, không gửi API request.
- [x] **TC-VAL-04**: Chống duplicate submit: Khi đang gửi request (`isSubmitting === true`), nút Đăng nhập hiển thị *"Đang xác thực..."*, vô hiệu hóa tương tác (disabled).

### B. Đăng nhập với API thật (Authentication Flows)
- [x] **TC-AUTH-01 (Manager)**:
  - Email: `manager@repairflow.vn`, Mật khẩu: `dat123456`
  - Kết quả: Server trả về 200 OK kèm cookie `repairflow_session` (HttpOnly, SameSite=Lax).
  - UI: Chuyển hướng chính xác vào `#/dashboard`.
- [x] **TC-AUTH-02 (Receptionist)**:
  - Email: `receptionist@repairflow.vn`, Mật khẩu: `dat123456`
  - Kết quả: Server trả về 200 OK kèm cookie.
  - UI: Chuyển hướng chính xác vào `#/today`.
- [x] **TC-AUTH-03 (Technician)**:
  - Email: `technician@repairflow.vn`, Mật khẩu: `dat123456`
  - Kết quả: Server trả về 200 OK kèm cookie.
  - UI: Chuyển hướng chính xác vào `#/my-work`.
- [x] **TC-AUTH-04 (Sai thông tin xác thực)**:
  - Email: `manager@repairflow.vn`, Mật khẩu sai: `wrongpass`
  - Kết quả: Server trả về 401 Unauthorized `authentication_failed`.
  - UI: Hiển thị lỗi generic: *"Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại."* Không tiết lộ thông tin tài khoản.
- [x] **TC-AUTH-05 (Chọn Workspace khi trả về 409 Conflict)**:
  - Khi tài khoản thuộc nhiều workspace (`workspace_selection_required`), UI chuyển sang màn hình chọn chi nhánh.
  - Người dùng bấm chọn chi nhánh -> Đăng nhập lại kèm `workspaceId`. Có nút "Quay lại" để trở về form đăng nhập.

### C. Khôi phục phiên làm việc (Session Restore & Persistence)
- [x] **TC-SES-01 (F5 Restore)**:
  - Người dùng đã đăng nhập, bấm F5 hoặc mở lại tab mới.
  - UI hiển thị trạng thái `session-checking` (`<SessionCheckingScreen />`).
  - Gửi `GET /api/access/context` kèm cookie `credentials: "include"`.
  - Nhận 200 OK -> Khôi phục context an toàn, hiển thị shell tương ứng theo vai trò.
- [x] **TC-SES-02 (Unauthenticated Visit)**:
  - Mở trang khi chưa đăng nhập.
  - `GET /api/access/context` trả về 401 `authentication_required`.
  - UI chuyển về trạng thái `unauthenticated`, hiển thị form đăng nhập sạch sẽ, không hiển thị protected shell.

### D. Đăng xuất (Logout Flow)
- [x] **TC-OUT-01**:
  - Người dùng bấm nút "Đăng xuất" trên thanh điều hướng sidebar.
  - Gửi `POST /api/access/logout` kèm cookie.
  - Cookie bị xóa, local state bị xóa hoàn toàn.
  - UI chuyển về `#/login` ở trạng thái `unauthenticated`.
- [x] **TC-OUT-02 (Idempotent Logout)**:
  - Gọi logout nhiều lần hoặc khi mạng lỗi -> UI vẫn luôn dọn dẹp an toàn local state và chuyển về login.

### E. Hết hạn phiên làm việc (Expired / Revoked Session)
- [x] **TC-EXP-01**:
  - Khi phiên bị hết hạn (cookie hết hạn hoặc server thu hồi), request trả lời 401.
  - UI xóa sạch thông tin người dùng khỏi React state.
  - Chuyển hướng về `#/login`.
  - Hiển thị banner thông báo trung tính: *"Phiên làm việc đã hết hạn hoặc không còn hợp lệ. Vui lòng đăng nhập lại."* Có nút đóng thông báo `✕`.

### F. Ranh giới tuyến khách hàng (Customer Public Route)
- [x] **TC-CUST-01**:
  - Truy cập URL `#/customer/RF-2026-0891`.
  - UI hiển thị giao diện công khai di động khách hàng (`CustomerLinkRoute`).
  - Không chuyển hướng về staff login (`#/login`).
  - Không bị chặn bởi `session-checking` của SessionProvider nội bộ.

### G. Hệ thống khi API ngừng hoạt động (API Unavailable & Retry)
- [x] **TC-NET-01**:
  - Khi API backend tắt (port 5191 không phản hồi), UI hiển thị màn hình `Chưa kết nối được API` kèm thông báo *"Không thể kết nối tới hệ thống."*.
  - Có nút "Thử lại" (`onRetry`). Bấm "Thử lại" khi API đã bật sẽ kết nối thành công mà không cần tải lại toàn bộ trang.
  - Có nút "Mở bản preview UI" để vào chế độ mock preview độc lập.

### H. Chế độ Preview (Preview Mode Independence)
- [x] **TC-PREV-01**:
  - Truy cập `?preview=1` hoặc bấm "Mở bản preview UI".
  - UI sử dụng `MockAccessAdapter`, không gọi API backend thật.
  - Chạy độc lập hoàn toàn với dữ liệu mẫu trong `src/ui/mocks/`.

### I. Bảo mật & Tiêu chuẩn hiển thị (Security & UI Standards)
- [x] **TC-SEC-01**: Không có password, raw token, hay token hash lưu trong `localStorage` hay `sessionStorage` ở chế độ API thật.
- [x] **TC-SEC-02**: Không hiển thị thông tin nhạy cảm trong URL (không đưa token/password vào hash/query).
- [x] **TC-SEC-03**: Không in token, mật khẩu, hay thông tin nhạy cảm ra `console.log`.
- [x] **TC-UI-01**: Giao diện 100% tiếng Việt.
- [x] **TC-UI-02**: Không sử dụng emoji hệ thống, 100% monochrome line SVG icons.
- [x] **TC-UI-03**: Tuân thủ tỷ lệ màu 85% Slate / 15% Sky Blue.
