# RepairFlow — Yêu cầu Database và ERD

## 1. Mục tiêu và phạm vi

Tài liệu này là đặc tả dữ liệu chi tiết cho RepairFlow. Đây là nguồn tham chiếu cho thiết kế migration, API, phân quyền, transaction và các truy vấn báo cáo của MVP.

Database phải lưu được toàn bộ chuỗi có thể kiểm chứng:

```text
Workspace → Khách hàng → Thiết bị → Phiếu sửa chữa
    → Hiện trạng → Chẩn đoán → Báo giá → Quyết định khách hàng
    → Sửa chữa → Kiểm tra chất lượng → Bàn giao → Bảo hành
```

Phạm vi bao gồm:

- Workspace và thành viên.
- Khách hàng và thiết bị.
- Phiếu sửa chữa và người chịu trách nhiệm theo từng giai đoạn.
- Ảnh/bằng chứng và metadata file.
- Chẩn đoán, báo giá theo phiên bản và quyết định của khách.
- Link public có thời hạn/thu hồi.
- Nhật ký sửa chữa, checklist, kiểm tra chất lượng.
- Bàn giao, bảo hành, lịch sử trạng thái và audit log.
- Index, constraint, transaction và quy tắc cô lập dữ liệu theo workspace.

Không bao gồm trong MVP:

- Kho linh kiện hoặc bảng tồn kho.
- Thanh toán, công nợ, kế toán hoặc hóa đơn điện tử.
- Tích hợp SMS/Zalo/email tự động.
- Lịch làm việc/phân ca.
- Tài khoản khách hàng dài hạn.

## 2. Quyết định cấu hình database

| Hạng mục | Quyết định cho MVP |
| --- | --- |
| Hệ quản trị | PostgreSQL |
| Schema | `public`; phân nhóm bằng tên bảng và module ứng dụng |
| Mô hình triển khai | Một database dùng chung, tách tenant bằng `workspace_id` |
| Khóa chính | UUID v4 tạo ở backend hoặc database |
| Thời gian | `timestamptz`, lưu UTC; hiển thị theo `workspaces.timezone` |
| Tiền tệ | `numeric(14,2)`, đơn vị nhỏ nhất là VND; không dùng floating point |
| Mã phiếu | `order_code` dạng dễ đọc, unique trong workspace |
| JSON | Chỉ dùng cho checklist, phụ kiện và metadata audit; dữ liệu cần lọc/báo cáo phải là cột riêng |
| Xóa dữ liệu | Không xóa cứng bằng chứng, quyết định, lịch sử trạng thái và audit log |
| File | Object Storage private; database lưu metadata và `object_key` |
| Migration | Migration có version, chạy tuần tự và có thể rollback theo chính sách triển khai |
| Tiền tố bảng | Không bắt buộc; dùng tên số nhiều dạng `snake_case` |

### 2.1. Quy ước cột dùng chung

Các bảng nghiệp vụ chính nên có:

```text
id          uuid primary key
created_at  timestamptz not null default now()
updated_at  timestamptz not null default now()  -- nếu bản ghi có thể cập nhật
```

Quy ước khác:

- Tên cột dùng `snake_case`.
- Tên enum nội bộ dùng chữ thường và dấu gạch dưới.
- Cột ghi nhận người thực hiện dùng hậu tố `_by`, ví dụ `created_by`, `diagnosed_by`.
- Cột thời điểm dùng hậu tố `_at`, ngày nghiệp vụ không cần giờ dùng kiểu `date`.
- Không dùng `NULL` để biểu diễn trạng thái; dùng enum/status rõ ràng.
- Cột chứa dữ liệu định danh hoặc liên hệ không ghi vào URL public.

### 2.2. Mô hình truy cập và nhân sự trong MVP

- Một workspace đại diện cho một cửa hàng nhỏ trong MVP.
- Chỉ Owner/Manager có access credential và session để sử dụng API nội bộ.
- `users` là bảng hồ sơ nhân sự dùng chung cho Owner, Manager, Receptionist và Technician; bảng này không lưu password.
- Receptionist/Technician không có credential/session riêng; `user_id` trong assignment, work log, diagnosis, QC và audit được hiểu là ID hồ sơ nhân sự.
- Khách hàng không có bản ghi đăng nhập; quyền public được cấp bằng token hash trong `customer_links`.
- Nếu dùng auth provider bên ngoài, database chỉ lưu mapping access principal với workspace; không lưu secret plaintext.

## 3. Enum và miền giá trị

Có thể triển khai bằng PostgreSQL `ENUM` hoặc `CHECK constraint`. Với MVP, dùng `CHECK constraint` giúp migration dễ mở rộng hơn.

### 3.1. Nhân sự và workspace

```text
staff_profile_status:
    active | inactive | locked

membership_role:
    owner | admin | manager | receptionist | technician

membership_status:
    invited | active | suspended | removed
```

`owner`, `manager` là các role có thể đăng nhập trong MVP. `receptionist`, `technician` là role vận hành của hồ sơ nhân sự và không có credential riêng.

### 3.2. Phiếu sửa chữa

```text
repair_order_status:
    received
    diagnosing
    waiting_for_approval
    approved
    repairing
    quality_check
    ready_for_pickup
    handed_over
    warranty_active
    rejected
    cancelled
```

`rejected` dùng khi khách từ chối báo giá. `cancelled` dùng khi cửa hàng dừng phiếu vì lý do khác.

### 3.3. Trách nhiệm nhân viên và bằng chứng

```text
staff_responsibility:
    intake | diagnosis | primary_technician | repairer
    quality_checker | handover

evidence_stage:
    before_repair | diagnosis | after_repair | handover

checklist_type:
    intake | repair | quality_check | handover
```

### 3.4. Báo giá và quyết định

```text
quote_status:
    draft | sent | approved | rejected | superseded | expired | cancelled

quote_item_type:
    part | labor | service

customer_decision:
    approved | rejected
```

Ghi chú trao đổi hoặc lý do từ chối lưu trong cột `note`, không tạo thêm trạng thái nếu chưa có yêu cầu nghiệp vụ riêng.

### 3.5. Link, audit và bảo hành

```text
customer_link_purpose:
    quote_review | status_tracking

warranty_status:
    active | expired | void

actor_type:
    employee | customer | system
```

## 4. ERD tổng thể

Sơ đồ dưới đây mô tả quan hệ chính giữa các nhóm dữ liệu. Các bảng log/audit có quan hệ tham chiếu mềm tới entity vì chúng hỗ trợ nhiều loại đối tượng.

