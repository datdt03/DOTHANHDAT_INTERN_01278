# RepairFlow v0 — Authentication và Authorization tối thiểu

> Trạng thái: `DECIDED — phạm vi auth và phân quyền tối thiểu`
>
> Ngày chốt định hướng: 2026-09-15
>
> Tài liệu này là nguồn tham chiếu cho authentication, authorization và phạm
> vi dữ liệu được xem trong RepairFlow v0. Đây không phải API contract và không
> thay đổi state machine của repair order.

## 1. Mục tiêu

RepairFlow phải xác định được:

- Ai đang đăng nhập và đang thao tác trong workspace nào.
- Người đó được xem customer, device, repair order và tài liệu nào.
- Người đó được tạo, sửa hoặc thực hiện nghiệp vụ nào.
- Hành động được thực hiện trực tiếp bởi tài khoản nào và được ghi nhận cho
  staff profile nào.

Phân quyền phải được bảo vệ ở Backend/API. UI chỉ hiển thị các hành động phù
hợp, không được dùng việc ẩn menu hoặc ẩn nút làm cơ chế bảo mật.

## 2. Các nội dung đã chốt

| ID | Nội dung | Trạng thái |
| --- | --- | --- |
| AUTH-001 | Hệ thống cho phép cấp tài khoản cho Owner, Manager, Receptionist và Technician khi nhân sự cần trực tiếp sử dụng hệ thống. | `DECIDED` |
| AUTH-002 | Tài khoản đăng nhập (`access principal`) tách biệt với hồ sơ nhân sự (`staff profile`). Một staff profile có thể chưa có tài khoản và khi đó không được đăng nhập. | `DECIDED` |
| AUTH-003 | Không dùng tài khoản chung cho nhiều người. Mỗi tài khoản phải gắn với một người và membership hợp lệ trong workspace. | `DECIDED` |
| AUTH-004 | Customer không có tài khoản dài hạn; tiếp tục dùng public link có token, expiry và revoke. | `DECIDED` |
| AUTH-005 | Phân quyền tối thiểu dùng role cố định kết hợp `workspace_id` và assignment của repair order. | `DECIDED` |
| AUTH-006 | Mặc định từ chối truy cập (`deny by default`); mọi quyền đọc/ghi phải được Backend/API kiểm tra. | `DECIDED` |
| AUTH-007 | Receptionist và Technician chỉ được xem order được giao hoặc dữ liệu trực tiếp cần cho trách nhiệm của họ; không được xem toàn bộ workspace. | `DECIDED` |
| AUTH-008 | Owner có toàn quyền quản trị workspace và access. Manager có toàn quyền vận hành nhưng không mặc định quản lý credential của Owner. | `DECIDED` |
| AUTH-009 | Không triển khai chức năng đăng nhập thay người khác (`impersonation`). Khi Manager thao tác thay staff, audit phải lưu cả người đăng nhập và staff profile được ghi nhận. | `DECIDED` |
| AUTH-010 | MVP dùng một workspace context cho mỗi phiên; không cho đọc/ghi chéo workspace. | `DECIDED` |

## 3. Mô hình actor và account

### 3.1. Access principal

Access principal là người có credential và session để gọi giao diện/API nội bộ.
Các role có thể được cấp account trong MVP:

- `owner`
- `manager`
- `receptionist`
- `technician`

`admin` chưa phải role được cấp credential trong MVP.

### 3.2. Staff profile

Staff profile là hồ sơ dùng để phân công và truy vết trách nhiệm nghiệp vụ.
Staff profile có thể có hoặc chưa có access principal.

Ví dụ khi Manager thao tác thay Technician:

```text
acting_user_id      = tài khoản Manager đang đăng nhập
attributed_staff_id = staff profile của Technician
```

Nếu Technician có tài khoản và tự thao tác:

```text
acting_user_id      = tài khoản Technician đang đăng nhập
attributed_staff_id = staff profile tương ứng
```

