# RepairFlow v0 — product requirements and decision closure

> Vai trò: phase bắt buộc trước khi triển khai business cluster C1–C10.
>
> Mục tiêu: đóng các khoảng trống nghiệp vụ, dữ liệu, bảo mật, vận hành và UX mà delivery plan không thể tự quyết định.
>
> API contract chưa được freeze trong v0. Các API/DTO/response shape trong giai đoạn này chỉ là working draft hoặc fixture phục vụ phân tích; chỉ tạo tài liệu contract riêng sau khi Product yêu cầu và chốt đủ nghiệp vụ.

## Current status

- **Gate D0:** `OPEN — chưa đạt`.
- **Decision backlog:** 73 dòng, gồm 44 P0 và 29 P1 chưa được đóng chính thức.
- **Product sign-off:** chưa có decision log hoàn tất với owner, ngày chốt và tác động server/UI/database/test.
- **Implementation boundary:** chỉ được hoàn thiện C0 foundation, fixture, adapter skeleton và test harness; chưa mở C1–C10 business flow.
- **Access direction đã xác nhận:** chỉ Owner/Manager đăng nhập; Customer, Receptionist và Technician không có account/session riêng. Các chính sách chi tiết như identifier, session expiry, reset, brute-force và staff attribution vẫn là câu hỏi cần chốt.
- **Next gate:** Product đóng các decision P0, Codex/Antigravity ghi impact và acceptance scenario, sau đó mới xác nhận Gate D0.

## 1. Vì sao cần phase này

Master plan v1 hiện tại đã đủ để chia work giữa Codex và Antigravity, nhưng chưa đủ để triển khai toàn bộ sản phẩm mà không phát sinh quyết định ngầm. Các cluster hiện mới mô tả “làm chức năng gì”, chưa khóa hết:

- Điều kiện nào được tạo, sửa, hủy, mở lại hoặc đóng một repair order.
- Khách hàng có thể duyệt một phần, đổi phương án hoặc yêu cầu báo giá mới như thế nào.
- Cửa hàng xử lý thanh toán, thiết bị không đến nhận, thiết bị mất dữ liệu hoặc khiếu nại bảo hành ra sao.
- Receptionist/Technician không login nhưng ai chịu trách nhiệm xác thực và cách chống ghi nhận nhầm staff profile.
- File, token, session, audit, retention, backup, restore, rate limit và phân quyền vận hành chi tiết.
- Cách xử lý concurrent request, retry, upload dở dang, mất mạng, duplicate form submit và migration/rollback về sau.
- Tiêu chí non-functional: hiệu năng, availability, RPO/RTO, observability, privacy và accessibility.

Không đóng các điểm P0/P1 dưới đây trước khi code business API sẽ làm phát sinh rework ở schema, endpoint, UI flow và test fixture.

## 2. Mục tiêu và nguyên tắc

### 2.1. Mục tiêu đầu ra

- Có product decision log được Product/Owner duyệt.
- Có business rule catalog cho từng luồng chính và luồng ngoại lệ.
- Có state machine hoàn chỉnh, bao gồm transition hợp lệ, điều kiện, actor, reason và rollback behavior.
- Có data dictionary và lifecycle policy cho entity, file, token, session, audit và archive.
- Có permission matrix thực tế cho Owner/Manager và staff attribution.
- Có impact matrix cho server/UI/database để biết quyết định nào cần cập nhật implementation và fixture. Việc freeze API contract là bước sau, không phải deliverable của v0.
- Có fixture và acceptance scenario dùng chung cho Codex và Antigravity.
- Có local/non-functional checklist phù hợp với phạm vi v0.

### 2.2. Nguyên tắc quyết định

- Quyết định làm thay đổi nghiệp vụ phải được ghi thành decision, không để trong chat hoặc code review.
- Mỗi decision phải có owner, lý do, lựa chọn bị loại, impact server/UI/database và test proof.
- Khi chưa có dữ liệu thực tế, chọn default đơn giản nhất phù hợp cửa hàng nhỏ nhưng phải ghi đường mở rộng.
- Không đưa payment, inventory, notification worker vào v1 chỉ vì flow thực tế có nhắc tới; phải ghi rõ boundary.
- Không để UI tự suy ra quyền, status, totals, approval hoặc warranty policy.
- Không thêm abstraction/framework chỉ để làm discovery.

