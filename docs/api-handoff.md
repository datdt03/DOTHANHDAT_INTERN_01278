# RepairFlow — API Handoff to UI

> File này là biên bản bàn giao giữa API và UI. Contract v1 đã được freeze; API hiện chưa triển khai. Antigravity chỉ chuyển từ mock sang API thật sau khi phần tương ứng có trạng thái `ready` và bằng chứng kiểm tra.

## 1. Thông tin bàn giao

| Field | Value |
| --- | --- |
| Contract version | `1` |
| Contract status | `Frozen` |
| Contract freeze date | `2026-09-12` |
| API implementation status | `Not started` |
| API base URL | `<chưa có; điền ở môi trường local/staging sau G1>` |
| Health URL | `<chưa có; dự kiến /health sau G1>` |
| API branch/commit | `<chưa có>` |
| Handoff owner | `Codex` |
| UI consumer | `Antigravity` |
| Handoff date | `2026-09-12` |

## 2. Cách chạy API

Codex phải ghi rõ các lệnh thật của repository, không ghi lệnh giả:

```text
Install: <command>
Migration: <command>
Seed demo: <command>
Start API: <command>
Run tests: <command>
```

Không ghi token, mật khẩu, connection string hoặc dữ liệu khách hàng thật vào file này. Dùng tên biến môi trường và file mẫu nếu cần.

## 3. Demo account và dữ liệu seed

| Item | Value |
| --- | --- |
| Demo workspace | `<workspace name/id>` |
| Demo employee roles | `owner`, `manager`, `receptionist`, `technician` |
| Login setup | `<mô tả cách tạo/reset; không ghi password thật>` |
| Demo repair order | `<orderCode>` |
| Demo public link | `<tạo mới khi seed; không commit token production>` |

Seed phải bám demo scenario trong [README § Demo Scenario](../README.md#demo-scenario), không dùng token public cố định cho production.

## 4. Endpoint readiness

`ready` nghĩa là endpoint đã có implementation, auth/tenant check, test tối thiểu và response bám [API contract v1](./api-contract.md).

| Surface | Endpoint/flow | Status | Evidence |
| --- | --- | --- | --- |
| Health | `GET /health` | `pending` | `<test/output>` |
| Auth | login/logout/me | `pending` | `<test/output>` |
| Dashboard | `GET /api/v1/dashboard` | `pending` | `<test/output>` |
| Order list | `GET /api/v1/repair-orders` | `pending` | `<test/output>` |
| Order detail | `GET /api/v1/repair-orders/:id` | `pending` | `<test/output>` |
| Intake | customer/device/create order | `pending` | `<test/output>` |
| Evidence | upload/read signed URL | `pending` | `<test/output>` |
| Diagnosis | create diagnosis | `pending` | `<test/output>` |
| Quote | draft/send/version | `pending` | `<test/output>` |
| Public link | view/approve/reject | `pending` | `<test/output>` |
| Repair | status/work log/checklist | `pending` | `<test/output>` |
| QC | pass/fail and transition | `pending` | `<test/output>` |
| Handover | handover/warranty/history | `pending` | `<test/output>` |

## 5. Known deviations and decisions

| ID | Deviation/decision | Impact on UI | Owner | Resolution |
| --- | --- | --- | --- | --- |
| D-001 | Contract v1 đã freeze; API implementation chưa bắt đầu. | UI tiếp tục dùng mock cho tới khi từng surface có trạng thái `ready`. | Codex | Thực hiện G1 API scaffold. |

Không đánh dấu handoff hoàn tất nếu còn deviation làm UI phải tự đoán nghiệp vụ.

### 5.1. Quyết định đã chốt trong G0

| Nhóm | Quyết định canonical |
| --- | --- |
| Tenant và quyền | API lấy workspace từ session, không tin `workspaceId` do client gửi; RBAC và assignment kiểm tra ở server. |
| ID và mã phiếu | Resource ID là UUID; `orderCode` chỉ để hiển thị/tra cứu trong workspace. |
| Trạng thái | Dùng canonical status trong `docs/api-contract.md`; `overdue` là cờ `isOverdue`, không lưu thành status. |
| Báo giá | API dùng `version` integer; quote sau khi gửi/đã quyết định immutable; thay đổi tạo version mới. |
| Quyết định khách | Decision gắn đúng quote version và public link; approve/reject idempotent, transaction-safe. |
| Public link | Token opaque, hash trong DB, expiry/revoke/rate limit; public DTO được redacted. |
| Tiền và thời gian | Tiền là decimal string kèm VND; timestamp là UTC ISO-8601; field nullable trả `null`. |
| UI integration | UI mapping mock → canonical DTO tại API adapter; không đặt state machine/tính tiền/quyền trong template. |

## 6. UI smoke test sau bàn giao

Antigravity xác nhận các flow sau trên API thật và ghi kết quả ở đây:

- [ ] Login tạo session; refresh vẫn gọi được `GET /api/v1/me`.
- [ ] Dashboard hiển thị KPI và danh sách từ API, không đọc mock.
- [ ] Mở detail bằng UUID và hiển thị `orderCode`.
- [ ] Tạo/sửa draft quote; total do server trả.
- [ ] Gửi quote tạo link public và chuyển order sang `waiting_for_approval`.
- [ ] Public token xem được đúng quote, không thấy internal data.
- [ ] Approve/reject một lần; lần hai hiển thị lỗi rõ ràng.
- [ ] Chỉ quote `approved` đúng version mới cho phép bắt đầu sửa.
- [ ] Quality check fail trả order về `repairing`; không cho handover.
- [ ] Quality check pass → ready for pickup → handover → warranty active.
- [ ] Link hết hạn/thu hồi, 401, 403, 404, 409 đều có UI state.

## 7. Tiêu chí nhận bàn giao

- [ ] Contract version khớp với `docs/api-contract.md`.
- [ ] Có health check, seed demo và cách chạy tái lập được.
- [ ] Có test proof cho tenant isolation, RBAC, quote immutability, public token và state transition.
- [ ] Không còn endpoint production nào trả mock data.
- [ ] Các field nhạy cảm ngoài contract không xuất hiện trong response.
- [ ] API base URL/CORS/session configuration đủ để UI chạy trong môi trường đã ghi ở §1–§2.

