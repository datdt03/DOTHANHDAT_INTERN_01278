# C2-001 — Customer, device và atomic repair intake API

Plan ID: c2-001

Title: Codex customer/device/repair-order foundation và `CreateRepairIntake`

Owner: Codex

Status: DONE — amendment implemented; acceptance continues in c2-005

Revision: 5

Depends on: c2-000-shared-multi-role-ui-boundary.md

Produces: Feature-first schema/API, authorization và transaction boundary cho
Customer, Device, RepairOrder; thêm application command tạo intake atomic

Consumed by: c2-002, c2-004, C3 intake/evidence

## Baseline đã hoàn thành

Baseline c2-001 Revision 2 đã có migration `0003`, CRUD/search API, safe DTO,
workspace/capability checks và test backend. Amendment này không thay thế hoặc
phá vỡ các contract đó. Phần cần bổ sung là use case tạo phiếu từ một workflow
duy nhất, thay cho việc frontend tự gọi tuần tự Customer → Device → Order.

## Task context

```text
Goal: Cung cấp một API command atomic cho workflow Tiếp nhận sửa chữa.
Feature: Customer, Device và RepairOrder feature roots
Read first: docs/v0/02-use-cases.md, docs/v0/03-business-and-domain-requirements.md,
            docs/v0/05-database-requirements.md, docs/v0/07-authentication-and-authorization.md,
            plans/v0/c2/README.md và baseline c2-001 đã triển khai
Allowed to change:
- src/server/RepairFlow.Api/Features/Customer/
- src/server/RepairFlow.Api/Features/Device/
- src/server/RepairFlow.Api/Features/RepairOrder/
- OpenAPI và API tests liên quan
- migration chỉ khi contract/database requirements thật sự cần
Do not change: C3 evidence/completion, C4 diagnosis/quote, C5 customer link,
               state transition sau received.
Do not create: Features/C2, C2Models.cs, C2Contracts.cs hoặc IC2Repository.cs.
Completion criteria: command intake tạo/resolve Customer, tạo/resolve Device theo
                     policy và tạo RepairOrder received trong một transaction,
                     có test rollback, duplicate, workspace và permission.
```

## Goal

Cho phép UI gửi một request mô tả trọn vẹn việc tiếp nhận: một customer có sẵn
hoặc customer mới, một hoặc nhiều thiết bị thực tế được bàn giao, lỗi/ghi chú
riêng từng thiết bị và thông tin order chung. Backend chịu trách nhiệm
orchestration và commit atomic.

Quan hệ nghiệp vụ cần freeze:

```text
Customer 1 ─── N RepairOrder
RepairOrder 1 ─── N RepairOrderItem ─── 1 Device
```

`Device` là hồ sơ nhận diện có thể dùng lại theo lịch sử. `RepairOrderItem` là
snapshot của một thiết bị trong một lần sửa chữa và sở hữu `reportedIssue`,
`itemNotes`, handover data và credential metadata của lần đó.

## Decision closure trước khi implement

1. **Duplicate device identity:** xử lý đầy đủ là ngoại lệ deferred sau C10.
   C2 không tự link, merge hoặc mở flow xử lý duplicate; nếu serial/IMEI/identifier
   đụng unique constraint thì trả conflict rõ ràng và giữ transaction an toàn.
2. **Status:** `RepairOrder` và mỗi `RepairOrderItem` bắt đầu ở `received`. C2
   chưa triển khai lifecycle độc lập cho từng item; C3/C4 sẽ quyết định cách item
   tiến độ khác nhau ảnh hưởng tới order tổng.
3. **Required fields:** Customer bắt buộc name + phone; email optional. Mỗi
   repair item bắt buộc device type và brand/model hoặc identifier, cùng
   `reportedIssue`. Handover condition, accessories, item notes và credential là
   optional theo tình huống.
4. **Credential access:** chỉ Manager hoặc Technician được assignment mới được
   reveal. Credential bị destroy khi bàn giao hoặc đóng phiếu, tùy thời điểm nào
   đến trước; vẫn giữ expiry kỹ thuật nếu có.
5. **Customer matching:** phone normalize là identity chính; email search không
   phân biệt hoa thường. Không tự merge customer; người dùng phải chọn hồ sơ cũ
   hoặc chủ động chuyển sang mode tạo mới.
6. **Atomic failure/retry:** C2 dùng all-or-nothing và idempotency. Đây là
   semantics kỹ thuật của một lần submit, không phải business workflow mới; xem
   phần giải thích trong plan và test rollback/double-submit.

### Giải thích atomic failure/retry