## 3. Vai trò và cách chốt

| Vai trò | Trách nhiệm |
| --- | --- |
| Product/Owner | Quyết định policy cửa hàng, phạm vi, ưu tiên, trường hợp ngoại lệ |
| Codex | Phân tích schema/API/security/transaction/operability impact và tạo server fixture |
| Antigravity | Phân tích flow/UI/accessibility/state/route/copy impact và tạo UI fixture |
| QA/Reviewer | Kiểm tra scenario, acceptance, negative path và regression |

Một decision được đóng khi:

- [ ] Câu hỏi được viết rõ và không còn cách hiểu kép.
- [ ] Product chọn một phương án hoặc chấp nhận default đã đề xuất.
- [ ] Codex ghi impact vào database/server/test.
- [ ] Antigravity ghi impact vào screen/route/state/adapter.
- [ ] Có scenario success, alternative và failure.
- [ ] Đã ghi nhận ảnh hưởng đến server/UI/database; không tự tạo version contract.
- [ ] Decision log có ngày, owner và trạng thái.

## 4. Decision backlog cần đóng

Trạng thái ban đầu của các dòng dưới đây là OPEN. Product có thể chọn default đề xuất, sửa default hoặc đánh dấu OUT-OF-SCOPE, nhưng không được bỏ trống.

### 4.1. Product, workspace và phạm vi

| ID | Mức | Câu hỏi phải chốt | Default đề xuất cho v1 | Impact cần ghi |
| --- | --- | --- | --- | --- |
| D-001 | P0 | Một tài khoản quản lý có thể thuộc bao nhiêu workspace? | Một Owner/Manager thuộc một workspace trong MVP; schema vẫn giữ membership để mở rộng | Session, me, tenant query, UI workspace picker |
| D-002 | P0 | Owner và Manager khác nhau ở quyền nào? | Owner quản trị workspace/staff/access; Manager vận hành order/quote/QC/handover; cả hai được login | Permission matrix, endpoint 403, menu |
| D-003 | P0 | Có Admin trong v1 không? | Giữ enum tương thích nhưng chưa cấp credential hoặc flow Admin trong MVP | Contract enum, seed, migration |
| D-004 | P0 | Cửa hàng có cần nhiều chi nhánh/kho không? | Không; một workspace một cửa hàng | Schema scope, query, UI |
| D-005 | P0 | KPI thành công của v1 là gì? | Hoàn tất flow, giảm thiếu evidence, tra được history, không mất audit; chưa đo doanh thu | Dashboard, analytics boundary, release sign-off |
| D-006 | P1 | Những tính năng nào bắt buộc v1 và tính năng nào v1.x? | Payment, inventory, accounting, notification automation, multi-branch là v1.x/out-of-scope | Backlog và UI placeholder |
| D-007 | P1 | Timezone, locale, currency | Workspace timezone; lưu UTC; hiển thị Asia/Ho_Chi_Minh và VND mặc định | Date query, deadline, money DTO |

### 4.2. Access, session và trách nhiệm thao tác

| ID | Mức | Câu hỏi phải chốt | Default đề xuất cho v1 | Impact cần ghi |
| --- | --- | --- | --- | --- |
| D-010 | P0 | Login identifier là email, phone hay username? | Email hoặc phone duy nhất trong workspace; UI chỉ chọn một policy | Access table, login DTO, validation |
| D-011 | P0 | Owner/Manager reset credential bằng cách nào? | Local MVP có reset token one-time qua admin/manual support; chưa gửi email tự động | Access recovery, secret handling, runbook |
| D-012 | P0 | Session expiry và revoke policy | Idle 8h, absolute 7 ngày; logout/revoke toàn bộ session khi credential reset | Session table, cookie, test |
| D-013 | P0 | Chống brute force/login abuse | Rate limit theo identifier + IP, exponential backoff, audit failure | Middleware, observability |
| D-014 | P0 | Staff profile không login thì ai là actor thật? | audit user_id là Owner/Manager session; staff_id riêng ghi người thực hiện nghiệp vụ | DTO, audit schema, UI copy |
| D-015 | P0 | Manager có được chọn bất kỳ Technician/Receptionist profile nào không? | Chỉ staff profile cùng workspace, active, đúng role; mọi selection do server validate | Assignment API, 403/409 |
| D-016 | P1 | Có cho phép ghi nhận thao tác thay cho staff profile không? | Có, nhưng bắt buộc reason và lưu acting manager + attributed staff | Audit, usecase, UI confirmation |
| D-017 | P1 | Inactive staff đang có order mở xử lý thế nào? | Không nhận assignment mới; dashboard cảnh báo; lịch sử cũ giữ nguyên; Manager reassign | Assignment, dashboard, test |
| D-018 | P1 | Nếu hai Manager cùng sửa một order thì sao? | Optimistic version/updated_at check; stale request trả CONFLICT và reload | DTO version, repository, UI conflict |

