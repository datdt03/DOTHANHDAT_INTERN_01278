# RepairFlow — Kiến trúc hệ thống và yêu cầu mở rộng

## 1. Mục tiêu

RepairFlow là hệ thống quản lý một chuỗi sửa chữa có thể kiểm chứng:

```text
Tiếp nhận → Ghi nhận hiện trạng → Chẩn đoán → Báo giá → Khách duyệt
→ Phân công sửa → Kiểm tra chất lượng → Bàn giao → Bảo hành
```

Mỗi phiếu sửa chữa là nguồn dữ liệu trung tâm. Hệ thống phải trả lời được:

- Thiết bị của ai và được tiếp nhận khi nào?
- Ai chẩn đoán, ai thực hiện sửa, ai kiểm tra và ai bàn giao?
- Trước khi sửa thiết bị có tình trạng gì?
- Khách đã duyệt chính xác báo giá phiên bản nào?
- Công việc nào đã thực hiện và kết quả kiểm tra ra sao?
- Thiết bị được bàn giao khi nào và bảo hành đến ngày nào?

MVP hỗ trợ một cửa hàng hoặc một kỹ thuật viên độc lập, nhưng dữ liệu được thiết kế theo `workspace` để có thể mở rộng nhiều nhân viên sau này.

## 2. Kiến trúc triển khai đề xuất

```text
Admin Web cho nhân viên ─┐
                         ├─ Backend/API ── PostgreSQL
Public Customer Link ───┘                   │
                                            └─ Object Storage
                                               (ảnh và tài liệu)
```

### Thành phần

- **Web application**: giao diện nội bộ cho chủ tiệm, lễ tân, kỹ thuật viên và giao diện công khai cho khách hàng.
- **Backend/API**: xác thực, phân quyền, kiểm tra chuyển trạng thái, nghiệp vụ báo giá, link khách hàng và audit log.
- **PostgreSQL**: nguồn dữ liệu chính cho toàn bộ nghiệp vụ.
- **Object Storage**: lưu ảnh hiện trạng, ảnh sau sửa và các tài liệu đính kèm. Database chỉ lưu metadata và `object_key`.
- **Notification worker**: chưa bắt buộc trong tuần đầu; có thể bắt đầu bằng thông báo trong ứng dụng, sau đó bổ sung email hoặc SMS.

### Quyết định cho MVP

- Dùng **modular monolith**, không dùng microservice.
- Không cần Redis, message broker, Elasticsearch hoặc data warehouse ở giai đoạn đầu.
- Client không truy cập trực tiếp database; mọi thao tác đi qua Backend/API.
- Các thao tác quan trọng như duyệt báo giá, đổi trạng thái và bàn giao phải chạy trong transaction.
- Dùng migration có version để quản lý thay đổi schema.

## 3. Vai trò và phân quyền

### Vai trò

#### Owner/Admin

- Quản lý thông tin cửa hàng và nhân viên.
- Xem và chỉnh sửa toàn bộ phiếu sửa chữa.
- Xem báo cáo toàn cửa hàng.
- Thu hồi link khách hàng và xử lý các trường hợp ngoại lệ.

#### Manager

- Phân công phiếu cho nhân viên.
- Theo dõi tiến độ và báo cáo vận hành.
- Điều chỉnh quy trình theo chính sách của cửa hàng.
- Không được quản lý tài khoản Owner nếu không được cấp quyền riêng.

#### Receptionist/Front Desk

- Tiếp nhận khách và thiết bị.
- Tạo phiếu, ghi nhận hiện trạng, phụ kiện và hình ảnh.
- Gửi link báo giá và cập nhật bàn giao.
- Không tự ý sửa chẩn đoán hoặc báo giá đã được duyệt nếu không có quyền.

#### Technician

- Xem các phiếu được phân công.
- Chẩn đoán, lập báo giá và ghi nhận công việc sửa chữa.
- Hoàn thành checklist sửa chữa và kiểm tra chất lượng.
- Chỉ được sửa dữ liệu trong phạm vi phiếu và quyền được cấp.