Không được ghi đè người đăng nhập bằng staff profile hoặc ngược lại.

### 3.3. Customer

Customer không đăng nhập vào khu vực nội bộ. Customer chỉ được xem dữ liệu
được cấp trong public link cụ thể và chỉ được quyết định trên quote version
được link đó tham chiếu.

## 4. Phân quyền tối thiểu

Ký hiệu:

- `Full`: xem và thao tác trong phạm vi được phép.
- `Assigned`: chỉ trên repair order được phân công.
- `View`: chỉ xem, không thay đổi dữ liệu gốc.
- `Public`: chỉ dữ liệu đã được public DTO cho phép.
- `—`: không được truy cập.

| Khu vực dữ liệu/nghiệp vụ | Owner | Manager | Receptionist | Technician | Customer |
| --- | --- | --- | --- | --- | --- |
| Workspace và cấu hình cửa hàng | Full | View/vận hành | — | — | — |
| Staff, role và assignment | Full | Full vận hành | — | — | — |
| Dashboard và danh sách order | Full workspace | Full workspace | Assigned/relevant | Assigned/relevant | — |
| Customer và device | Full workspace | Full workspace | Relevant order | Assigned order | Public subset |
| Tạo customer/device/order | Full | Full | Assigned/được cấp quyền | — mặc định | — |
| Intake, phụ kiện, hiện trạng | Full | Full | Assigned | Assigned khi được giao | Public subset |
| Diagnosis và technical evidence | Full | View/review | View tối thiểu | Assigned | Public subset |
| Quote draft | Full | Review/ngoại lệ | View | Assigned, khi còn draft | — |
| Quote sent/approved | View và xử lý theo quyền | View và xử lý theo quyền | View/gửi link | View, không sửa | Public + decision |
| Customer link | Tạo/revoke/version | Tạo/revoke/version | Gửi link được cấp quyền | — mặc định | Mở link hợp lệ |
| Repair work và repair checklist | Full | Điều phối/review | View trạng thái | Assigned | — |
| Quality check | Full | Review/ngoại lệ | View kết quả | Assigned responsibility `quality_checker` | Public subset |
| Handover và warranty | Full | Full vận hành | Assigned | View | Public subset |
| Timeline nghiệp vụ | Full | Full | Assigned/relevant | Assigned/relevant | Public subset |
| Audit log và metadata bảo mật | Full | View theo policy | — | — | — |

### 4.1. Quy tắc riêng cho Receptionist

Receptionist được xem và thao tác dữ liệu phục vụ tiếp nhận hoặc bàn giao của
order được giao, gồm customer contact cần thiết, device, issue, intake
checklist, evidence, trạng thái, quote summary và handover form.

Receptionist không được:

- Sửa diagnosis hoặc quote đã gửi/đã duyệt.
- Xem audit metadata, token hash, credential, session hoặc dữ liệu ngoài
  order liên quan.
- Tự thay đổi assignment hoặc quyền của nhân sự.

### 4.2. Quy tắc riêng cho Technician

Technician được xem order được phân công, issue khách cung cấp, device,
baseline evidence, diagnosis liên quan, quote hiện hành và các hạng mục đã
được duyệt để thực hiện công việc.

Technician được tạo/cập nhật diagnosis, quote draft, repair work, repair
evidence và quality check khi có assignment/responsibility tương ứng.

Technician không được:

- Xem toàn bộ customer/device/order của workspace.
- Sửa quote đã sent, approved hoặc decision của Customer.
- Xem audit log, access settings hoặc credential/session.
- Bàn giao nếu không được cấp responsibility và quyền tương ứng.

### 4.3. Quy tắc cho Manager và Owner

- Owner được quản lý workspace, staff account, role, assignment, dữ liệu vận
  hành và audit theo policy.
- Manager được xem toàn bộ dữ liệu vận hành trong workspace, phân công, xử lý
  order, quote, link, QC, handover và các trường hợp quá hạn.
