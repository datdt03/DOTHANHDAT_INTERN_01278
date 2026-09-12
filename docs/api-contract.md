# RepairFlow — API Contract v1

> Trạng thái: **Frozen — Contract v1**.
>
> Đây là hợp đồng giao tiếp giữa API server do Codex quản lý và UI do Antigravity quản lý. Contract được freeze ngày **2026-09-12**. Mọi thay đổi làm thay đổi shape, trạng thái, quyền hoặc semantics phải tăng `contractVersion` và cập nhật `docs/api-handoff.md`.

| Thuộc tính | Giá trị |
| --- | --- |
| Contract version | `1` |
| Contract status | `Frozen` |
| Freeze date | `2026-09-12` |
| Canonical contract file | `docs/api-contract.md` |
| Implementation status | Chưa triển khai; readiness được theo dõi tại `docs/api-handoff.md` |

## 1. Nguồn tham chiếu và thứ tự ưu tiên

- [Quy tắc project](../AGENTS.md).
- [Mục tiêu và phạm vi MVP](../README.md), đặc biệt phần End-to-End Business Flow, MVP Scope, Suggested Repair Statuses và Important Business Rules.
- [Kiến trúc và yêu cầu hệ thống](./architecture-and-requirements.md), đặc biệt §2–§7, §8, §11–§12.
- [Yêu cầu database và ERD](./database-requirements.md), đặc biệt §3, §5, §8–§14.
- [Yêu cầu UX/UI](./ui-requirements.md), đặc biệt §4, §6.1–§6.9, §7–§9.
- [Quy tắc UI](../src/ui/AGENTS.md), đặc biệt §4, §5, §6–§8.

Nếu code mock hoặc tài liệu cũ mâu thuẫn với contract này, không tự đổi nghiệp vụ. Ghi mâu thuẫn trong `docs/api-handoff.md` và xử lý theo plan tương ứng.

## 2. Quy ước chung

### 2.1. Base URL và transport

- API prefix: `/api/v1`.
- Health check không cần auth: `GET /health`.
- Nội dung JSON dùng UTF-8.
- Request/response dùng `camelCase`; tên cột database vẫn theo `snake_case`.
- Employee API dùng session cookie `HttpOnly`, `Secure` ở production và `SameSite=Lax` tối thiểu.
- UI gọi employee API với `credentials: 'include'`.
- Public customer link không yêu cầu employee session.
- Không truyền `workspaceId` từ client để quyết định tenant. API lấy workspace từ session và kiểm tra tenant ở mọi query.

### 2.2. Kiểu dữ liệu

- ID là UUID string.
- `orderCode` là mã đọc được, unique trong workspace, ví dụ `RF-20260911-001`.
- Timestamp là ISO-8601 UTC, ví dụ `2026-09-11T10:20:00Z`.
- Ngày nghiệp vụ là `YYYY-MM-DD`.
- Tiền là chuỗi decimal để tránh sai số JSON, luôn kèm `currency: "VND"`. Ví dụ `"2707500.00"`.
- `quantity` là decimal string hoặc number dương; API phải chuẩn hóa trong response.
- Field nullable phải trả `null`, không bỏ field tùy tiện trong cùng một DTO.
- API không trả `internalNote`, token thô, mật khẩu, mã mở khóa thiết bị hoặc dữ liệu audit nhạy cảm cho public client.

### 2.3. Envelope thành công

```json
{
  "data": {},
  "meta": {
    "requestId": "req_01J..."
  }
}
```

`meta` có thể thêm pagination nhưng không thay đổi `data`.

### 2.4. Envelope lỗi

```json
{
  "error": {
    "code": "INVALID_TRANSITION",
    "message": "Không thể bắt đầu sửa khi chưa có báo giá được khách duyệt.",
    "details": {},
    "requestId": "req_01J..."
  }
}
```

Các mã tối thiểu:

| HTTP | `code` | Ý nghĩa |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | Body/query sai hoặc thiếu field |
| 401 | `AUTH_REQUIRED` | Chưa đăng nhập hoặc session hết hạn |
| 403 | `FORBIDDEN` | Không đủ role/phạm vi phiếu |
| 404 | `NOT_FOUND` | Không tìm thấy resource trong tenant hiện tại |
| 409 | `CONFLICT` | Trạng thái dữ liệu đã thay đổi hoặc thao tác trùng |
| 409 | `INVALID_TRANSITION` | Chuyển trạng thái không hợp lệ |
| 409 | `QUOTE_IMMUTABLE` | Đang sửa quote đã gửi/đã quyết định |
| 410 | `PUBLIC_LINK_EXPIRED` | Link public hết hạn |
| 410 | `PUBLIC_LINK_REVOKED` | Link public đã bị thu hồi |
| 413 | `FILE_TOO_LARGE` | File vượt giới hạn |
| 415 | `UNSUPPORTED_FILE_TYPE` | MIME type không được phép |
| 429 | `RATE_LIMITED` | Vượt giới hạn request |

## 3. Miền giá trị canonical

### 3.1. Repair order status

```text
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

Luồng hợp lệ:

```text
received → diagnosing → waiting_for_approval → approved → repairing
repairing → quality_check → ready_for_pickup → handed_over → warranty_active
waiting_for_approval → rejected
quality_check → repairing
```

`overdue` **không** phải status lưu trong API. API trả `isOverdue: boolean` và có thể trả `overdueReason` khi `expectedCompletedAt` đã qua nhưng phiếu chưa ở trạng thái kết thúc. UI có thể dùng cờ này để hiển thị badge/lọc.

### 3.2. Các enum khác

```text
role: owner | admin | manager | receptionist | technician
staffResponsibility: intake | diagnosis | primaryTechnician | repairer | qualityChecker | handover
evidenceStage: beforeRepair | diagnosis | afterRepair | handover
checklistType: intake | repair | qualityCheck | handover
quoteStatus: draft | sent | approved | rejected | superseded | expired | cancelled
quoteItemType: part | labor | service
customerDecision: approved | rejected
linkPurpose: quoteReview | statusTracking
warrantyStatus: active | expired | void
```

## 4. DTO dùng chung

### 4.1. Actor và staff assignment

```json
{
  "userId": "uuid",
  "name": "Trần Hoàng Nam",
  "role": "technician",
  "responsibility": "primaryTechnician",
  "isPrimary": true,
  "assignedAt": "2026-09-11T09:45:00Z",
  "completedAt": null
}
```

### 4.2. Money

```json
{
  "amount": "2707500.00",
  "currency": "VND"
}
```

### 4.3. Quote

```json
{
  "id": "uuid",
  "version": 1,
  "status": "sent",
  "currency": "VND",
  "items": [
    {
      "id": "uuid",
      "itemType": "part",
      "description": "Màn hình iPhone 13 Pro OLED",
      "quantity": "1.00",
      "unitPrice": "2650000.00",
      "lineTotal": "2650000.00",
      "replacementReason": "Màn hình vỡ và loạn cảm ứng",
      "estimatedDuration": 90,
      "sortOrder": 0
    }
  ],
  "subtotal": "2850000.00",
  "total": "2707500.00",
  "note": "Bảo hành cảm ứng 06 tháng.",
  "createdBy": { "userId": "uuid", "name": "Linh" },
  "createdAt": "2026-09-11T10:20:00Z",
  "sentAt": "2026-09-11T10:20:00Z",
  "decision": null
}
```

Server luôn tính lại `lineTotal`, `subtotal` và `total`. Client không được quyết định tổng tiền bằng giá trị gửi lên.

### 4.4. Repair order detail

```json
{
  "id": "uuid",
  "orderCode": "RF-20260911-001",
  "status": "waiting_for_approval",
  "isOverdue": false,
  "overdueReason": null,
  "customer": {
    "id": "uuid",
    "name": "Nguyễn Minh Anh",
    "phone": "0912849888",
    "email": null
  },
  "device": {
    "id": "uuid",
    "deviceType": "phone",
    "brand": "Apple",
    "model": "iPhone 13 Pro",
    "serialNumber": null,
    "deviceIdentifier": "356891104829104",
    "note": null
  },
  "reportedIssue": {
    "description": "Lỗi nguồn, sập nguồn, nứt kính màn hình",
    "startedAt": null,
    "powerState": "powersOn",
    "receivedAccessories": ["simTray"],
    "note": null
  },
  "receivedAt": "2026-09-11T09:10:00Z",
  "expectedCompletedAt": "2026-09-13T17:30:00Z",
  "staff": [],
  "evidence": [],
  "diagnosis": null,
  "quotes": [],
  "currentQuote": null,
  "customerDecision": null,
  "workLogs": [],
  "checklists": [],
  "handover": null,
  "warranty": null,
  "timeline": [],
  "capabilities": {
    "canStartDiagnosis": false,
    "canCreateQuote": true,
    "canSendQuote": true,
    "canStartRepair": false,
    "canCompleteRepair": false,
    "canCompleteQualityCheck": false,
    "canHandover": false
  }
}
```

`capabilities` chỉ là gợi ý authoritative cho UI; API vẫn phải kiểm tra quyền và điều kiện ở server cho mỗi mutation.

### 4.5. Timeline event

API chuẩn hóa timeline từ `status_history`, `repair_work_logs`, `customer_decisions`, `checklists`, `repair_evidence`, `handover_records` và audit event cần hiển thị:

```json
{
  "id": "uuid",
  "occurredAt": "2026-09-11T10:20:00Z",
  "actor": { "type": "employee", "id": "uuid", "name": "Linh" },
  "eventType": "quoteSent",
  "summary": "Đã gửi báo giá phiên bản 1",
  "note": null,
  "attachments": []
}
```

## 5. Employee endpoints

Tất cả endpoint trong phần này yêu cầu employee session và được scope theo workspace của session.

### 5.1. Auth và current user

| Method | Path | Quyền | Kết quả |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/login` | public | Tạo session cookie; body `{email,password}` |
| `POST` | `/api/v1/auth/logout` | employee | Hủy session |
| `GET` | `/api/v1/me` | employee | User, workspace hiện tại và role |