```mermaid
erDiagram
    WORKSPACES ||--o{ WORKSPACE_MEMBERSHIPS : has
    USERS ||--o{ WORKSPACE_MEMBERSHIPS : joins

    WORKSPACES ||--o{ CUSTOMERS : owns
    WORKSPACES ||--o{ DEVICES : owns
    CUSTOMERS ||--o{ DEVICES : owns

    WORKSPACES ||--o{ REPAIR_ORDERS : contains
    CUSTOMERS ||--o{ REPAIR_ORDERS : requests
    DEVICES ||--o{ REPAIR_ORDERS : enters

    REPAIR_ORDERS ||--o{ REPAIR_ORDER_STAFF : assigns
    USERS ||--o{ REPAIR_ORDER_STAFF : performs
    REPAIR_ORDERS ||--o{ REPAIR_EVIDENCE : documents
    REPAIR_ORDERS ||--o{ DIAGNOSES : has
    REPAIR_ORDERS ||--o{ QUOTES : receives
    QUOTES ||--o{ QUOTE_ITEMS : contains
    QUOTES ||--o{ CUSTOMER_DECISIONS : receives

    REPAIR_ORDERS ||--o{ CUSTOMER_LINKS : exposes
    QUOTES ||--o{ CUSTOMER_LINKS : reviews
    CUSTOMER_LINKS ||--o{ CUSTOMER_DECISIONS : sources

    REPAIR_ORDERS ||--o{ REPAIR_WORK_LOGS : records
    REPAIR_ORDERS ||--o{ CHECKLISTS : uses
    REPAIR_ORDERS ||--o{ HANDOVER_RECORDS : closes
    REPAIR_ORDERS ||--o{ WARRANTIES : activates
    REPAIR_ORDERS ||--o{ STATUS_HISTORY : changes

    WORKSPACES ||--o{ AUDIT_LOGS : owns
    USERS ||--o{ AUDIT_LOGS : performs
```

## 5. Đặc tả bảng và cột

### 5.1. `workspaces`

Đại diện cho cửa hàng hoặc không gian làm việc. Đây là tenant gốc của dữ liệu nghiệp vụ.

| Cột | Kiểu | Null | Mặc định | Ràng buộc và ý nghĩa |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | — | PK |
| `name` | `varchar(160)` | Không | — | Tên cửa hàng |
| `phone` | `varchar(32)` | Có | `NULL` | Số liên hệ của cửa hàng |
| `address` | `text` | Có | `NULL` | Địa chỉ hiển thị cho khách |
| `timezone` | `varchar(64)` | Không | `'Asia/Ho_Chi_Minh'` | Tên timezone hợp lệ của IANA |
| `created_at` | `timestamptz` | Không | `now()` | Thời điểm tạo |
| `updated_at` | `timestamptz` | Không | `now()` | Thời điểm cập nhật gần nhất |

### 5.2. `users` — hồ sơ nhân sự

Đại diện cho hồ sơ nhân sự của cửa hàng, không mặc định là tài khoản đăng nhập. Không lưu password hoặc credential trong bảng này. Access credential/session của Owner/Manager thuộc access module riêng.

| Cột | Kiểu | Null | Mặc định | Ràng buộc và ý nghĩa |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | — | PK |
| `name` | `varchar(160)` | Không | — | Tên hiển thị |
| `email` | `citext` hoặc `varchar(320)` | Có | `NULL` | Email liên hệ; chỉ dùng làm login identifier nếu access module chọn email |
| `phone` | `varchar(32)` | Có | `NULL` | Số điện thoại nhân viên |
| `status` | `varchar(16)` | Không | `'active'` | `active`, `inactive`, `locked` |
| `last_login_at` | `timestamptz` | Có | `NULL` | Legacy/optional; không áp dụng cho Technician/Receptionist không có login |
| `created_at` | `timestamptz` | Không | `now()` | Thời điểm tạo |
| `updated_at` | `timestamptz` | Không | `now()` | Thời điểm cập nhật |

### 5.3. `workspace_memberships`

Liên kết hồ sơ nhân sự với workspace và lưu vai trò vận hành.

Membership không đồng nghĩa với việc nhân sự có thể đăng nhập. Chỉ Owner/Manager được cấp access credential trong MVP.

| Cột | Kiểu | Null | Mặc định | Ràng buộc và ý nghĩa |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | — | PK |
| `workspace_id` | `uuid` | Không | — | FK → `workspaces.id` |
| `user_id` | `uuid` | Không | — | FK → `users.id` |
| `role` | `varchar(24)` | Không | — | `owner`, `admin`, `manager`, `receptionist`, `technician` |
| `status` | `varchar(16)` | Không | `'invited'` | Trạng thái thành viên |
| `invited_at` | `timestamptz` | Có | `NULL` | Thời điểm gửi lời mời |
| `joined_at` | `timestamptz` | Có | `NULL` | Thời điểm tham gia |
| `created_at` | `timestamptz` | Không | `now()` | Thời điểm tạo |
| `updated_at` | `timestamptz` | Không | `now()` | Thời điểm cập nhật |

Ràng buộc: `unique(workspace_id, user_id)`.

### 5.4. `customers`

Hồ sơ khách hàng thuộc một workspace.

| Cột | Kiểu | Null | Mặc định | Ràng buộc và ý nghĩa |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | — | PK |
| `workspace_id` | `uuid` | Không | — | FK → `workspaces.id` |
| `name` | `varchar(160)` | Không | — | Tên khách hàng |
| `phone` | `varchar(32)` | Không | — | Số điện thoại chính |
| `email` | `varchar(320)` | Có | `NULL` | Email |
| `note` | `text` | Có | `NULL` | Ghi chú nội bộ |
| `created_at` | `timestamptz` | Không | `now()` | Thời điểm tạo |
| `updated_at` | `timestamptz` | Không | `now()` | Thời điểm cập nhật |

Không nên đặt unique tuyệt đối cho số điện thoại toàn database. Nếu cần chống trùng, dùng unique theo `workspace_id` sau khi chuẩn hóa số điện thoại.

### 5.5. `devices`

Thiết bị thuộc khách hàng trong một workspace. Một thiết bị có thể có nhiều phiếu sửa chữa theo thời gian.