### 4.3. Customer, device và intake

| ID | Mức | Câu hỏi phải chốt | Default đề xuất cho v1 | Impact cần ghi |
| --- | --- | --- | --- | --- |
| D-020 | P0 | Một customer được nhận diện bằng gì? | Phone là khóa tìm kiếm chính; tên không unique; email optional | Unique/index/query/UI duplicate |
| D-021 | P0 | Một device được nhận diện bằng gì? | Serial/IMEI nếu có; nếu không có thì device identifier + model + note | Device duplicate rule |
| D-022 | P0 | Device có thể thuộc nhiều customer không? | Không trong MVP; đổi chủ phải tạo record/link policy riêng, không âm thầm đổi owner | FK, history, privacy |
| D-023 | P0 | Có cho tạo order khi device đang có order mở không? | Cảnh báo bắt buộc; chỉ Owner/Manager xác nhận reason mới cho tạo | Conflict, UI modal, audit |
| D-024 | P0 | Intake bắt buộc những field/evidence nào? | Customer phone/name, device type/brand/model, issue, accessories, power state, minimum checklist; ảnh theo policy | Validation, state transition |
| D-025 | P1 | Cho sửa dữ liệu intake sau khi qua diagnosis không? | Không sửa field baseline âm thầm; correction tạo amendment/audit hoặc note correction | Schema, API, history |
| D-026 | P1 | Passcode/iCloud/secret của thiết bị có lưu không? | Không lưu; UI cảnh báo và backend redact free text nếu cần | Privacy, validation |
| D-027 | P1 | Có cần customer consent cho lưu phone/ảnh không? | Lưu consent method/time ở intake nếu cửa hàng yêu cầu; không triển khai legal workflow phức tạp | Customer DTO, audit |

### 4.4. Order lifecycle và exception

| ID | Mức | Câu hỏi phải chốt | Default đề xuất cho v1 | Impact cần ghi |
| --- | --- | --- | --- | --- |
| D-030 | P0 | Full state machine canonical là gì? | received → diagnosing → waiting_for_approval → approved → repairing → quality_check → ready_for_pickup → handed_over → warranty_active; rejected/cancelled là terminal có điều kiện reopen | Status enum, transition API, UI |
| D-031 | P0 | Ai được cancel và ở trạng thái nào? | Owner/Manager; reason bắt buộc; không xóa history/evidence; quote/link xử lý theo policy | Permission, transaction, audit |
| D-032 | P0 | Có reopen order cancelled/rejected/handed_over không? | Không reopen trong v1; tạo order mới hoặc exception riêng được ghi backlog | State machine, UI action |
| D-033 | P0 | Overdue tính theo mốc nào? | expected_completed_at, workspace timezone, loại trừ terminal status; không tạo status overdue | Query, dashboard |
| D-034 | P1 | Order bị bỏ dở/no response bao lâu? | Cờ needs attention sau SLA configurable; không tự cancel | Job/derived query, notification boundary |
| D-035 | P1 | Có cho rollback status không? | Chỉ transition được liệt kê; QC failed → repairing là ngoại lệ chính; rollback mọi loại phải qua endpoint có reason | State transition test |
| D-036 | P1 | Có cần idempotency key cho mutation không? | Có cho send quote, decision, handover và create order nếu client retry | Header/storage/test |

### 4.5. Diagnosis, quote và customer decision