### 5.2. Dashboard và tra cứu

| Method | Path | Quyền | Kết quả |
| --- | --- | --- | --- |
| `GET` | `/api/v1/dashboard` | employee | KPI, pipeline, overdue, waiting approval, technicians, activities |
| `GET` | `/api/v1/repair-orders` | employee | Danh sách có filter/query/pagination |
| `GET` | `/api/v1/repair-orders/:id` | employee | Repair order detail DTO §4.4 |
| `GET` | `/api/v1/repair-orders/:id/timeline` | employee | Timeline event DTO |
| `GET` | `/api/v1/customers` | employee | Tìm khách theo `q`, `phone` |
| `GET` | `/api/v1/customers/:id/repair-history` | employee | Lịch sử theo khách |
| `GET` | `/api/v1/devices` | employee | Tìm thiết bị theo `q`, `serialNumber`, `customerId` |
| `GET` | `/api/v1/devices/:id/repair-history` | employee | Lịch sử theo thiết bị |

Query tối thiểu của danh sách phiếu:

```text
status, assigneeId, receivedFrom, receivedTo, overdue, waitingForApproval, q, page, pageSize
```

Response list:

```json
{
  "data": {
    "items": [],
    "page": 1,
    "pageSize": 20,
    "total": 0
  },
  "meta": { "requestId": "req_01J..." }
}
```

### 5.3. Intake, customer và device

| Method | Path | Quyền | Ghi chú |
| --- | --- | --- | --- |
| `POST` | `/api/v1/customers` | owner/admin/manager/receptionist | Tạo khách đúng workspace |
| `POST` | `/api/v1/devices` | owner/admin/manager/receptionist | Tạo thiết bị thuộc customer cùng workspace |
| `POST` | `/api/v1/repair-orders` | owner/admin/manager/receptionist | Tạo order ở `received` trong một transaction |
| `POST` | `/api/v1/repair-orders/:id/staff` | owner/admin/manager | Gán trách nhiệm nhân viên |

Create order request rút gọn:

```json
{
  "customer": {
    "id": null,
    "name": "Nguyễn Minh Anh",
    "phone": "0912849888",
    "email": null,
    "note": null
  },
  "device": {
    "id": null,
    "deviceType": "phone",
    "brand": "Apple",
    "model": "iPhone 13 Pro",
    "serialNumber": null,
    "deviceIdentifier": "356891104829104",
    "note": null
  },
  "reportedIssue": {
    "description": "Lỗi nguồn, sập nguồn",
    "startedAt": null,
    "powerState": "powersOn",
    "receivedAccessories": [],
    "note": null
  },
  "expectedCompletedAt": "2026-09-13T17:30:00Z",
  "internalNote": null
}
```