- Manager không được mặc định quản lý credential của Owner hoặc thay đổi
  chính sách access cấp hệ thống.

## 5. Quy tắc kiểm tra quyền

Backend/API phải kiểm tra tối thiểu theo thứ tự:

1. Session còn hợp lệ và access principal đang active.
2. Membership thuộc workspace hiện tại và chưa bị suspend/removed.
3. Role có quyền thực hiện action.
4. Với Receptionist/Technician, order có assignment/responsibility phù hợp.
5. Entity liên quan có cùng workspace và không tạo liên kết chéo tenant.
6. Field trả về phải dùng projection phù hợp với role; không trả dư dữ liệu
   nhạy cảm rồi trông chờ UI tự ẩn.

Request truy cập order ngoài phạm vi phải trả lỗi 403 hoặc 404 theo policy,
nhưng không được làm lộ sự tồn tại của dữ liệu workspace khác.

## 6. Phạm vi authentication tối thiểu

### Thiết kế trong MVP

- Account provisioning do Owner hoặc người có quyền quản trị access thực hiện.
- Login/logout cho các account đã được cấp.
- Password/credential không lưu plaintext.
- Session có expiry và có thể revoke khi account bị khóa hoặc credential được
  reset.
- Trạng thái account/membership `active`, `inactive`, `locked`, `suspended`
  được kiểm tra ở Backend/API.
- Rate limit và audit cho login thất bại, login thành công, logout, reset và
  permission denied theo mức cần thiết.
- Manual reset/recovery do Owner hoặc quy trình hỗ trợ nội bộ thực hiện.

### Không thiết kế trong MVP

- Customer account dài hạn.
- Self-signup.
- Tài khoản dùng chung.
- OAuth, Google login, SSO, SAML hoặc service account.
- MFA/2FA, passkey hoặc sinh trắc học bắt buộc.
- Custom role, permission editor hoặc ACL riêng cho từng user.
- Impersonation/login-as.
- Cross-workspace access hoặc workspace switching phức tạp.
- API key cho hệ thống bên ngoài.
- Email/SMS tự động cho invite hoặc reset.
- Device trust, IP allowlist, geo restriction và session management nâng cao.

## 7. Những nội dung chưa chốt chi tiết

Các nội dung dưới đây chưa được biến thành contract bắt buộc trong v0:

- Login identifier chính thức là email, phone hay username.
- Thời lượng idle timeout và absolute session expiry cụ thể.
- Chính sách độ phức tạp credential.
- Kênh và quy trình gửi invite/reset tự động trong tương lai.
- Có bắt buộc MFA sau MVP hay không.
- Field nào cần mask một phần, ví dụ customer phone đối với Technician.

Các điểm này không làm thay đổi định hướng đã chốt: staff có thể được cấp
account, nhưng quyền luôn bị giới hạn bởi role, workspace và assignment.

## 8. Acceptance baseline

- Account inactive/locked hoặc membership suspended không thể tạo session mới.
- Receptionist không thể đọc order không được giao bằng cách gọi trực tiếp API.
- Technician không thể đọc order ngoài assignment hoặc sửa quote đã sent/approved.
- Customer không thể dùng một public link để đọc order/quote khác.
- Manager thao tác thay staff phải lưu cả acting account và attributed staff
  profile.
- User không thể đọc/ghi dữ liệu khác workspace.
- Staff không thể xem credential, token hash, audit metadata hoặc session
  secret của người khác.
- UI có thể ẩn action không phù hợp, nhưng Backend/API vẫn phải từ chối nếu
  request vượt quyền.

## 9. Tài liệu liên quan

- [Use cases](./02-use-cases.md)
- [Business and domain requirements](./03-business-and-domain-requirements.md)
- [Architecture — C4 + arc42](./04-architecture-c4-arc42.md)
- [Database requirements](./05-database-requirements.md)
- [UI requirements](./06-ui-requirements.md)