| ID | Mức | Câu hỏi phải chốt | Default đề xuất cho v1 | Impact cần ghi |
| --- | --- | --- | --- | --- |
| D-040 | P0 | Diagnosis có thể sửa sau khi gửi quote không? | Có thể bổ sung note trước approval; thay đổi ảnh hưởng giá phải tạo quote version mới | Diagnosis/quote relation |
| D-041 | P0 | Quote gồm discount, tax, deposit, shipping không? | v1 chỉ part/labor/service, discount optional; chưa payment/tax invoice; total vẫn là quote value | Money model, DTO |
| D-042 | P0 | Rounding money thế nào? | Decimal VND, scale 2 trong API/DB; server tính line/subtotal/total | Calculation test |
| D-043 | P0 | Quote có expiry/validity không? | Có sent_at + expires_at; expired không được approve; phát hành version mới | Public link/decision |
| D-044 | P0 | Customer có approve từng item hay chỉ toàn quote? | Chỉ approve/reject toàn quote trong v1 | Public DTO/UI |
| D-045 | P0 | Customer yêu cầu đổi phương án sau reject làm gì? | Giữ decision rejected; tạo quote version mới và link mới | Version, audit |
| D-046 | P1 | Approve qua điện thoại có được không? | Có manual exception do Owner/Manager; bắt buộc contact, note, reason, actor và audit | Endpoint/permission/usecase |
| D-047 | P1 | Có gửi thông báo tự động không? | v1 cho copy link/gửi thủ công; notification provider là adapter/backlog | UI status, no fake delivery |
| D-048 | P1 | Link có nhiều người mở/approve không? | Một decision hợp lệ cho một quote version; request sau đó conflict/idempotent theo policy | Token/decision concurrency |

### 4.6. Repair, parts, QC và rework

| ID | Mức | Câu hỏi phải chốt | Default đề xuất cho v1 | Impact cần ghi |
| --- | --- | --- | --- | --- |
| D-050 | P0 | Bắt đầu sửa cần điều kiện gì? | Quote đúng version approved, intake/diagnosis đủ, staff profile repairer active | Transition/API/UI |
| D-051 | P0 | Actual work/parts khác approved quote xử lý ra sao? | Dừng phần phát sinh; tạo version mới và customer approve lại; không có silent override | Work log/quote |
| D-052 | P1 | Có quản lý tồn kho/part availability không? | Không; chỉ ghi actual part text/metadata, inventory là v1.x | Schema/out-of-scope |
| D-053 | P0 | Rework tạo work log mới hay sửa log cũ? | Tạo log/rework event mới; không sửa/xóa log đã chốt | Timeline/audit |
| D-054 | P0 | QC ai được kết luận? | Owner/Manager trong management session chọn quality checker staff profile; required checklist + reason | Permission/QC |
| D-055 | P0 | QC fail có cần khách duyệt lại không? | Chỉ cần duyệt lại nếu scope/price thay đổi; otherwise rework giữ decision | State/version |
| D-056 | P1 | Có warranty void reason khi sửa ngoài cửa hàng không? | v1 ghi warranty status/void reason, chưa cần claim portal | Warranty model |

### 4.7. Handover, unclaimed device và warranty

| ID | Mức | Câu hỏi phải chốt | Default đề xuất cho v1 | Impact cần ghi |
| --- | --- | --- | --- | --- |
| D-060 | P0 | Có được bàn giao khi chưa thanh toán không? | Vì payment out-of-scope, handover không kiểm tra payment; phải hiển thị rõ đây là operational decision của cửa hàng | Handover policy/UI copy |
| D-061 | P0 | Xác minh người nhận thế nào? | Recipient name + contact + confirmation method; proxy recipient cần relationship/note | Handover DTO |
| D-062 | P1 | Khách không đến nhận thì order ở trạng thái nào? | ready_for_pickup giữ nguyên; dashboard SLA/needs attention; không tự warranty active | Job/query/UI |
| D-063 | P0 | Warranty bắt đầu từ thời điểm nào? | Ngày/giờ handover transaction; terms/end date lưu snapshot | Warranty test |
| D-064 | P1 | Warranty claim có nằm trong v1 không? | Chỉ lưu warranty và history; claim/reopen là v1.x | Scope/data |
| D-065 | P1 | Có cho sửa warranty sau handover không? | Không sửa snapshot âm thầm; exception Owner/Manager + reason/audit | Permission/audit |

### 4.8. File, public privacy và data lifecycle