#### Customer

- Không cần tài khoản trong MVP.
- Truy cập phiếu thông qua link bảo mật.
- Xem thông tin cần thiết, báo giá và trạng thái.
- Đồng ý hoặc từ chối một phiên bản báo giá.

### Quy tắc phân quyền

- Quyền phải được kiểm tra ở Backend/API, không chỉ ẩn nút trên giao diện.
- Mọi truy vấn dữ liệu nghiệp vụ phải lọc theo `workspace_id`.
- Nhân viên bị vô hiệu hóa không được đăng nhập hoặc nhận phiếu mới, nhưng lịch sử thao tác cũ vẫn phải giữ lại.
- Không ghi đè `user_id` của người đã thực hiện một hành động.
- Owner/Admin có thể xem toàn bộ; Technician mặc định chỉ xem phiếu được phân công hoặc được chia sẻ.

## 4. Xác định người chịu trách nhiệm

Chỉ có `assigned_technician_id` là chưa đủ, vì một phiếu có thể do nhiều người xử lý ở các giai đoạn khác nhau.

Phiếu cần phân biệt:

- Người tạo phiếu.
- Người tiếp nhận.
- Người chẩn đoán.
- Người chịu trách nhiệm chính.
- Người thực hiện sửa chữa.
- Người kiểm tra chất lượng.
- Người bàn giao.

Đề xuất dùng bảng `repair_order_staff` để hỗ trợ một hoặc nhiều nhân viên cho một phiếu:

```text
repair_order_staff
    id
    repair_order_id
    user_id
    responsibility
    is_primary
    assigned_at
    completed_at
    note
```

`responsibility` có thể gồm:

```text
intake
diagnosis
primary_technician
repairer
quality_checker
handover
```

Ngoài ra, các bảng `diagnoses`, `checklists`, `repair_work_logs`, `handover_records` và `status_history` đều phải có người thực hiện và thời điểm thực hiện. Như vậy hệ thống có thể hiển thị timeline kiểu:

```text
09:10 — Linh tiếp nhận máy
09:45 — Nam chẩn đoán lỗi màn hình
10:20 — Khách duyệt báo giá
11:00 — Nam thực hiện thay màn hình
13:30 — Linh kiểm tra chất lượng
14:00 — Linh bàn giao cho khách
```

## 5. Mô hình dữ liệu chính

### Workspace và nhân viên

```text
workspaces
    id
    name
    phone
    address
    timezone
    created_at

users
    id
    name
    email
    phone
    status
    last_login_at
    created_at

workspace_memberships
    id
    workspace_id
    user_id
    role
    status
    invited_at
    joined_at
```

Tách `workspace_memberships` khỏi `users` để một tài khoản có thể được mời vào nhiều workspace trong tương lai.

### Khách hàng và thiết bị

```text
customers
    id
    workspace_id
    name
    phone
    email
    note
    created_at
    updated_at

devices
    id
    workspace_id
    customer_id
    device_type
    brand
    model
    serial_number
    device_identifier
    note
    created_at
    updated_at
```

Không lưu mật khẩu, mã mở khóa hoặc dữ liệu nhạy cảm của thiết bị trong MVP. Nếu nghiệp vụ bắt buộc phải lưu, dữ liệu đó phải được mã hóa riêng và hạn chế quyền truy cập.

### Phiếu sửa chữa

```text
repair_orders
    id
    workspace_id
    order_code
    customer_id
    device_id
    status
    customer_description
    internal_note
    received_at
    expected_completed_at
    completed_at
    created_by
    created_at
    updated_at
```

Mã phiếu `order_code` phải dễ đọc, duy nhất trong workspace và có thể in hoặc đọc qua điện thoại.

### Hiện trạng và bằng chứng

```text
repair_evidence
    id
    repair_order_id
    stage
    file_url
    object_key
    file_name
    mime_type
    file_size
    checksum
    description
    captured_by
    captured_at
```