- **All-or-nothing:** một request có 3 thiết bị mà thiết bị thứ 2 thiếu field thì
  backend không lưu Customer, không lưu Device 1 và không tạo RepairOrder dở dang.
  Người dùng sửa dữ liệu rồi submit lại toàn bộ request.
- **Idempotency:** nếu người dùng bấm submit hai lần hoặc mạng timeout khiến client
  retry, cùng một idempotency key chỉ tạo một RepairOrder. Lần retry nhận lại
  kết quả của lần đầu thay vì tạo order thứ hai.
- Đây là cách bảo vệ tính nhất quán dữ liệu khi một order có nhiều repair item;
  không phải thêm bước nghiệp vụ mới cho người dùng.

## API contract cần bổ sung/freeze

Các API search/detail hiện có tiếp tục được giữ để phục vụ picker và order detail:

- `GET /api/customers?query=&phone=&email=` — search theo workspace; `email` là
  filter rõ ràng nếu `query` hiện tại chưa đủ semantics.
- `POST /api/customers` và `GET /api/customers/{customerId}` — giữ contract cũ.
- `GET /api/devices/{deviceId}` và history projection — giữ cho detail/supporting
  views; không bắt buộc UI intake phải gọi device search.
- `GET /api/repair-orders` và `GET /api/repair-orders/{orderId}` — giữ cho list/detail.

Thêm command:

```text
POST /api/repair-orders/intake
```

Request phải phân biệt customer hiện có và customer mới, đồng thời luôn nhận
`repairItems[]`. Mỗi item là một thiết bị được bàn giao; phải có tối thiểu một
item và có thể có nhiều item trong cùng RepairOrder:

```json
{
  "customer": {
    "mode": "existing",
    "id": "customer-id"
  },
  "repairItems": [
    {
      "device": {
        "type": "phone",
        "brand": "Apple",
        "model": "iPhone 13",
        "serialNumber": "SN-001",
        "identifier": null
      },
      "reportedIssue": "Máy không lên nguồn",
      "handoverCondition": "Mặt kính xước nhẹ",
      "accessories": "Củ sạc, cáp sạc",
      "itemNotes": "Khách yêu cầu giữ nguyên dữ liệu",
      "credential": {
        "status": "customer_unlocked_device",
        "value": null,
        "consent": true
      }
    },
    {
      "device": {
        "type": "tablet",
        "brand": "Samsung",
        "model": "Tab S8",
        "serialNumber": "SN-002",
        "identifier": null
      },
      "reportedIssue": "Màn hình bị sọc",
      "handoverCondition": "...",
      "accessories": "...",
      "itemNotes": "...",
      "credential": {
        "status": "not_required",
        "value": null,
        "consent": false
      }
    }
  ],
  "repairOrder": {
    "intakeNotes": "..."
  }
}
```

Khi tạo customer mới, `customer` dùng form `{ mode: "new", name, phone,
email?, note? }`. Tên field cuối cùng phải theo domain/API đã freeze, không tự
phát minh field ngoài requirements.

`reportedIssue` không nằm ở `repairOrder` chung; nó thuộc từng item. Response
thành công trả về safe projection của:

```text
{ data: { customer, repairOrder, repairItems[] }, meta: { requestId } }
```

Repair order phải ở `received`, có order code, creator, initial status history
và audit theo contract hiện có.

## Device unlock credential

Nếu khách cung cấp mật khẩu/passcode để Technician mở khóa thiết bị, C2 được
phép lưu để phục vụ sửa chữa nhưng phải lưu trong **internal encrypted credential
storage** của RepairFlow:

- Không cài thêm container, vault service hoặc storage service nào khác.
- API hiện tại mã hóa credential trước khi ghi vào database hiện tại.
- Dùng `ASP.NET Core Data Protection`/`IDataProtector` ở backend; key ring được
  lưu ngoài source và ngoài database với quyền truy cập giới hạn.
- Credential thuộc repair item của lần sửa chữa, không thuộc bản ghi Device
  master vì cùng một thiết bị có thể có cách xử lý khác ở các lần sau.
- Database chỉ lưu ciphertext, key version, status, consent/received time,
  expiry và destroyed time; không lưu plaintext.
- DTO detail/list, log, audit message và error response không được chứa giá trị
  credential.
- Chỉ Manager hoặc Technician được assignment mới được gọi endpoint/action reveal
  riêng; request phải qua HTTPS và có audit access.
- Credential phải có expiry kỹ thuật và destroy operation; destroy bắt buộc khi
  bàn giao hoặc đóng phiếu, tùy thời điểm nào đến trước.