| Cột | Kiểu | Null | Mặc định | Ràng buộc và ý nghĩa |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | — | PK |
| `workspace_id` | `uuid` | Không | — | FK → `workspaces.id` |
| `customer_id` | `uuid` | Không | — | FK → `customers.id` |
| `device_type` | `varchar(32)` | Không | — | Điện thoại, laptop, tablet… |
| `brand` | `varchar(80)` | Không | — | Hãng |
| `model` | `varchar(120)` | Không | — | Model |
| `serial_number` | `varchar(160)` | Có | `NULL` | Serial number nếu có |
| `device_identifier` | `varchar(160)` | Có | `NULL` | Mã nhận diện khác |
| `note` | `text` | Có | `NULL` | Ghi chú thiết bị |
| `created_at` | `timestamptz` | Không | `now()` | Thời điểm tạo |
| `updated_at` | `timestamptz` | Không | `now()` | Thời điểm cập nhật |

Có thể dùng unique có điều kiện cho `(workspace_id, serial_number)` khi `serial_number is not null`.

### 5.6. `repair_orders`

Phiếu sửa chữa là entity trung tâm của toàn bộ nghiệp vụ.

| Cột | Kiểu | Null | Mặc định | Ràng buộc và ý nghĩa |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | — | PK |
| `workspace_id` | `uuid` | Không | — | FK → `workspaces.id` |
| `order_code` | `varchar(32)` | Không | — | Unique trong workspace |
| `customer_id` | `uuid` | Không | — | FK → `customers.id` |
| `device_id` | `uuid` | Không | — | FK → `devices.id` |
| `status` | `varchar(32)` | Không | `'received'` | Trạng thái nghiệp vụ |
| `customer_description` | `text` | Không | — | Mô tả lỗi do khách cung cấp |
| `internal_note` | `text` | Có | `NULL` | Ghi chú nội bộ |
| `received_at` | `timestamptz` | Không | `now()` | Thời điểm tiếp nhận |
| `expected_completed_at` | `timestamptz` | Có | `NULL` | Thời gian dự kiến hoàn tất |
| `completed_at` | `timestamptz` | Có | `NULL` | Thời điểm hoàn tất nghiệp vụ |
| `created_by` | `uuid` | Không | — | FK → `users.id` |
| `created_at` | `timestamptz` | Không | `now()` | Thời điểm tạo |
| `updated_at` | `timestamptz` | Không | `now()` | Thời điểm cập nhật |

Khi truy vấn phiếu, backend phải kiểm tra cả `workspace_id` của phiếu, khách hàng, thiết bị và người dùng liên quan.

### 5.7. `repair_order_staff`

Lưu người tham gia theo từng trách nhiệm, thay cho việc chỉ có một `assigned_technician_id`.

| Cột | Kiểu | Null | Mặc định | Ràng buộc và ý nghĩa |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | — | PK |
| `repair_order_id` | `uuid` | Không | — | FK → `repair_orders.id` |
| `user_id` | `uuid` | Không | — | FK → `users.id` |
| `responsibility` | `varchar(32)` | Không | — | Vai trò trong phiếu |
| `is_primary` | `boolean` | Không | `false` | Người chính của trách nhiệm đó |
| `assigned_at` | `timestamptz` | Không | `now()` | Thời điểm phân công |
| `completed_at` | `timestamptz` | Có | `NULL` | Thời điểm hoàn tất trách nhiệm |
| `note` | `text` | Có | `NULL` | Ghi chú phân công |

Ràng buộc đề xuất:

- `unique(repair_order_id, user_id, responsibility)`.
- Tối đa một bản ghi `is_primary = true` cho mỗi `(repair_order_id, responsibility)`.

### 5.8. `repair_evidence`

Lưu metadata của ảnh/tài liệu. Nội dung file nằm trong Object Storage.

| Cột | Kiểu | Null | Mặc định | Ràng buộc và ý nghĩa |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | — | PK |
| `repair_order_id` | `uuid` | Không | — | FK → `repair_orders.id` |
| `stage` | `varchar(24)` | Không | — | Giai đoạn của bằng chứng |
| `object_key` | `varchar(512)` | Không | — | Khóa object storage, nguồn tham chiếu chính |
| `file_url` | `text` | Có | `NULL` | URL dẫn xuất hoặc legacy; không lưu signed URL lâu dài |
| `file_name` | `varchar(255)` | Không | — | Tên file gốc hiển thị |
| `mime_type` | `varchar(120)` | Không | — | MIME type đã kiểm tra |
| `file_size` | `bigint` | Không | — | Kích thước byte, phải lớn hơn 0 |
| `checksum` | `varchar(128)` | Không | — | Hash kiểm tra tính toàn vẹn |
| `description` | `text` | Có | `NULL` | Mô tả ảnh/tài liệu |
| `captured_by` | `uuid` | Không | — | FK → `users.id` |
| `captured_at` | `timestamptz` | Không | `now()` | Thời điểm chụp/tải lên |

Không xóa cứng bản ghi này trong luồng nghiệp vụ thông thường. Nếu cần ẩn file, bổ sung trạng thái lưu trữ ở migration riêng.

### 5.9. `diagnoses`

Lưu kết quả chẩn đoán của kỹ thuật viên. Có thể có nhiều bản ghi nếu phiếu được chẩn đoán lại.

| Cột | Kiểu | Null | Mặc định | Ràng buộc và ý nghĩa |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | — | PK |
| `repair_order_id` | `uuid` | Không | — | FK → `repair_orders.id` |
| `findings` | `text` | Không | — | Kết quả kiểm tra |
| `cause` | `text` | Có | `NULL` | Nguyên nhân lỗi |
| `recommendation` | `text` | Không | — | Đề xuất xử lý |
| `estimated_duration` | `integer` | Có | `NULL` | Số phút dự kiến |
| `diagnosed_by` | `uuid` | Không | — | FK → `users.id` |
| `created_at` | `timestamptz` | Không | `now()` | Thời điểm tạo |
| `updated_at` | `timestamptz` | Không | `now()` | Thời điểm cập nhật |

### 5.10. `quotes`

Lưu từng phiên bản báo giá. Không cập nhật nội dung của báo giá đã gửi hoặc đã duyệt.

