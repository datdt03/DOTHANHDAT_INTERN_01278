# Checklist Kiểm thử Điều hướng theo Vai trò (Role-Aware Navigation Checklist) — C1-006

Tài liệu kiểm thử điều hướng theo vai trò (Owner/Manager, Receptionist, Technician) và ranh giới bảo mật route trong RepairFlow React UI theo kế hoạch C1-006.

---

## 1. Môi trường kiểm thử

| Thành phần | Cấu hình |
|---|---|
| React UI | `http://localhost:5173` (Vite 7.3.6, React 19, TypeScript 5.9) |
| ASP.NET Core API | `http://localhost:5191` (`RepairFlow.Api`, .NET 8) |
| Database | PostgreSQL `127.0.0.1:5432/repairflow` |
| Tài khoản kiểm thử | • `manager@repairflow.vn` (Mật khẩu: `dat123456`)<br/>• `receptionist@repairflow.vn` (Mật khẩu: `dat123456`)<br/>• `technician@repairflow.vn` (Mật khẩu: `dat123456`) |

---

## 2. Bảng ma trận kiểm thử (Test Matrix)

### A. Điểm vào mặc định sau khi xác thực phiên (Role Entry Hydration)
- [x] **TC-ENTRY-01 (Manager/Owner)**:
  - Đăng nhập tài khoản `manager@repairflow.vn` hoặc khôi phục session.
  - Kết quả mong đợi: UI tự động điều hướng vào `#/dashboard` (Tổng quan vận hành — `UI-A06`).
  - Menu sidebar hiển thị: Tổng quan, Phiếu sửa chữa, Hàng chờ công việc, Khách hàng, Thiết bị và lịch sử, Nhân sự & phân công, Quy trình cửa hàng.
- [x] **TC-ENTRY-02 (Receptionist)**:
  - Đăng nhập tài khoản `receptionist@repairflow.vn` hoặc khôi phục session.
  - Kết quả mong đợi: UI tự động điều hướng vào `#/today` (Tổng quan hôm nay — `UI-A07`).
  - Menu sidebar hiển thị: Hôm nay, Tra cứu tiến độ, Phiếu sửa chữa, Hàng chờ tiếp nhận.
- [x] **TC-ENTRY-03 (Technician)**:
  - Đăng nhập tài khoản `technician@repairflow.vn` hoặc khôi phục session.
  - Kết quả mong đợi: UI tự động điều hướng vào `#/my-work` (Hàng chờ công việc — `UI-A08`).
  - Menu sidebar hiển thị: Hàng chờ công việc, Phiếu được phân công.

### B. Kiểm tra bảo vệ Route trực tiếp (Direct Route Guarding & 403 Forbidden)
- [x] **TC-GUARD-01 (Receptionist truy cập route quản lý)**:
  - Phiên làm việc: Receptionist (`receptionist@repairflow.vn`).
  - Nhập trực tiếp vào URL: `#/dashboard`, `#/settings`, hoặc `#/staff-assignments`.
  - Kết quả: Không render dữ liệu quản lý. Hiển thị `<ForbiddenState />` với badge `403`, thông báo vai trò không có quyền, và nút "Quay về màn hình chính của tôi" đưa về `#/today`.
- [x] **TC-GUARD-02 (Technician truy cập route ngoài phân công)**:
  - Phiên làm việc: Technician (`technician@repairflow.vn`).
  - Nhập trực tiếp vào URL: `#/dashboard`, `#/today`, `#/lookup`, `#/customers`, hoặc `#/settings`.
  - Kết quả: Không render dữ liệu ngoài phạm vi. Hiển thị `<ForbiddenState />` với badge `403` và nút quay về `#/my-work`.
- [x] **TC-GUARD-03 (Read-only Boundary của Receptionist)**:
  - Tại màn hình `#/today` và `#/lookup`, Receptionist xem được thông tin tiến độ tổng quan.
  - Tuyệt đối không xuất hiện các nút chỉnh sửa kỹ thuật, thay đổi đơn giá báo giá, phân công nhân sự hay metadata kiểm toán (Audit).
- [x] **TC-GUARD-04 (Assigned Scope của Technician)**:
  - Tại màn hình `#/my-work`, Technician chỉ thấy danh sách công việc được phân công cá nhân, ưu tiên theo SLA.
  - Tuyệt đối không hiển thị cài đặt cấu hình cửa hàng hay phân bổ nhân sự toàn xưởng.

### C. Ranh giới Khách hàng (Customer Public Boundary)
- [x] **TC-CUST-01 (Customer Link Isolation)**:
  - Truy cập route công khai: `#/customer/RF-2026-0891`.
  - Kết quả: Render `<CustomerLinkRoute />` độc lập, layout riêng biệt, tuyệt đối không có sidebar nội bộ, không bị ảnh hưởng bởi session nội bộ.

### D. Khôi phục phiên và Đăng xuất (Session Restore & Logout)
- [x] **TC-SES-01 (F5 Page Refresh)**:
  - F5 khi đang ở `#/dashboard` (Manager) $\to$ Giữ nguyên màn hình `#/dashboard`.
  - F5 khi đang ở `#/today` (Receptionist) $\to$ Giữ nguyên màn hình `#/today`.
  - F5 khi đang ở `#/my-work` (Technician) $\to$ Giữ nguyên màn hình `#/my-work`.
- [x] **TC-SES-02 (Logout Boundary)**:
  - Bấm nút Đăng xuất trên thanh điều hướng sidebar.
  - Kết quả: Xóa toàn bộ session context cục bộ và cookie server, chuyển hướng an toàn về `#/login`.

### E. Giao diện Responsive & Zoom Resilience
- [x] **TC-RESP-01 (Desktop 1440x1024)**:
  - Sidebar hiển thị cố định ở bên trái, hỗ trợ collapse thu gọn dạng icon-only.
  - Header và nội dung căn chỉnh theo lưới chuẩn 85% Slate / 15% Sky Blue.
- [x] **TC-RESP-02 (Mobile 390x844)**:
  - Sidebar chuyển thành ngăn kéo (off-canvas drawer) với nút đóng và backdrop overlay mờ.
  - Bấm nút menu trên header mở sidebar; bấm backdrop hoặc nút đóng sẽ đóng sidebar.
  - Tab điều hướng và thẻ thông tin tự động co giãn không sinh thanh cuộn ngang trang.