Nếu truyền `customer.id` hoặc `device.id`, API phải kiểm tra entity đó thuộc workspace hiện tại và device thuộc customer đã chọn.

### 5.4. Evidence, diagnosis và quote

| Method | Path | Quyền | Ghi chú |
| --- | --- | --- | --- |
| `POST` | `/api/v1/repair-orders/:id/evidence` | employee có quyền trên order | `multipart/form-data`, stage/file/description |
| `POST` | `/api/v1/repair-orders/:id/diagnosis` | technician hoặc manager | Tạo diagnosis; không tự chẩn đoán |
| `POST` | `/api/v1/repair-orders/:id/quotes` | technician hoặc manager | Tạo draft version kế tiếp |
| `PATCH` | `/api/v1/quotes/:quoteId` | technician hoặc manager | Chỉ sửa quote `draft` |
| `POST` | `/api/v1/quotes/:quoteId/send` | technician hoặc manager | Tính tiền, tạo customer link, chuyển order sang `waiting_for_approval` |
| `POST` | `/api/v1/quotes/:quoteId/versions` | technician hoặc manager | Tạo version mới từ quote cũ; quote cũ immutable |
| `POST` | `/api/v1/customer-links/:linkId/revoke` | owner/admin/manager | Thu hồi link public |

Create/update quote body:

```json
{
  "items": [
    {
      "itemType": "part",
      "description": "Màn hình iPhone 13 Pro OLED",
      "quantity": "1.00",
      "unitPrice": "2650000.00",
      "replacementReason": "Màn hình vỡ",
      "estimatedDuration": 90,
      "sortOrder": 0
    }
  ],
  "note": "Bảo hành cảm ứng 06 tháng."
}
```

`POST /send` phải chạy transaction: lock quote, validate item, recalculate totals, chuyển quote sang `sent`, tạo link có expiry, chuyển order sang `waiting_for_approval`, ghi status history và audit log.

### 5.5. Status, repair work, checklist, handover

| Method | Path | Quyền | Ghi chú |
| --- | --- | --- | --- |
| `POST` | `/api/v1/repair-orders/:id/status` | employee được phép | Body `{toStatus, reason}`; server kiểm tra state machine |
| `POST` | `/api/v1/repair-orders/:id/work-logs` | technician/manager | Ghi việc thực tế, không sửa quote |
| `PUT` | `/api/v1/repair-orders/:id/checklists/:checklistType` | employee được phép | Upsert content đang làm |
| `POST` | `/api/v1/repair-orders/:id/checklists/:checklistType/complete` | employee được phép | Chốt checklist; quality check phải có `passed`/`failed` |
| `POST` | `/api/v1/repair-orders/:id/handover` | owner/admin/manager/receptionist | Transaction bàn giao và kích hoạt bảo hành |

Rules bắt buộc:

- `received → diagnosing` yêu cầu dữ liệu device và reported issue.
- `diagnosing → waiting_for_approval` yêu cầu diagnosis và quote hợp lệ.
- `waiting_for_approval → approved` chỉ qua public decision đúng quote version.
- `approved → repairing` yêu cầu customer decision `approved` đúng quote.
- `repairing → qualityCheck` yêu cầu work log/checklist repair theo policy.
- `qualityCheck → readyForPickup` chỉ khi quality checklist `passed`.
- `qualityCheck → repairing` khi `failed`.
- `readyForPickup → handedOver` yêu cầu handover body hợp lệ.
- `handedOver → warrantyActive` tạo warranty với ngày bắt đầu là ngày bàn giao, trừ ngoại lệ có quyền và reason.

### 5.6. Dashboard response tối thiểu

```json
{
  "data": {
    "metrics": {
      "processing": 18,
      "waitingForApproval": 2,
      "repairing": 6,
      "qualityCheck": 4,
      "readyForPickup": 7,
      "overdue": 1
    },
    "pipeline": [
      { "status": "received", "count": 4 },
      { "status": "diagnosing", "count": 3 },
      { "status": "waiting_for_approval", "count": 2 }
    ],
    "technicians": [],
    "activities": [],
    "needsAttention": []
  },
  "meta": { "requestId": "req_01J..." }
}
```