| Cột | Kiểu | Null | Mặc định | Ràng buộc và ý nghĩa |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | — | PK |
| `repair_order_id` | `uuid` | Không | — | FK → `repair_orders.id` |
| `version` | `integer` | Không | — | Số phiên bản, bắt đầu từ 1 |
| `status` | `varchar(24)` | Không | `'draft'` | Trạng thái báo giá |
| `currency` | `char(3)` | Không | `'VND'` | MVP chỉ hỗ trợ VND |
| `subtotal` | `numeric(14,2)` | Không | `0` | Tổng trước điều chỉnh |
| `total` | `numeric(14,2)` | Không | `0` | Tổng khách cần duyệt |
| `note` | `text` | Có | `NULL` | Ghi chú gửi khách |
| `created_by` | `uuid` | Không | — | FK → `users.id` |
| `sent_at` | `timestamptz` | Có | `NULL` | Thời điểm gửi public link |
| `created_at` | `timestamptz` | Không | `now()` | Thời điểm tạo |
| `updated_at` | `timestamptz` | Không | `now()` | Chỉ cập nhật khi còn draft |

Ràng buộc:

- `unique(repair_order_id, version)`.
- `subtotal >= 0` và `total >= 0`.
- Chỉ một báo giá hiện hành ở trạng thái `draft` hoặc `sent` cho mỗi phiếu.
- Báo giá đã `approved`, `rejected`, `superseded` hoặc `expired` không được sửa nội dung.

### 5.11. `quote_items`

Các dòng linh kiện, công sửa hoặc dịch vụ trong một phiên bản báo giá.

| Cột | Kiểu | Null | Mặc định | Ràng buộc và ý nghĩa |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | — | PK |
| `quote_id` | `uuid` | Không | — | FK → `quotes.id` |
| `item_type` | `varchar(16)` | Không | — | `part`, `labor`, `service` |
| `description` | `varchar(500)` | Không | — | Tên/mô tả dòng báo giá |
| `quantity` | `numeric(12,2)` | Không | `1` | Phải lớn hơn 0 |
| `unit_price` | `numeric(14,2)` | Không | `0` | Không âm |
| `line_total` | `numeric(14,2)` | Không | — | `quantity * unit_price`, tính trong transaction |
| `replacement_reason` | `text` | Có | `NULL` | Lý do thay thế/sửa chữa |
| `estimated_duration` | `integer` | Có | `NULL` | Số phút dự kiến cho dòng |
| `sort_order` | `integer` | Không | `0` | Thứ tự hiển thị |
| `created_at` | `timestamptz` | Không | `now()` | Thời điểm tạo |

`line_total`, `subtotal` và `total` phải được tính lại từ server trong cùng transaction; client không được tự quyết định giá trị cuối.

### 5.12. `customer_decisions`

Lưu quyết định của khách và phiên bản báo giá mà quyết định đó áp dụng.

| Cột | Kiểu | Null | Mặc định | Ràng buộc và ý nghĩa |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | — | PK |
| `quote_id` | `uuid` | Không | — | FK → `quotes.id` |
| `decision` | `varchar(16)` | Không | — | `approved` hoặc `rejected` |
| `customer_name` | `varchar(160)` | Không | — | Snapshot tên tại thời điểm quyết định |
| `customer_contact_snapshot` | `jsonb` | Không | — | Snapshot phone/email cần thiết |
| `note` | `text` | Có | `NULL` | Lý do từ chối hoặc ghi chú |
| `decided_at` | `timestamptz` | Không | `now()` | Thời điểm quyết định |
| `source_link_id` | `uuid` | Không | — | FK → `customer_links.id` |
| `created_at` | `timestamptz` | Không | `now()` | Thời điểm tạo bản ghi |

Chỉ cho phép một quyết định hợp lệ cuối cùng cho mỗi quote. Các lần thử hoặc request lỗi phải nằm trong audit log, không ghi thành nhiều quyết định hợp lệ.

### 5.13. `customer_links`

Link public giới hạn quyền xem đúng phiếu/báo giá.

| Cột | Kiểu | Null | Mặc định | Ràng buộc và ý nghĩa |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | — | PK |
| `repair_order_id` | `uuid` | Không | — | FK → `repair_orders.id` |
| `quote_id` | `uuid` | Có | `NULL` | FK → `quotes.id`; bắt buộc với `quote_review` |
| `purpose` | `varchar(24)` | Không | — | `quote_review` hoặc `status_tracking` |
| `token_hash` | `varchar(128)` | Không | — | Hash token, unique |
| `expires_at` | `timestamptz` | Không | — | Thời điểm hết hạn |
| `last_accessed_at` | `timestamptz` | Có | `NULL` | Lần truy cập gần nhất |
| `revoked_at` | `timestamptz` | Có | `NULL` | Null nghĩa là chưa thu hồi |
| `created_at` | `timestamptz` | Không | `now()` | Thời điểm tạo |

Token thô chỉ xuất hiện khi tạo link và không được lưu trong database. Backend phải kiểm tra `token_hash`, `expires_at`, `revoked_at`, `repair_order_id` và `quote_id` trước mọi thao tác public.

### 5.14. `repair_work_logs`

Nhật ký công việc thực tế của kỹ thuật viên.

| Cột | Kiểu | Null | Mặc định | Ràng buộc và ý nghĩa |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | — | PK |
| `repair_order_id` | `uuid` | Không | — | FK → `repair_orders.id` |
| `technician_id` | `uuid` | Không | — | FK → `users.id` |
| `summary` | `text` | Không | — | Tóm tắt công việc đã làm |
| `started_at` | `timestamptz` | Có | `NULL` | Bắt đầu công việc |
| `ended_at` | `timestamptz` | Có | `NULL` | Kết thúc công việc |
| `note` | `text` | Có | `NULL` | Ghi chú |
| `created_at` | `timestamptz` | Không | `now()` | Thời điểm ghi log |

Nếu có cả hai thời điểm, `ended_at >= started_at`.

### 5.15. `checklists`

Lưu checklist intake, repair, quality check hoặc handover dưới dạng JSONB trong MVP.

| Cột | Kiểu | Null | Mặc định | Ràng buộc và ý nghĩa |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | — | PK |
| `repair_order_id` | `uuid` | Không | — | FK → `repair_orders.id` |
| `checklist_type` | `varchar(24)` | Không | — | Loại checklist |
| `content_json` | `jsonb` | Không | `'{}'` | Danh sách item, kết quả, ghi chú |
| `completed_by` | `uuid` | Có | `NULL` | FK → `users.id` |
| `completed_at` | `timestamptz` | Có | `NULL` | Null nếu chưa hoàn tất |
| `created_at` | `timestamptz` | Không | `now()` | Thời điểm tạo |
| `updated_at` | `timestamptz` | Không | `now()` | Thời điểm cập nhật |