- Nếu key ring không khả dụng, fail closed; không fallback sang plaintext.

Tên field và endpoint reveal/destroy phải được freeze trong OpenAPI trước khi
implement. C2 không đưa credential vào customer/device note.

## Business/transaction rules

- Search customer theo phone/email chỉ là bước hỗ trợ UI; người dùng có thể chủ
  động chọn mode tạo mới ngay trong cùng màn hình.
- Customer phone phải normalize và không tạo duplicate trong workspace.
- Mỗi repair item luôn bắt đầu từ form thiết bị được bàn giao; không yêu cầu chọn
  một device có sẵn theo customer context.
- Nếu serial/identifier trùng, giữ unique policy của database và trả conflict
  rõ ràng. C2 không tự silently link/merge device; flow xử lý ngoại lệ đầy đủ
  được deferred sau C10.
- Customer/device/workspace relationship phải được kiểm tra tại backend.
- Customer name/phone, device type và brand/model hoặc identifier, cùng
  `reportedIssue` là dữ liệu tối thiểu để tạo intake; email, handover condition,
  accessories, item notes và credential là optional.
- `reportedIssue` giữ nguyên là dữ liệu khách mô tả, không biến thành diagnosis.
- Mỗi repair item có `reportedIssue`, `itemNotes`, handover data và
  trạng thái/credential unlock riêng nếu có; ghi chú cấp RepairOrder chỉ dùng cho
  thông tin chung.
- Một RepairOrder phải tạo được nhiều repair item trong cùng transaction; thứ tự
  item ổn định để đối chiếu với thiết bị thực tế.
- RepairOrder và từng RepairOrderItem khởi tạo ở `received`; item lifecycle độc
  lập để dành cho C3/C4.
- Transaction bao phủ resolve/create customer, create/resolve từng device theo
  policy, lưu toàn bộ repair item/credential metadata, create order, staff
  attribution, status history và audit.
- Rollback toàn bộ khi một bước lỗi.
- Hỗ trợ idempotency hoặc request correlation để double-submit không tạo hai order.
- Không chuyển sang `diagnosing`, không hoàn tất C3 intake và không xử lý quote.

## Authorization

Giữ capability matrix hiện có. Backend quyết định quyền create/search/read;
frontend chỉ điều chỉnh presentation. Không tạo capability mới chỉ để phục vụ
UI nếu chưa có requirements decision.

## Out of scope

- C3 checklist chi tiết, ảnh/evidence, intake completion.
- C4 diagnosis/quote.
- C5 public customer link/OTP.
- Delete semantics.
- Tự động email/SMS.
- Shared repository/port kiểu C2.
- External credential vault/container/storage service.

## Files to update

- [ ] Feature application/contract/endpoint trong `Customer`, `Device`,
  `RepairOrder` theo structure hiện có; schema liên kết `RepairOrder` với nhiều
  `RepairOrderItem` và mỗi item với một `Device`.
- [ ] OpenAPI contract và error examples cho intake.
- [ ] API tests cho existing/new customer, duplicate, device identity conflict,
  workspace, permission, rollback, idempotency và credential access policy.
- [ ] Encryption/decryption, key version, expiry/destroy, reveal authorization;
  không có plaintext trong DTO/log/audit/error.
- [ ] Migration cần thiết cho quan hệ one-to-many/repair item và encrypted
  credential metadata; không sửa migration lịch sử nếu không cần.

## Step-by-step implementation

- [ ] Đối chiếu baseline CRUD contract và freeze command request/response.
- [ ] Đặt orchestration/transaction boundary tại `RepairOrder/Application`.
- [ ] Dùng port/repository riêng của Customer và Device; không tạo `IC2Repository`.
- [ ] Resolve customer existing/new với normalize/duplicate policy.
- [ ] Tạo/resolve từng device intake từ form bàn giao và kiểm tra identifier policy.
- [ ] Tạo tối thiểu một repair item, hỗ trợ nhiều item trong một order.
- [ ] Lưu reported issue, item notes và credential metadata riêng cho từng repair item.
- [ ] Tạo order `received`, history/audit trong cùng transaction.
- [ ] Thêm encrypted credential storage bằng runtime/backend hiện có; không thêm
  container hoặc dịch vụ lưu trữ khác.
- [ ] Thêm error mapping có field-level validation và candidate/conflict khi cần.
- [ ] Cập nhật OpenAPI và chạy clean/idempotent migration verification nếu có migration.

## Testing plan