## 6. Public customer link endpoints

Public endpoint không trả internal note, staff assignment đầy đủ, audit log, token hoặc dữ liệu khách không cần thiết.

| Method | Path | Kết quả |
| --- | --- | --- |
| `GET` | `/api/v1/public/customer-links/:token` | Public view của đúng repair order và quote được cấp |
| `POST` | `/api/v1/public/customer-links/:token/decision` | Tạo một quyết định `approved` hoặc `rejected` đúng quote version |

Decision request:

```json
{
  "decision": "approved",
  "customerName": "Nguyễn Minh Anh",
  "customerContact": { "phone": "0912849888", "email": null },
  "note": null
}
```

Decision response phải trả public view mới và `decision` chứa `quoteId`, `quoteVersion`, `decidedAt`. Sau khi quyết định thành công, API phải từ chối quyết định lặp hoặc quyết định trên quote cũ.

Token phải được hash trong database; link có expiry, revoke, rate limit và audit access/decision theo [architecture §7](./architecture-and-requirements.md#7-bảo-mật-và-quyền-riêng-tư) và [database §9.4](./database-requirements.md#94-khách-duyệt-hoặc-từ-chối).

## 7. Quy tắc UI adapter

UI hiện tại là prototype dùng mock tại `src/ui/mocks/mock-api.js` và có các khác biệt cố ý:

- Mock dùng `order.id = orderCode`; API tách `id` UUID và `orderCode` hiển thị.
- Mock dùng `quoteVersion: "v1.0"`; API dùng `version: 1`. UI render label `v${version}.0` nếu cần.
- Mock dùng `status: "overdue"`; API dùng `status` canonical + `isOverdue`.
- Mock public route dùng `#/customer/:id`; API public route phải truyền token opaque, ví dụ `#/customer/:token`.
- Mock có thể chứa dữ liệu không thuộc MVP hoặc nhạy cảm, ví dụ mã mở khóa/iCloud. Không migrate những field này vào API/database.

Antigravity phải đặt mapping trong API client/feature adapter, không rải mapping vào template render. Chi tiết ownership và thứ tự thay mock nằm trong [plan UI](../plans/003-ui-antigravity.md).

## 8. Contract freeze và compatibility

- G0 đã hoàn tất: các quyết định cần thiết cho Contract v1 đã được chốt trước khi triển khai song song.
- Status canonical của repair order là `received`, `diagnosing`, `waiting_for_approval`, `approved`, `repairing`, `quality_check`, `ready_for_pickup`, `handed_over`, `warranty_active`, `rejected`, `cancelled`. `overdue` chỉ là `isOverdue`/filter dẫn xuất.
- ID nội bộ dùng UUID; `orderCode` là mã hiển thị unique trong workspace.
- Employee API dùng session cookie; public customer link dùng token opaque, database chỉ lưu hash, có expiry/revoke/rate limit.
- Request/response dùng `camelCase`; database dùng `snake_case`; timestamp trả UTC ISO-8601; tiền trả dạng decimal string kèm `currency: "VND"`.
- Quote version là số nguyên trong API. Quote đã `sent`, `approved`, `rejected`, `superseded` hoặc `expired` là immutable; thay đổi phải tạo version mới.
- Customer decision luôn gắn với đúng `quoteId`, `quoteVersion` và `sourceLinkId`; approve/reject phải idempotent và transaction-safe.
- State transition, RBAC, workspace isolation, tính tiền, public redaction và file access là trách nhiệm bắt buộc của API, không giao cho UI.
- Public DTO không trả internal note, token, password, mã mở khóa thiết bị, audit metadata nhạy cảm hoặc dữ liệu ngoài scope của link.
- Error envelope và các mã lỗi trong §2.4 là canonical cho UI mapping.
- Không đổi tên field hoặc enum sau khi UI bắt đầu tích hợp nếu chưa tăng `contractVersion`.
- Additive change có thể dùng trong cùng major version nếu field mới nullable/optional và không đổi semantics field cũ.
- Khi API chưa đủ một endpoint, handoff phải ghi rõ `not implemented`, không trả mock giả dưới cùng URL production.
- Mọi deviation phải có: lý do, ảnh hưởng UI, cách tương thích tạm thời và người chịu trách nhiệm.