Với `quality_check`, `completed_at` chỉ được ghi khi có kết luận rõ ràng `passed` hoặc `failed` trong `content_json`.

### 5.16. `handover_records`

Biên bản bàn giao thiết bị.

| Cột | Kiểu | Null | Mặc định | Ràng buộc và ý nghĩa |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | — | PK |
| `repair_order_id` | `uuid` | Không | — | FK → `repair_orders.id` |
| `recipient_name` | `varchar(160)` | Không | — | Người nhận thiết bị |
| `returned_accessories` | `jsonb` | Không | `'[]'` | Danh sách phụ kiện trả lại |
| `final_condition_note` | `text` | Không | — | Tình trạng cuối |
| `confirmed_at` | `timestamptz` | Không | `now()` | Thời điểm xác nhận |
| `handed_over_by` | `uuid` | Không | — | FK → `users.id` |
| `created_at` | `timestamptz` | Không | `now()` | Thời điểm tạo |

MVP chỉ cho phép một biên bản bàn giao hợp lệ cuối cùng cho mỗi phiếu; bản sửa đổi phải tạo audit log hoặc version riêng trước khi mở rộng.

### 5.17. `warranties`

Lưu chính sách và thời hạn bảo hành được kích hoạt khi bàn giao.

| Cột | Kiểu | Null | Mặc định | Ràng buộc và ý nghĩa |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | — | PK |
| `repair_order_id` | `uuid` | Không | — | FK → `repair_orders.id` |
| `start_date` | `date` | Không | — | Mặc định bằng ngày bàn giao |
| `end_date` | `date` | Không | — | Phải lớn hơn hoặc bằng `start_date` |
| `warranty_terms` | `text` | Không | — | Điều khoản hiển thị |
| `status` | `varchar(16)` | Không | `'active'` | `active`, `expired`, `void` |
| `created_at` | `timestamptz` | Không | `now()` | Thời điểm tạo |
| `updated_at` | `timestamptz` | Không | `now()` | Thời điểm cập nhật |

### 5.18. `status_history`

Timeline nghiệp vụ của phiếu. Đây là lịch sử chuyển trạng thái, không thay thế audit log bảo mật.

| Cột | Kiểu | Null | Mặc định | Ràng buộc và ý nghĩa |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | — | PK |
| `repair_order_id` | `uuid` | Không | — | FK → `repair_orders.id` |
| `from_status` | `varchar(32)` | Có | `NULL` | Null ở sự kiện tạo phiếu |
| `to_status` | `varchar(32)` | Không | — | Trạng thái mới |
| `changed_by` | `uuid` | Có | `NULL` | FK → `users.id`; null nếu system job |
| `reason` | `text` | Có | `NULL` | Bắt buộc với ngoại lệ hoặc từ chối |
| `created_at` | `timestamptz` | Không | `now()` | Thời điểm chuyển |

Không update hoặc delete bản ghi lịch sử trong hoạt động thông thường.

### 5.19. `audit_logs`

Log bất biến cho hành động nhạy cảm và truy vết bảo mật.

| Cột | Kiểu | Null | Mặc định | Ràng buộc và ý nghĩa |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | — | PK |
| `workspace_id` | `uuid` | Không | — | FK → `workspaces.id` |
| `user_id` | `uuid` | Có | `NULL` | FK → `users.id`; null với customer/system |
| `actor_type` | `varchar(16)` | Không | — | `employee`, `customer`, `system` |
| `entity_type` | `varchar(64)` | Không | — | Tên loại entity |
| `entity_id` | `uuid` | Không | — | ID entity; tham chiếu mềm |
| `action` | `varchar(64)` | Không | — | Ví dụ `quote_sent`, `quote_approved` |
| `metadata_json` | `jsonb` | Không | `'{}'` | Dữ liệu bổ sung, không chứa token thô |
| `ip_hash` | `varchar(128)` | Có | `NULL` | Hash IP nếu cần truy vết |
| `user_agent` | `text` | Có | `NULL` | User agent đã giới hạn kích thước |
| `created_at` | `timestamptz` | Không | `now()` | Thời điểm hành động |

## 6. Sơ đồ ERD theo module

### 6.1. Identity và multi-tenant

```mermaid
erDiagram
    WORKSPACES {
        uuid id PK
        varchar name
        varchar timezone
    }
    USERS {
        uuid id PK
        varchar name
        varchar email
        varchar status
    }
    WORKSPACE_MEMBERSHIPS {
        uuid id PK
        uuid workspace_id FK
        uuid user_id FK
        varchar role
        varchar status
    }
    WORKSPACES ||--o{ WORKSPACE_MEMBERSHIPS : contains
    USERS ||--o{ WORKSPACE_MEMBERSHIPS : belongs_to
```

### 6.2. Khách hàng, thiết bị và phiếu

```mermaid
erDiagram
    WORKSPACES {
        uuid id PK
        varchar name
    }
    CUSTOMERS {
        uuid id PK
        uuid workspace_id FK
        varchar name
        varchar phone
    }
    DEVICES {
        uuid id PK
        uuid workspace_id FK
        uuid customer_id FK
        varchar device_type
        varchar brand
        varchar model
        varchar serial_number
    }
    REPAIR_ORDERS {
        uuid id PK
        uuid workspace_id FK
        uuid customer_id FK
        uuid device_id FK
        varchar order_code
        varchar status
        timestamptz received_at
    }
    REPAIR_ORDER_STAFF {
        uuid id PK
        uuid repair_order_id FK
        uuid user_id FK
        varchar responsibility
    }
    USERS {
        uuid id PK
        varchar name
    }
    WORKSPACES ||--o{ CUSTOMERS : owns
    WORKSPACES ||--o{ DEVICES : owns
    CUSTOMERS ||--o{ DEVICES : owns
    WORKSPACES ||--o{ REPAIR_ORDERS : contains
    CUSTOMERS ||--o{ REPAIR_ORDERS : requests
    DEVICES ||--o{ REPAIR_ORDERS : has_history
    REPAIR_ORDERS ||--o{ REPAIR_ORDER_STAFF : assigns
    USERS ||--o{ REPAIR_ORDER_STAFF : performs
```

### 6.3. Hiện trạng, chẩn đoán và báo giá