`stage` gồm `before_repair`, `diagnosis`, `after_repair` và `handover`.

### Chẩn đoán, báo giá và quyết định của khách

```text
diagnoses
    id
    repair_order_id
    findings
    cause
    recommendation
    estimated_duration
    diagnosed_by
    created_at

quotes
    id
    repair_order_id
    version
    status
    subtotal
    total
    note
    created_by
    created_at

quote_items
    id
    quote_id
    item_type
    description
    quantity
    unit_price
    replacement_reason
    estimated_duration

customer_decisions
    id
    quote_id
    decision
    customer_name
    customer_contact_snapshot
    decided_at
    source_link_id
```

Khi báo giá đã gửi hoặc đã được duyệt, không sửa trực tiếp các dòng cũ. Nếu có thay đổi, tạo báo giá mới với `version` mới và yêu cầu khách xác nhận lại.

### Link công khai cho khách

```text
customer_links
    id
    repair_order_id
    quote_id
    purpose
    token_hash
    expires_at
    last_accessed_at
    revoked_at
    created_at
```

Link phải giới hạn đúng phạm vi dữ liệu được xem. Không dùng một link chung có quyền truy cập toàn bộ database hoặc toàn bộ workspace.

### Công việc, checklist, bàn giao và bảo hành

```text
repair_work_logs
    id
    repair_order_id
    technician_id
    summary
    started_at
    ended_at
    note

checklists
    id
    repair_order_id
    checklist_type
    content_json
    completed_by
    completed_at

handover_records
    id
    repair_order_id
    recipient_name
    returned_accessories
    final_condition_note
    confirmed_at
    handed_over_by

warranties
    id
    repair_order_id
    start_date
    end_date
    warranty_terms
    status
```

Checklist dùng `content_json` trong MVP để triển khai nhanh. Khi cần báo cáo chi tiết theo từng loại lỗi hoặc từng mục kiểm tra, có thể tách thành template và checklist items ở giai đoạn sau.

### Theo dõi trạng thái và audit

```text
status_history
    id
    repair_order_id
    from_status
    to_status
    changed_by
    reason
    created_at

audit_logs
    id
    workspace_id
    user_id
    actor_type
    entity_type
    entity_id
    action
    metadata_json
    ip_hash
    user_agent
    created_at
```

`status_history` phục vụ timeline nghiệp vụ. `audit_logs` phục vụ truy vết bảo mật và các hành động quan trọng như sửa báo giá, thu hồi link, thay đổi nhân viên hoặc xóa tài liệu.

## 6. Trạng thái và luật chuyển trạng thái

Trạng thái không chỉ để hiển thị; mỗi chuyển trạng thái phải có điều kiện và người thực hiện.

```text
received
    → diagnosing
diagnosing
    → waiting_for_approval
waiting_for_approval
    → approved | rejected
approved
    → repairing
repairing
    → quality_check
quality_check
    → ready_for_pickup | repairing
ready_for_pickup
    → handed_over
handed_over
    → warranty_active
```

Một số luật cần áp dụng:

- Không chuyển sang `diagnosing` nếu chưa có thông tin thiết bị và lỗi khách mô tả.
- Không chuyển sang `waiting_for_approval` nếu chưa có chẩn đoán và báo giá hợp lệ.
- Không chuyển sang `repairing` nếu chưa có quyết định `approved` cho đúng phiên bản báo giá.
- Không chuyển sang `ready_for_pickup` nếu chưa hoàn thành checklist chất lượng.
- Không chuyển sang `handed_over` nếu chưa có biên bản bàn giao.
- Không kích hoạt bảo hành trước thời điểm bàn giao, trừ khi Owner/Admin ghi rõ lý do.
- Mọi chuyển trạng thái phải ghi `changed_by`, thời gian và lý do khi là ngoại lệ.

## 7. Bảo mật và quyền riêng tư

### Nhân viên

