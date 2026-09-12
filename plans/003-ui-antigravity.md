# 003 — RepairFlow UI implementation for Antigravity

## Goal

Antigravity hoàn thiện UI MVP trên baseline prototype hiện có, chuyển data source từ mock sang server theo các quyết định/fixture trong [docs/v0](../docs/v0/README.md) và giữ toàn bộ business rule quan trọng ở server. UI phải hiển thị đúng status/capabilities từ server, xử lý đầy đủ loading/error/empty/forbidden/conflict/public-link states và dùng public token thay cho mock order id. Chưa coi API contract là tài liệu đã freeze.

## Scope

- API client dùng chung, management session cookie và runtime API base URL.
- Login/current session chỉ cho Owner/Manager theo [ui-requirements §8](../docs/v0/ui-requirements.md#8-danh-sách-màn-hình-mvp); không tạo login cho Receptionist/Technician.
- Chọn staff profile Receptionist/Technician trong các form assignment/ghi nhận thay cho session riêng.
- Dashboard, order list/filter, order detail, intake, evidence, diagnosis, quote versioning.
- Repair work log/checklist, quality check, handover/warranty/history.
- Customer public link xem quote và approve/reject một lần.
- Mapping canonical API DTO sang render model hiện có tại một boundary.
- Regenerate bundle từ source và ghi cách build trong kết quả kiểm chứng local khi cần.

## Execution model cho Antigravity

Đây là task packet riêng cho Antigravity. Thực thi theo [master plan v1](./000-repairflow-v1-implementation.md), đọc [requirements closure](../docs/v0/requirements-closure.md), rồi ghép từng task với Codex server cùng mã cluster. UI được phép bắt đầu bằng shared fixture/stub trong cùng cluster; không chờ toàn bộ business API hoàn tất.

| Cluster | UI task cards | Kết quả UI phải bàn giao trong cluster |
| --- | --- | --- |
| C0 | C0-U01..U03 | Baseline prototype, route inventory, đọc quyết định/fixture v0 |
| C1 | C1-U01..U04 | Owner/Manager login, session bootstrap, app shell, staff selector |
| C2 | C2-U01..U04 | Customer/device/order intake flow và validation states |
| C3 | C3-U01..U04 | Intake checklist, upload/evidence, baseline lock |
| C4 | C4-U01..U04 | Diagnosis form, quote editor, server total/version states |
| C5 | C5-U01..U05 | Send link, public token route, approve/reject states |
| C6 | C6-U01..U04 | Repair work log, checklist, staff attribution, retry |
| C7 | C7-U01..U04 | QC checklist, pass/fail, rework states |
| C8 | C8-U01..U05 | Handover, warranty, history/timeline |
| C9 | C9-U01..U04 | Dashboard/list/filter/detail integration |
| C10 | C10-U01..U05 | Full smoke, accessibility, error matrix và local verification |

Mỗi task card phải ghi fixture được dùng, server surface, UI state, manual evidence và gate. Nếu endpoint chưa sẵn sàng, chỉ dùng fixture có nhãn rõ ràng và không giả lập business result trong runtime path.

## Out of Scope

- Tạo/sửa server endpoint, migration, database, auth policy hoặc business rule.
- Tính tổng tiền cuối, quyết định role, quyết định transition hoặc giả lập approval trong frontend.
- Đưa token, password, API secret hoặc dữ liệu nhạy cảm vào `src/ui/config/`.
- Giữ mock API trong runtime path sau khi server surface đã có fixture/endpoint tương ứng.
- Refactor toàn bộ visual system ngoài phạm vi kết nối flow MVP.

## Input Files

- [AGENTS.md](../AGENTS.md).
- [src/ui/AGENTS.md](../src/ui/AGENTS.md).
- [README.md](../README.md), nhất là MVP Scope, statuses, business rules và demo scenario.
- [docs/v0/ui-requirements.md](../docs/v0/ui-requirements.md), §§4, 6.1–6.9, 7–9.
- [docs/v0/usecase.md](../docs/v0/usecase.md), main/alternative/failure flow của cluster đang làm.
- [docs/v0/architecture-and-requirements.md](../docs/v0/architecture-and-requirements.md), role, status, privacy và audit semantics.
- Shared fixtures/decision notes trong [docs/v0](../docs/v0/README.md); không đọc archive như nguồn hiện hành.
- Baseline: [src/ui/app.js](../src/ui/app.js), [src/ui/config/routes.js](../src/ui/config/routes.js), [src/ui/config/ui.config.js](../src/ui/config/ui.config.js), [src/ui/mocks/mock-api.js](../src/ui/mocks/mock-api.js), các feature trong [src/ui/features/](../src/ui/features/), và [scripts/build-bundle.cjs](../scripts/build-bundle.cjs).

## Output Files

- `src/ui/shared/api/**` — API client/transport/error mapping dùng chung cho nhiều feature.
- `src/ui/shared/session/**` nếu cần session state dùng chung.
- `src/ui/features/**` — feature pages/actions/render theo UI requirements.
- `src/ui/config/routes.js`, `src/ui/config/ui.config.js`, `src/ui/app.js` — route/config/orchestration.
- `scripts/build-bundle.cjs` — thêm source modules mới vào generated bundle order nếu cần.
- `src/ui/app.bundle.js` — generated output, chỉ tạo bằng script.
- UI tests/fixtures nếu runtime hiện tại có test harness; nếu chưa có, ghi manual smoke evidence.

## Files To Write

Ưu tiên sửa ít file và giữ ranh giới feature-first:

- Tạo API boundary, ví dụ `src/ui/shared/api/api-client.js` và `src/ui/shared/api/repairflow-api.js`; không gọi `fetch` lặp trong từng renderer.
- Mỗi feature có entry file trùng tên thư mục; tách `state → render → actions` theo [src/ui/AGENTS.md §4–§5](../src/ui/AGENTS.md#4-quy-tắc-javascript).
- Chỉ đổi mock fixture để test/demo local; không dùng mock shape làm contract.
- Không sửa trực tiếp `src/ui/app.bundle.js`.

## API-to-UI mapping

| UI surface | Server capability (chưa freeze thành API contract) | Existing area |
| --- | --- | --- |
| Owner/Manager management session | `POST /auth/login`, `GET /me`, `POST /auth/logout` | `app.js`, new session module |
| Dashboard | `GET /dashboard` | `features/dashboard/` |
| List/search | `GET /repair-orders` | dashboard/table hoặc feature list mới |
| Detail/timeline | `GET /repair-orders/:id`, `/timeline` | `features/repair-order-detail/` |
| Intake | customers/devices/create order | feature mới hoặc order flow |
| Evidence | `POST /repair-orders/:id/evidence` | detail condition section |
| Diagnosis | `POST /repair-orders/:id/diagnosis` | detail diagnosis section |
| Quote | quote draft/update/send/version | `render-quote.js`, detail actions |
| Public link | `GET/POST /public/customer-links/:token` | `features/customer-link/` |
| Repair/QC | work log/checklist/status | detail repair/QC sections |
| Handover/warranty | handover/history | detail/sidebar/history sections |

## Technical checklist mapped to clusters

U1–U14 dưới đây là checklist kỹ thuật. Đây không phải thứ tự “server hoàn tất rồi mới làm UI”; các mục được triển khai xen kẽ theo C0–C10 trong master plan.

- [ ] **U1/C0–C1 — Read boundary and shell.** Đọc docs/fixture v0 + `src/ui/AGENTS.md`; inventory server surface/UI state, tạo transport/session boundary, không đọc/đổi API source.
- [ ] **U2/C1 — Create transport layer.** Implement một `request()` chung: base URL, `credentials: 'include'`, JSON/multipart, request id, parse success/error envelope, timeout/abort nếu runtime hỗ trợ.
- [ ] **U3/C1–C2 — Create server adapter.** Expose named functions theo capability (`getDashboard`, `listRepairOrders`, `getRepairOrder`, `createQuote`, `sendQuote`, `submitPublicDecision`, ...) và giữ mapping response/fixture một chỗ.
- [ ] **U4/C1–C2 — Configure runtime.** Đặt API base URL ở config/runtime config; không hard-code URL trong feature. Tách public link token khỏi employee order id trong route parser.
- [ ] **U5/C1 — Owner/Manager session/login.** Thêm login/loading/expired/forbidden states chỉ cho Owner/Manager; dùng cookie session, không lưu password/token thô ở UI. `GET /me` quyết định management role/capabilities hiển thị. Không hiển thị login cho Technician/Receptionist; các form chọn staff profile active khi cần ghi nhận người thực hiện.
- [ ] **U6/C9 — Replace dashboard mock.** Đổi dashboard và actions/table sang API DTO; KPI/pipeline/filter lấy isOverdue/canonical status từ server. Không tự tính processing hoặc quote totals từ mock.
- [ ] **U7/C2–C8 — Replace detail mock.** Detail lấy UUID, hiển thị orderCode; render sections từ detail DTO; action gọi status/diagnosis/evidence/quote/checklist endpoints và reload server state sau mutation.
- [ ] **U8/C2,C8 — Implement intake/history surfaces.** Bổ sung create/search customer/device/order và history theo docs UI; ngăn submit trùng với loading/disabled state; hiển thị validation từ details.
- [ ] **U9/C4–C5 — Quote flow.** Draft cho phép edit; sent/approved/rejected chỉ đọc; “Tạo phiên bản mới” gọi endpoint server; total/subtotal/decision/version hiển thị từ API. UI không tự approve order.
- [ ] **U10/C5 — Public link.** Route dùng token opaque; gọi public endpoint; redaction/error states cho expired/revoked/not found/rate limited; confirm approve/reject và khóa button sau success.
- [ ] **U11/C6–C8 — Repair/QC/handover.** Render trạng thái công việc, checklist pass/fail, handover/warranty; action visibility dùng capabilities, nhưng luôn xử lý lỗi server.
- [ ] **U12/C9–C10 — Remove runtime mock path.** Xác nhận không còn feature runtime import mock-api.js cho surface đã nối server; giữ mock chỉ cho fixture/local fallback có cờ rõ ràng nếu cần.
- [ ] **U13/C10 — Build artifact.** Cập nhật scripts/build-bundle.cjs nếu có module mới, chạy script hiện có để sinh src/ui/app.bundle.js, không chỉnh tay generated file.
- [ ] **U14/C10 — Local smoke.** Ghi kết quả kiểm chứng trong task output/PR, gồm success và các lỗi 401/403/404/409/410; không tạo API handoff hoặc release document.

## UI state rules

- `loading`: disable action có thể gửi lặp, có skeleton/spinner rõ.
- `empty`: phân biệt không có dữ liệu với lỗi API.
- `error`: hiển thị message thân thiện và giữ `error.code` để debug; không render raw stack/token.
- `forbidden`: không chỉ ẩn button; báo người dùng không có quyền.
- `conflict`: reload detail/server state trước khi cho retry.
- `public expired/revoked`: không hiển thị quote cũ như còn hiệu lực.
- `invalid transition`: dùng server message/capability mới, không tự đổi status tại client.

## Testing Plan

- **Adapter unit/manual:** envelope success/error, money string formatting, null handling, status/version/orderCode mapping, public redaction.
- **Route:** order UUID vs orderCode, public token, unknown route, refresh Owner/Manager session.
- **Feature:** loading/empty/error/disabled states, duplicate click, reload after mutation.
- **Flow smoke:** dashboard → detail → send quote → public view → approve/reject → start repair → QC fail/pass → handover/warranty.
- **Security UI:** không log cookie/password/token; không render internal note hoặc field nhạy cảm public; không nhầm staff profile với access session.
- **Build:** bundle sinh thành công từ script và không sửa generated artifact thủ công.

## Acceptance Criteria

- [ ] API client là boundary dùng chung; không có `fetch` lặp ở renderer/action từng feature.
- [ ] Dashboard/detail/customer-link chạy bằng server surface tương ứng khi endpoint/fixture của cluster đã sẵn sàng.
- [ ] UI không coi `overdue` là status server và không dùng orderCode làm credential.
- [ ] Quote total, approval, transition và permission đều do server quyết định.
- [ ] Public link approve/reject đúng version, một lần; link expired/revoked có màn hình rõ.
- [ ] UI có loading/error/empty/forbidden/conflict cho các flow có network.
- [ ] Không còn runtime import mock API cho flow đã nối server; fixture không chứa dữ liệu nhạy cảm được gửi lên server.
- [ ] Generated bundle được rebuild từ source; smoke result được ghi trong kết quả kiểm chứng của task.