```mermaid
erDiagram
    REPAIR_ORDERS {
        uuid id PK
        varchar order_code
        varchar status
    }
    USERS {
        uuid id PK
        varchar name
    }
    REPAIR_EVIDENCE {
        uuid id PK
        uuid repair_order_id FK
        uuid captured_by FK
        varchar stage
        varchar object_key
    }
    DIAGNOSES {
        uuid id PK
        uuid repair_order_id FK
        uuid diagnosed_by FK
        text findings
        text recommendation
    }
    QUOTES {
        uuid id PK
        uuid repair_order_id FK
        uuid created_by FK
        int version
        varchar status
        numeric total
    }
    QUOTE_ITEMS {
        uuid id PK
        uuid quote_id FK
        varchar item_type
        numeric quantity
        numeric unit_price
        numeric line_total
    }
    REPAIR_ORDERS ||--o{ REPAIR_EVIDENCE : documents
    USERS ||--o{ REPAIR_EVIDENCE : captures
    REPAIR_ORDERS ||--o{ DIAGNOSES : has
    USERS ||--o{ DIAGNOSES : diagnoses
    REPAIR_ORDERS ||--o{ QUOTES : versions
    USERS ||--o{ QUOTES : creates
    QUOTES ||--o{ QUOTE_ITEMS : contains
```

### 6.4. Link public và quyết định khách hàng

```mermaid
erDiagram
    REPAIR_ORDERS {
        uuid id PK
        varchar order_code
    }
    QUOTES {
        uuid id PK
        uuid repair_order_id FK
        int version
        varchar status
    }
    CUSTOMER_LINKS {
        uuid id PK
        uuid repair_order_id FK
        uuid quote_id FK
        varchar purpose
        varchar token_hash
        timestamptz expires_at
        timestamptz revoked_at
    }
    CUSTOMER_DECISIONS {
        uuid id PK
        uuid quote_id FK
        uuid source_link_id FK
        varchar decision
        timestamptz decided_at
    }
    REPAIR_ORDERS ||--o{ CUSTOMER_LINKS : exposes
    QUOTES ||--o{ CUSTOMER_LINKS : reviews
    QUOTES ||--o{ CUSTOMER_DECISIONS : receives
    CUSTOMER_LINKS ||--o{ CUSTOMER_DECISIONS : sources
```

### 6.5. Sửa chữa, QC, bàn giao và bảo hành

```mermaid
erDiagram
    REPAIR_ORDERS {
        uuid id PK
        varchar order_code
        varchar status
    }
    USERS {
        uuid id PK
        varchar name
    }
    REPAIR_WORK_LOGS {
        uuid id PK
        uuid repair_order_id FK
        uuid technician_id FK
        text summary
        timestamptz started_at
        timestamptz ended_at
    }
    CHECKLISTS {
        uuid id PK
        uuid repair_order_id FK
        varchar checklist_type
        jsonb content_json
        uuid completed_by FK
    }
    HANDOVER_RECORDS {
        uuid id PK
        uuid repair_order_id FK
        uuid handed_over_by FK
        varchar recipient_name
        timestamptz confirmed_at
    }
    WARRANTIES {
        uuid id PK
        uuid repair_order_id FK
        date start_date
        date end_date
        varchar status
    }
    REPAIR_ORDERS ||--o{ REPAIR_WORK_LOGS : records
    USERS ||--o{ REPAIR_WORK_LOGS : performs
    REPAIR_ORDERS ||--o{ CHECKLISTS : uses
    USERS ||--o{ CHECKLISTS : completes
    REPAIR_ORDERS ||--o{ HANDOVER_RECORDS : has
    USERS ||--o{ HANDOVER_RECORDS : hands_over
    REPAIR_ORDERS ||--o{ WARRANTIES : activates
```

## 7. Bảng quan hệ và chính sách khóa ngoại

| Bảng con | Cột FK | Bảng cha | Cardinality | `ON DELETE` đề xuất | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| `workspace_memberships` | `workspace_id` | `workspaces` | N:1 | `RESTRICT` | Không xóa workspace nếu còn dữ liệu |
| `workspace_memberships` | `user_id` | `users` | N:1 | `RESTRICT` | Giữ lịch sử người dùng |
| `customers` | `workspace_id` | `workspaces` | N:1 | `RESTRICT` | Tenant bắt buộc |
| `devices` | `workspace_id` | `workspaces` | N:1 | `RESTRICT` | Tenant bắt buộc |
| `devices` | `customer_id` | `customers` | N:1 | `RESTRICT` | Không xóa khách có thiết bị |
| `repair_orders` | `workspace_id` | `workspaces` | N:1 | `RESTRICT` | Tenant bắt buộc |
| `repair_orders` | `customer_id` | `customers` | N:1 | `RESTRICT` | Giữ lịch sử phiếu |
| `repair_orders` | `device_id` | `devices` | N:1 | `RESTRICT` | Giữ lịch sử thiết bị |
| `repair_orders` | `created_by` | `users` | N:1 | `RESTRICT` | Không mất người tạo |
| `repair_order_staff` | `repair_order_id` | `repair_orders` | N:1 | `RESTRICT` | Có thể archive phiếu thay vì xóa |
| `repair_order_staff` | `user_id` | `users` | N:1 | `RESTRICT` | Nhân viên inactive vẫn còn lịch sử |
| `repair_evidence` | `repair_order_id` | `repair_orders` | N:1 | `RESTRICT` | Không cascade xóa bằng chứng |
| `repair_evidence` | `captured_by` | `users` | N:1 | `RESTRICT` | Giữ người chụp |
| `diagnoses` | `repair_order_id` | `repair_orders` | N:1 | `RESTRICT` | Có thể chẩn đoán lại |
| `diagnoses` | `diagnosed_by` | `users` | N:1 | `RESTRICT` | Giữ người chẩn đoán |
| `quotes` | `repair_order_id` | `repair_orders` | N:1 | `RESTRICT` | Giữ mọi phiên bản |
| `quotes` | `created_by` | `users` | N:1 | `RESTRICT` | Giữ người tạo |
| `quote_items` | `quote_id` | `quotes` | N:1 | `RESTRICT` | Không sửa/xóa quote đã gửi |
| `customer_decisions` | `quote_id` | `quotes` | N:1 | `RESTRICT` | Quyết định gắn với version |
| `customer_decisions` | `source_link_id` | `customer_links` | N:1 | `RESTRICT` | Truy được nguồn quyết định |
| `customer_links` | `repair_order_id` | `repair_orders` | N:1 | `RESTRICT` | Link có thể revoke |
| `customer_links` | `quote_id` | `quotes` | N:1 | `RESTRICT` | Link báo giá phải đúng version |
| `repair_work_logs` | `repair_order_id` | `repair_orders` | N:1 | `RESTRICT` | Giữ nhật ký thực hiện |
| `repair_work_logs` | `technician_id` | `users` | N:1 | `RESTRICT` | Giữ người sửa |
| `checklists` | `repair_order_id` | `repair_orders` | N:1 | `RESTRICT` | Giữ kết quả kiểm tra |
| `checklists` | `completed_by` | `users` | N:1 | `RESTRICT` | Giữ người hoàn tất |
| `handover_records` | `repair_order_id` | `repair_orders` | N:1 | `RESTRICT` | Bàn giao là bằng chứng |
| `handover_records` | `handed_over_by` | `users` | N:1 | `RESTRICT` | Giữ người bàn giao |
| `warranties` | `repair_order_id` | `repair_orders` | N:1 | `RESTRICT` | Bảo hành gắn với phiếu |
| `status_history` | `repair_order_id` | `repair_orders` | N:1 | `RESTRICT` | Timeline bất biến |
| `status_history` | `changed_by` | `users` | N:1 | `SET NULL` | Cho phép giữ log nếu user bị xóa khỏi hệ thống auth |
| `audit_logs` | `workspace_id` | `workspaces` | N:1 | `RESTRICT` | Audit thuộc tenant |
| `audit_logs` | `user_id` | `users` | N:1 | `SET NULL` | Có thể là customer/system |