- Đăng nhập bằng tài khoản riêng; không dùng tài khoản chung cho cả tiệm.
- Mật khẩu phải được xử lý bởi hệ thống xác thực chuẩn và không lưu dạng plaintext.
- Có thể bổ sung MFA cho Owner/Admin sau MVP.
- Session có thời hạn và có cơ chế đăng xuất tất cả thiết bị.
- Nhân viên bị khóa phải mất quyền truy cập ngay nhưng không làm mất lịch sử cũ.

### Link khách hàng

- Token được tạo bằng bộ sinh số ngẫu nhiên an toàn.
- Database chỉ lưu hash của token.
- Link có thời hạn, có thể thu hồi và có thể tạo lại.
- Không đưa thông tin cá nhân hoặc dữ liệu báo giá vào URL.
- Áp dụng rate limit cho trang public và các thao tác duyệt.
- Link chỉ cho phép xem đúng phiếu được cấp quyền.
- Ghi nhận thời điểm truy cập và quyết định của khách.

### File và dữ liệu

- Bucket ảnh phải ở chế độ private.
- Dùng signed URL có thời hạn khi hiển thị ảnh.
- Kiểm tra MIME type, phần mở rộng, kích thước và tên file khi upload.
- Không cho phép file được upload thực thi trực tiếp trên server.
- Mã hóa dữ liệu khi truyền và khi lưu trữ.
- Không lưu mã mở khóa thiết bị nếu không thật sự cần.
- Có chính sách lưu trữ và xóa dữ liệu theo yêu cầu của cửa hàng.

### Audit và khôi phục

- Audit log không được cho phép nhân viên thường sửa hoặc xóa.
- Các hành động nhạy cảm phải lưu actor, thời gian, đối tượng và lý do.
- Có backup tự động database.
- Kiểm thử khôi phục backup trước khi dùng thật.
- Có quy trình xử lý khi lộ link, sửa nhầm báo giá hoặc gửi nhầm thông tin.

## 8. Theo dõi, dashboard và báo cáo

### Timeline của một phiếu

Timeline phải tổng hợp từ `status_history`, `repair_work_logs`, `customer_decisions`, `checklists`, `repair_evidence` và `handover_records`.

Mỗi sự kiện nên hiển thị:

- Thời điểm.
- Người thực hiện.
- Hành động.
- Ghi chú hoặc lý do.
- Tài liệu/hình ảnh liên quan nếu có.

### Dashboard vận hành

MVP nên có các nhóm chỉ số sau:

- Số phiếu đang xử lý theo trạng thái.
- Phiếu đang chờ khách duyệt.
- Phiếu quá thời gian dự kiến.
- Phiếu sẵn sàng bàn giao.
- Phiếu theo từng kỹ thuật viên.
- Thời gian trung bình từ tiếp nhận đến bàn giao.
- Số phiếu bị trả lại ở bước kiểm tra chất lượng.

### Báo cáo kỹ thuật viên

- Số phiếu được phân công, đang xử lý và đã hoàn tất.
- Thời gian xử lý theo từng phiếu.
- Số lần sửa lại hoặc không đạt kiểm tra chất lượng.
- Các thiết bị hoặc lỗi thường gặp.

### Báo cáo khách hàng và bảo hành

- Lịch sử sửa chữa theo khách hàng.
- Lịch sử theo serial number hoặc thiết bị.
- Phiếu đang trong thời hạn bảo hành.
- Phiếu sắp hết hạn bảo hành.
- Số trường hợp quay lại trong thời hạn bảo hành.

### Báo cáo giá trị

Vì MVP chưa có thanh toán, chỉ nên gọi là **giá trị báo giá** hoặc **giá trị phiếu hoàn tất**, không gọi là doanh thu đã thu.

Các báo cáo có thể tính trực tiếp bằng query hoặc database view. Chưa cần tạo bảng snapshot hoặc data warehouse.

## 9. Thông báo và nhắc việc

Các sự kiện nên được thiết kế để sau này có thể gửi nhiều kênh:

- Báo giá đang chờ khách duyệt.
- Khách đã duyệt hoặc từ chối báo giá.
- Phiếu bị quá thời gian dự kiến.
- Thiết bị đã sẵn sàng bàn giao.
- Bảo hành sắp hết hạn.
- Link khách hàng sắp hết hạn.

Trong MVP, có thể hiển thị thông báo trong dashboard và cho phép nhân viên sao chép link gửi thủ công. Email/SMS là phần mở rộng sau khi nghiệp vụ ổn định.

## 10. Index và tính toàn vẹn dữ liệu

Nên tạo index cho:

- `repair_orders(workspace_id, status)`.
- `repair_orders(workspace_id, order_code)` với unique constraint.
- `repair_orders(customer_id)` và `repair_orders(device_id)`.
- `customers(workspace_id, phone)`.
- `devices(workspace_id, serial_number)` khi serial number có giá trị.
- `repair_order_staff(user_id, repair_order_id)`.
- `status_history(repair_order_id, created_at)`.
- `customer_links(token_hash)`.
- `warranties(end_date, status)`.

Các nguyên tắc dữ liệu:

- Dùng UUID hoặc ULID làm khóa chính.
- Dùng `numeric` hoặc số nguyên nhỏ nhất phù hợp để lưu tiền, không dùng floating point.
- Dùng UTC trong database và hiển thị theo timezone của workspace.
- Dùng foreign key cho quan hệ chính.
- Dùng transaction khi tạo quyết định khách, đổi trạng thái hoặc bàn giao.
- Không xóa cứng dữ liệu bằng chứng và audit log.

## 11. Phạm vi MVP được cập nhật

### Nên có ngay

- Đăng nhập nhân viên và workspace.
- Quản lý nhân viên, vai trò và trạng thái hoạt động.
- Phân công kỹ thuật viên cho từng phiếu.
- Ghi nhận người tạo, người chẩn đoán, người sửa, người kiểm tra và người bàn giao.
- Phiếu sửa chữa, khách hàng và thiết bị.
- Checklist và ảnh hiện trạng.
- Chẩn đoán, báo giá theo phiên bản và quyết định của khách.
- Link khách hàng có thời hạn và thu hồi được.
- Timeline lịch sử thao tác.
- Checklist sửa chữa và kiểm tra chất lượng.
- Bàn giao, bảo hành và lịch sử.
- Dashboard cơ bản theo trạng thái và kỹ thuật viên.
- RBAC, audit log, kiểm soát file và backup.

### Có thể để sau MVP

- MFA bắt buộc cho từng vai trò.
- Email/SMS tự động.
- Lịch làm việc và phân ca.
- Quản lý kho và tồn linh kiện.
- Thanh toán và kế toán.
- Nhiều chi nhánh.
- Ứng dụng mobile native.
- Báo cáo nâng cao và data warehouse.
- Tài khoản khách hàng dài hạn.

## 12. Tiêu chí nghiệm thu kiến trúc

- Có thể xác định chính xác ai đã thực hiện từng giai đoạn của phiếu.
- Một nhân viên chỉ xem và sửa được dữ liệu đúng workspace và đúng quyền.
- Khách chỉ xem được phiếu thông qua link được cấp, link có thể hết hạn hoặc thu hồi.
- Báo giá đã duyệt không bị thay đổi âm thầm.
- Timeline hiển thị được toàn bộ quá trình từ tiếp nhận đến bàn giao.
- Ảnh và tài liệu không bị public ngoài ý muốn.
- Dashboard cho biết phiếu đang ở đâu, đang chờ ai và phiếu nào bị trễ.
- Có thể truy vấn lịch sử theo khách hàng, thiết bị, kỹ thuật viên và thời gian.
- Có backup và đã kiểm tra khả năng khôi phục dữ liệu.

## 13. Tài liệu UX/UI liên quan

Chi tiết yêu cầu giao diện, luồng người dùng, danh sách màn hình MVP và tiêu chí nghiệm thu được tách riêng tại [docs/ui-requirements.md](./ui-requirements.md).