- [ ] Existing customer + một device + valid order.
- [ ] Existing customer + nhiều device/repair item + một valid order.
- [ ] New customer + một hoặc nhiều device/repair item + valid order.
- [ ] Search phone/email và chọn existing không tạo duplicate customer.
- [ ] Duplicate phone, invalid fields, device identifier conflict.
- [ ] Customer/device/repair item mismatch hoặc cross-workspace denial.
- [ ] Duplicate serial/identifier chỉ trả conflict rõ ràng, không silent link/merge;
  full exception flow được ghi nhận cho C10.
- [ ] Rollback khi một device item, order/history/audit step lỗi; không tạo order một phần.
- [ ] Double-submit/idempotency.
- [ ] Initial status `received` cho order và từng repair item, order code, history và audit.
- [ ] Mỗi repair item giữ đúng reported issue, handover, item notes và credential metadata.
- [ ] Required/optional field matrix: customer name/phone, device identity tối thiểu,
  reported issue; email/handover/accessories/notes/credential optional.
- [ ] Reveal credential chỉ Manager hoặc assigned Technician; destroy khi handover
  hoặc close order.
- [ ] Manager, Receptionist và Technician theo capability/assignment policy.
- [ ] Safe DTO/error envelope/request ID.
- [ ] Credential không xuất hiện trong normal response, log hoặc audit message;
  reveal/destroy có authorization và audit riêng.
- [ ] Existing c2-001 regression suite vẫn pass.

## Acceptance criteria

- [ ] UI có thể tạo một phiếu với một hoặc nhiều device bằng một command, không cần
      gọi tuần tự các create API.
- [ ] Customer có thể được chọn hoặc tạo mới trong cùng workflow.
- [ ] Mỗi device được nhập từ form bàn giao, không phụ thuộc device list của customer.
- [ ] RepairOrder liên kết đúng customer và nhiều repair item/device ở `received`.
- [ ] Lỗi ở bất kỳ item nào không để lại customer/device/item/order rời rạc.
- [ ] Duplicate device identity được trả về như conflict rõ ràng và không làm C2
      tự động link/merge; ngoại lệ chi tiết deferred sau C10.
- [ ] Status `received` được ghi cho order và các item ban đầu.
- [ ] Passcode nếu được cung cấp có thể dùng lại theo quyền Technician nhưng chỉ
      được lưu dạng ciphertext trong database hiện tại, có expiry/destroy.
- [ ] API contract không tạo namespace/path C2 cũ và không đổi ngoài scope.

## Verification

- [ ] `dotnet build src/server/RepairFlow.sln --no-restore`.
- [ ] `dotnet test src/server/RepairFlow.sln --no-restore`.
- [ ] OpenAPI smoke test cho `/api/repair-orders/intake`.
- [ ] Regression test các endpoint c2-001 baseline.
- [ ] Kiểm tra source không có `Features/C2`, `Features.C2`, `C2Models.cs`,
  `C2Contracts.cs` hoặc `IC2Repository.cs`.

## Change impact

Đây là amendment application/API và data relationship một RepairOrder — nhiều
RepairOrderItem, không phải đổi C3/C4 state machine. Duplicate device identity
resolution đầy đủ được để sau C10; C2 chỉ trả conflict an toàn. Nếu existing schema hiện
đang gắn trực tiếp một `device_id` vào `repair_orders`, phải có migration/decision
chuyển sang bảng item liên kết trước khi implement endpoint intake. Nếu schema
không đủ cho device identity, credential encryption hoặc idempotency, ghi
migration decision riêng trước khi sửa database.

## Implementation evidence

- [x] Feature-first implementation under `Customer`, `Device` and `RepairOrder`;
      no cluster-based source path or shared `IC2Repository`.
- [x] Added migrations `20260918_0004` and `20260918_0005` for repair-order items,
      credential metadata/destroy state, identifier uniqueness and intake idempotency.
- [x] Added atomic `POST /api/repair-orders/intake` with existing/new customer,
      one-or-many repair items, duplicate conflict and request idempotency.
- [x] Added Data Protection credential ciphertext storage plus reveal/destroy
      authorization; normal DTOs and audit metadata do not expose plaintext.
- [x] `dotnet build src/server/RepairFlow.sln --no-restore` passed.
- [x] `dotnet test src/server/RepairFlow.sln --no-restore` passed: 64 tests.
- [x] OpenAPI contract test covers intake, reveal/destroy paths and the required
      `Idempotency-Key` header.
- [x] PostgreSQL migration smoke test passed on first run and clean rerun.
- [ ] Full live API data-path acceptance for intake/rollback/double-submit and
      credential reveal/destroy remains part of c2-005 acceptance evidence.