`ON UPDATE CASCADE` không cần dùng cho UUID hoặc các khóa nghiệp vụ đã ổn định. Không dùng `ON DELETE CASCADE` cho dữ liệu bằng chứng và audit.

## 8. Unique constraint và index

### 8.1. Unique constraint

```text
workspace_memberships(workspace_id, user_id)
repair_orders(workspace_id, order_code)
quotes(repair_order_id, version)
customer_links(token_hash)
```

Unique có điều kiện đề xuất:

```text
devices(workspace_id, serial_number)
    WHERE serial_number IS NOT NULL

repair_order_staff(repair_order_id, responsibility)
    WHERE is_primary = TRUE
```

### 8.2. Index bắt buộc

```text
repair_orders(workspace_id, status)
repair_orders(workspace_id, expected_completed_at)
repair_orders(workspace_id, order_code)
repair_orders(customer_id)
repair_orders(device_id)

customers(workspace_id, phone)
devices(workspace_id, serial_number)
repair_order_staff(user_id, repair_order_id)
repair_order_staff(repair_order_id, responsibility)

repair_evidence(repair_order_id, stage, captured_at)
diagnoses(repair_order_id, created_at)
quotes(repair_order_id, version DESC)
quote_items(quote_id, sort_order)
customer_decisions(quote_id, decided_at DESC)
customer_links(token_hash)
customer_links(repair_order_id, expires_at)

repair_work_logs(repair_order_id, started_at)
checklists(repair_order_id, checklist_type)
status_history(repair_order_id, created_at)
warranties(end_date, status)
audit_logs(workspace_id, entity_type, entity_id, created_at)
```

Không tạo index cho mọi cột theo mặc định. Chỉ thêm index dựa trên truy vấn thực tế và explain plan.

## 9. Quy tắc toàn vẹn nghiệp vụ ở database/API

### 9.1. Cô lập workspace

Mọi truy vấn nghiệp vụ phải có điều kiện tenant:

```text
WHERE workspace_id = current_workspace_id
```

Với bảng không có `workspace_id` trực tiếp, backend phải join qua `repair_orders`, `customers`, `quotes` hoặc bảng cha tương ứng trước khi đọc/ghi.

### 9.2. Tạo phiếu

Trong một transaction:

1. Tạo hoặc lấy customer đúng workspace.
2. Tạo hoặc lấy device đúng workspace và customer.
3. Tạo `repair_orders` với trạng thái `received`.
4. Ghi người tạo vào `created_by`.
5. Tạo `repair_order_staff` cho người tiếp nhận nếu đã xác định.
6. Ghi sự kiện đầu tiên vào `status_history` với `from_status = NULL`.
7. Ghi `audit_logs` cho hành động tạo phiếu.

### 9.3. Gửi báo giá

Trong một transaction:

1. Khóa bản ghi quote hiện hành bằng `SELECT ... FOR UPDATE`.
2. Kiểm tra quote đang ở `draft` và có ít nhất một item hợp lệ.
3. Tính lại `line_total`, `subtotal` và `total` từ database/backend.
4. Chuyển quote sang `sent` và ghi `sent_at`.
5. Tạo `customer_links` với token hash, thời hạn và đúng `quote_id`.
6. Chuyển repair order sang `waiting_for_approval`.
7. Ghi `status_history` và `audit_logs`.

### 9.4. Khách duyệt hoặc từ chối

Trong một transaction:

1. Hash token từ request và tìm link chưa hết hạn/chưa bị thu hồi.
2. Khóa quote tương ứng.
3. Kiểm tra quote đang ở `sent` và chưa có quyết định hợp lệ.
4. Tạo `customer_decisions` gắn đúng `quote_id` và `source_link_id`.
5. Cập nhật quote thành `approved` hoặc `rejected`.
6. Nếu duyệt, cập nhật repair order thành `approved`.
7. Nếu từ chối, cập nhật repair order thành `rejected`.
8. Ghi audit log với actor type `customer`.

Không cho phép approve hai lần hoặc approve quote cũ đã bị `superseded`.

### 9.5. Tạo phiên bản báo giá mới

Khi quote đã gửi/duyệt cần thay đổi:

1. Không update quote cũ.
2. Chuyển quote cũ thành `superseded` nếu có quote mới.
3. Tạo quote mới với `version + 1`.
4. Copy các item thành snapshot mới.
5. Tạo link mới khi gửi.
6. Yêu cầu quyết định mới của khách.

### 9.6. Bắt đầu sửa chữa

Chỉ cho phép chuyển sang `repairing` khi:

- Có quote hiện hành ở trạng thái `approved`.
- Quote đó có customer decision `approved`.
- Quyết định gắn với đúng version quote.
- Phiếu không ở trạng thái `cancelled` hoặc `handed_over`.

### 9.7. Hoàn tất quality check và bàn giao

Chỉ cho phép `ready_for_pickup` khi checklist `quality_check` đã hoàn tất và kết luận là `passed`.

Trong transaction bàn giao:

