# C1-007 — Shared integration acceptance evidence

Ngày kiểm tra: 2026-09-17  
Scope: access boundary giữa ASP.NET Core API, PostgreSQL local và React/Vite UI.

## Automated evidence

- [x] `dotnet test src/server/RepairFlow.sln -c Release --no-restore -p:UseAppHost=false` — 48/48 tests pass.
- [x] `npm run build` trong `src/ui` — TypeScript check pass, Vite build pass.
- [x] Live API smoke test trên `http://127.0.0.1:5191`: cả Manager, Receptionist và Technician đều login `200`, đọc context `200`, logout `200`, gọi context sau logout nhận `401`.
- [x] Migration runner chạy hai lần trên PostgreSQL local; cả hai lần không có pending migration và không tạo duplicate schema state.
- [x] UI network boundary chỉ gọi `fetch` trong `src/ui/shared/api/api-client.ts`; component không truy cập database.

## Manual UI evidence

Đã kiểm tra trên React preview tại `http://127.0.0.1:5173/?preview=1`:

- [x] Manager vào `#/dashboard`, hiển thị navigation và capability context quản lý.
- [x] Receptionist vào `#/today`, chỉ hiển thị navigation operational/read-only.
- [x] Technician vào `#/my-work`, hiển thị assigned-work/SLA placeholder và không có navigation quản trị workspace.
- [x] Receptionist truy cập trực tiếp `#/dashboard` nhận trạng thái `403 Truy cập bị từ chối`, không render dashboard data.
- [x] Customer route `#/customer/RF-2026-0891` dùng customer shell độc lập, không có internal sidebar/header.
- [x] Logout xóa session preview và chuyển về `#/login`.
- [x] C1-006 responsive checklist đã pass cho desktop `1440×1024` và mobile `390×844`; c1-007 giữ nguyên responsive boundary.

## Result

C1 access vertical slice đạt acceptance. C1 được phép làm dependency cho C2; business data/API vẫn nằm ngoài scope của C1.