| ID | Mức | Câu hỏi phải chốt | Default đề xuất cho v1 | Impact cần ghi |
| --- | --- | --- | --- | --- |
| D-070 | P0 | File lưu ở đâu? | Object storage private; local adapter cho dev; DB chỉ lưu metadata/object key | Storage adapter/config |
| D-071 | P0 | File retention bao lâu? | Giữ theo vòng đời order + policy cửa hàng; không hard-delete trong active flow; cần TTL/cleanup job | Storage/job/legal |
| D-072 | P0 | Public link lộ dữ liệu nào? | Customer, device summary, diagnosis, current quote, expected time; không internal note, token, audit, full staff data | Public DTO/security |
| D-073 | P0 | Token revoke/rotate thế nào? | Revoke link cũ; tạo token mới; giữ access audit; token hash only | Public endpoint |
| D-074 | P1 | Có cần privacy deletion/export không? | v1 có archive/anonymize request manual; không hard-delete audit/evidence đang tranh chấp | Data lifecycle |
| D-075 | P1 | Log chứa dữ liệu gì? | Request ID, route, status, latency, error code; redact phone/email/token/password/file content | Observability |

### 4.9. Concurrency, reliability và API behavior

| ID | Mức | Câu hỏi phải chốt | Default đề xuất cho v1 | Impact cần ghi |
| --- | --- | --- | --- | --- |
| D-080 | P0 | Retry request nhận biết thế nào? | Idempotency-Key cho mutation nhạy cảm; unique constraint + transaction làm lớp bảo vệ thứ hai | Middleware/DB/test |
| D-081 | P0 | Stale UI update xử lý thế nào? | Return 409 CONFLICT với current version summary; UI reload trước retry | DTO/UI |
| D-082 | P0 | Transaction boundary của flow nào? | create order, send quote, customer decision, QC transition, handover/warranty là atomic | Service/test |
| D-083 | P1 | Background job có cần không? | v1 chỉ cleanup/derived needs-attention nếu cần; không để job quyết định business state âm thầm | Runtime/ops |
| D-084 | P1 | API pagination/filter contract | page/pageSize/total ổn định; max page size; sort mặc định received_at desc | Query/performance |
| D-085 | P1 | Error message/copy có localization không? | Error code canonical English, UI message tiếng Việt mapping tại adapter | Contract/UI |

### 4.10. Non-functional và môi trường tương lai

| ID | Mức | Câu hỏi phải chốt | Default đề xuất cho v1 | Impact cần ghi |
| --- | --- | --- | --- | --- |
| D-090 | P0 | Environment nào phải hỗ trợ trong v0? | Chỉ local Docker DB và local application; staging/production để phase sau | Compose/local run |
| D-091 | P1 | Có cần chốt RPO/RTO trong v0 không? | Chưa; backup/restore là backlog vận hành sau khi có môi trường thật | Future ops |
| D-092 | P0 | Health/readiness criteria hiện tại | Chỉ cần API process và DB connectivity cho local verification | Local health check |
| D-093 | P1 | Performance target | p95 read < 500ms ở dataset MVP; mutation < 1s trừ upload; benchmark bằng fixture | Index/query/UI loading |
| D-094 | P0 | Accessibility/responsive target | Keyboard usable, focus/error labels, desktop management và mobile public link | UI QA |
| D-095 | P1 | Browser support | Chrome/Edge hiện hành cho internal; Safari/Chrome mobile cho public link | QA matrix |
| D-096 | P1 | Rollback policy cho môi trường deploy | Chưa chốt trong v0; chỉ yêu cầu migration có forward path và test local | Future deployment |
| D-097 | P1 | Ownership khi có lỗi vận hành | Chưa áp dụng trong v0; cần chốt khi có môi trường dùng thật | Future ops |

## 5. Các scenario bắt buộc phải viết thành acceptance test

Ngoài happy path đang có trong [usecase.md](./usecase.md), phải có scenario độc lập cho:

- Login sai nhiều lần, locked principal, reset credential, session revoke và refresh.
- Hai Manager cùng mở/sửa một order; stale update không overwrite.
- Customer phone trùng tên, device trùng identifier, device có order đang mở.
- Sửa/correction intake sau khi đã có diagnosis.
- File upload retry, file sai MIME, signed URL hết hạn, storage unavailable.
- Quote sent hết hạn, link revoke, tạo version mới, approve link cũ.
- Approve/reject đồng thời, duplicate request và network retry.
- Manual approve qua phone với reason và audit.
- Actual work/parts vượt quote, quote version mới, customer reject phương án mới.
- QC incomplete, QC fail/rework, QC pass, handover bị retry.
- Recipient là người khác customer, thiết bị không đến nhận, warranty exception.
- Staff profile inactive, reassign order, acting manager khác attributed staff.
- Cross-workspace UUID, leaked token, public DTO redaction, rate limit.
- Database migration fail và local API readiness fail. Backup/restore, application rollback và deployment incident để backlog phase sau.

Mỗi scenario cần ghi:

| Trường | Nội dung |
| --- | --- |
| Given | Dữ liệu và trạng thái ban đầu |
| When | Actor, request, UI action hoặc event |
| Then | Response/status/data/audit mong đợi |
| Alternative | Nhánh thay thế và quyền |
| Failure | Error code, rollback, UI state |
| Evidence | Test file, fixture, manual smoke |

## 6. Deliverables của phase D0

Codex:

- [ ] Decision impact matrix cho schema, migration, endpoint, transaction, security và tests.
- [ ] State machine table có tất cả transition/guard/role/reason/audit.
- [ ] Data dictionary và entity lifecycle.
- [ ] Access/session/file/token/retention design.
- [ ] Danh sách câu hỏi còn mở cho API boundary/DTO; chưa tạo contract version.
- [ ] Backend fixtures cho success/alternative/failure scenarios.

Antigravity:

- [ ] Screen/route inventory cập nhật theo decision log.
- [ ] UI state matrix: loading, empty, validation, forbidden, conflict, expired, retry, offline.
- [ ] Form field/copy/confirmation matrix cho từng mutation.
- [ ] Public redaction and responsive/accessibility checklist.
- [ ] Adapter impact list và UI fixtures.

Shared/Product:

- [ ] Decision log signed-off.
- [ ] Scope v1/v1.x/out-of-scope rõ ràng.
- [ ] Acceptance scenario catalog.
- [ ] Local quality/non-functional targets phù hợp với v0.
- [ ] Cập nhật [usecase.md](./usecase.md), architecture và database nếu decision làm thay đổi.

## 7. Gate D0 — Requirements ready for build

Chỉ mở C1 khi tất cả điều kiện sau đạt:

- [ ] Tất cả decision P0 có trạng thái CLOSED hoặc OUT-OF-SCOPE có owner.
- [ ] Không còn câu hỏi làm thay đổi identity, status, quote, approval, handover, warranty hoặc public privacy.
- [ ] State machine được Product và Codex/Antigravity review.
- [ ] Data lifecycle/file/token/session policy được review.
- [ ] Có acceptance test cho happy path và alternative/failure path.
- [ ] Không còn quyết định chưa rõ làm thay đổi identity, status, quote, approval, handover, warranty hoặc public privacy. API contract vẫn để mở cho bước sau.
- [ ] C1–C10 trong master plan đã được re-baseline theo quyết định mới.
- [ ] Product ký D0; Codex và Antigravity xác nhận có thể bắt đầu cluster đầu tiên.

Nếu D0 chưa đạt:

- Không tạo business migration/server runtime path dựa trên policy chưa chốt.
- Không nối UI vào mock như thể semantics đã chốt.
- Chỉ được làm discovery, fixture, adapter skeleton, test harness và documentation.

## 8. Luồng thực thi sau D0

Sau khi gate D0 đạt, quay lại [master plan v1](../../plans/000-repairflow-v1-implementation.md) và chạy từng cặp:

    C1 access + shell
      → C2 intake
      → C3 evidence
      → C4 diagnosis/quote
      → C5 public decision
      → C6 repair
      → C7 QC/rework
      → C8 handover/warranty/history
      → C9 dashboard
      → C10 hardening/local verification

Trong từng mũi:

- Codex và Antigravity nhận cùng fixture.
- UI có thể build trước bằng fixture.
- API có thể hoàn thiện sau nhưng phải giữ shared fixture/decision semantics; không tự tuyên bố API contract đã freeze.
- Gate chỉ đóng khi server test, UI test, shared smoke và Product decision cùng đạt.