1. Kiểm tra phiếu đang ở `ready_for_pickup`.
2. Tạo `handover_records`.
3. Tạo bằng chứng giai đoạn `handover` nếu có.
4. Chuyển phiếu sang `handed_over`.
5. Tạo `warranties` với `start_date` bằng ngày bàn giao.
6. Chuyển trạng thái sang `warranty_active` nếu chính sách của cửa hàng kích hoạt ngay.
7. Ghi timeline và audit log.

## 10. Bảo mật dữ liệu

- Không lưu mã mở khóa thiết bị trong các bảng MVP.
- Token public chỉ lưu dạng hash.
- Object Storage phải private; ảnh chỉ được xem qua signed URL có thời hạn.
- Kiểm tra MIME type, phần mở rộng, kích thước và checksum trước khi tạo `repair_evidence`.
- Không đặt phone, email, quote total hoặc token vào URL.
- Rate limit endpoint public và endpoint quyết định báo giá.
- Audit log không cho nhân viên thường update/delete.
- Ghi audit cho: gửi link, mở link, duyệt/từ chối quote, thu hồi link, tạo quote version, đổi trạng thái ngoại lệ, sửa handover và thay đổi phân quyền.

## 11. Query mẫu theo use case

### Dashboard theo trạng thái

```sql
SELECT status, count(*)
FROM repair_orders
WHERE workspace_id = :workspace_id
GROUP BY status;
```

### Danh sách việc của kỹ thuật viên

```sql
SELECT ro.*
FROM repair_orders ro
JOIN repair_order_staff ros
  ON ros.repair_order_id = ro.id
WHERE ro.workspace_id = :workspace_id
  AND ros.user_id = :user_id
  AND ros.responsibility IN ('primary_technician', 'repairer')
  AND ro.status NOT IN ('handed_over', 'warranty_active', 'cancelled');
```

### Lịch sử theo thiết bị

```sql
SELECT ro.order_code, ro.status, ro.received_at, ro.completed_at
FROM repair_orders ro
WHERE ro.workspace_id = :workspace_id
  AND ro.device_id = :device_id
ORDER BY ro.received_at DESC;
```

### Timeline của phiếu

Timeline cần tổng hợp từ:

```text
status_history
repair_work_logs
customer_decisions
checklists
repair_evidence
handover_records
audit_logs
```

Khi hiển thị, API phải chuẩn hóa thành một DTO sự kiện chung gồm `occurred_at`, `actor`, `event_type`, `summary`, `note` và `attachments`.

## 12. Migration và seed data

### Thứ tự migration đề xuất

1. `workspaces`, `users`.
2. `workspace_memberships`.
3. `customers`, `devices`.
4. `repair_orders`, `repair_order_staff`.
5. `repair_evidence`, `diagnoses`.
6. `quotes`, `quote_items`.
7. `customer_links`, `customer_decisions`.
8. `repair_work_logs`, `checklists`.
9. `handover_records`, `warranties`.
10. `status_history`, `audit_logs`.
11. Index, unique constraint và partial index.

### Trạng thái triển khai migration

MVP hiện dùng SQL versioned migrations với runner tại `src/db/migrate.py`; các version đã triển khai tại `src/db/migrations/versions/`:

| Version | Phạm vi |
| --- | --- |
| `0001_identity` | Workspace, user và membership |
| `0002_customers_devices_orders` | Customer, device, repair order và staff assignment |
| `0003_evidence_diagnosis_quotes` | Evidence, diagnosis, quote và quote item |
| `0004_public_links_decisions` | Customer link và customer decision |
| `0005_execution_handover` | Work log, checklist, handover và warranty |
| `0006_status_audit_indexes` | Status history, audit log và index/unique index |

Migration tiếp theo (khi triển khai access module) phải ghi rõ mapping credential/session của Owner/Manager. Không tạo credential cho hồ sơ Technician/Receptionist.

Lệnh nâng schema local: `python -m src.db.migrate`.

### Seed tối thiểu cho môi trường demo

- Một workspace demo.
- Một Owner/Manager access principal.
- Các hồ sơ Receptionist và Technician để dùng cho assignment; không tạo tài khoản đăng nhập cho các hồ sơ này.
- Một customer.
- Một device.
- Một repair order hoàn chỉnh theo demo scenario trong README.

Seed không được dùng token public cố định trong môi trường thật.

## 13. Các quyết định cần giữ nhất quán

- `workspace_id` là điều kiện bắt buộc ở mọi endpoint và query nghiệp vụ.
- Báo giá là immutable sau khi gửi; chỉnh sửa phải tạo version mới.
- Quyết định khách luôn tham chiếu đến một quote version và một customer link.
- Người thực hiện từng giai đoạn được lưu bằng FK riêng, không ghi đè lịch sử.
- `status_history` phục vụ timeline; `audit_logs` phục vụ bảo mật và truy vết.
- Bảo hành bắt đầu từ ngày bàn giao, trừ khi Owner/Manager ghi nhận ngoại lệ.
- Chỉ Owner/Manager có access credential; `users`/membership không mặc định là tài khoản đăng nhập.
- MVP không dùng các trường “doanh thu đã thu”, “COD” hoặc “thanh toán” nếu chưa có module thanh toán.

## 14. Tiêu chí nghiệm thu database

- Có ERD tổng thể và ERD riêng cho từng module nghiệp vụ.
- Mỗi bảng có mô tả cột, kiểu dữ liệu, nullable, default và constraint.
- Có đầy đủ FK, cardinality và chính sách `ON DELETE`.
- Có unique constraint và index cho các truy vấn MVP chính.
- Không thể đọc/ghi dữ liệu khác workspace.
- Không thể sửa âm thầm báo giá đã gửi hoặc đã duyệt.
- Có thể truy ngược từ quyết định khách đến link, quote version và repair order.
- Có thể xác định người thực hiện từng giai đoạn.
- Có thể dựng timeline từ status history, work log, checklist, evidence, handover và audit log.
- Không thể bắt đầu sửa nếu chưa có quote được khách duyệt.
- Không thể bàn giao nếu quality check chưa đạt.
- Bản ghi bằng chứng, quyết định, status history và audit log không bị xóa cứng trong luồng thông thường.

## 15. Tài liệu liên quan

- [README sản phẩm](../../README.md)
- [Kiến trúc và yêu cầu hệ thống](./architecture-and-requirements.md)
- [Yêu cầu UX/UI](./ui-requirements.md)
