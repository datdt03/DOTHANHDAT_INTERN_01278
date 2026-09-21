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
| AUTH-004 | Customer không có tài khoản dài hạn; dùng public link có token, expiry, revoke và bắt buộc xác thực OTP trước khi xem hoặc thực hiện bất kỳ hành động nào. | `DECIDED` |
| AUTH-005 | Phân quyền tối thiểu dùng role-set cố định kết hợp `workspace_id`, `active_role` và assignment của repair order. | `DECIDED` |
| AUTH-006 | Mặc định từ chối truy cập (`deny by default`); mọi quyền đọc/ghi phải được Backend/API kiểm tra. | `DECIDED` |
| AUTH-007 | Technician chỉ được xem order được giao hoặc dữ liệu trực tiếp cần cho trách nhiệm; Receptionist được tra cứu operational projection read-only của toàn bộ order trong workspace. | `DECIDED` |
| AUTH-008 | Owner có toàn quyền quản trị workspace và access. Manager có toàn quyền vận hành nhưng không mặc định quản lý credential của Owner. | `DECIDED` |
| AUTH-009 | Không triển khai chức năng đăng nhập thay người khác (`impersonation`). Khi Manager thao tác thay staff, audit phải lưu cả người đăng nhập và staff profile được ghi nhận. | `DECIDED` |
| AUTH-010 | MVP dùng một workspace context cho mỗi phiên; không cho đọc/ghi chéo workspace. | `DECIDED` |
| AUTH-011 | MVP đăng nhập bằng email của access principal do Owner/Manager tạo; không dùng Google Login hoặc OAuth. | `DECIDED` |
| AUTH-012 | Receptionist được tra cứu read-only toàn bộ order trong cùng workspace qua operational projection để trả lời khách; quyền ghi vẫn giới hạn ở order/tác vụ được phân công. | `DECIDED` |
| AUTH-013 | Customer hoặc người được ủy quyền chỉ được mở customer link sau khi nhập OTP gửi tới số điện thoại hoặc email đã được ghi nhận; link không được chia sẻ tự do. | `DECIDED` |
| AUTH-014 | Một membership có thể có nhiều role trong cùng workspace. Session giữ một `active_role`; role này phải thuộc role-set và đổi role không tạo account/session/workspace mới. | `DECIDED` |

## 3. Mô hình actor và account

### 3.1. Access principal

Access principal là người có credential và session để gọi giao diện/API nội bộ.
Các role có thể được cấp trong role-set của membership trong MVP:

- `owner`
- `manager`
- `receptionist`
- `technician`

`admin` chưa phải role được cấp credential trong MVP.

`active_role` là ngữ cảnh quyền hiện tại của session, không phải một access
principal mới. Backend phải kiểm tra `active_role` thuộc role-set của
membership trước khi đánh giá capability hoặc assignment.

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

Customer không đăng nhập vào khu vực nội bộ. Customer hoặc người được ủy quyền
chỉ được xem dữ liệu được cấp trong public link cụ thể sau khi xác thực OTP
qua số điện thoại hoặc email đã được ghi nhận. Customer chỉ được quyết định
trên quote version được link đó tham chiếu. Customer có thể gửi yêu cầu hủy;
việc ghi nhận và chuyển trạng thái do Receptionist hoặc người nội bộ có trách
nhiệm thực hiện.

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
| Dashboard và danh sách order | Full workspace | Full workspace | Operational read-only toàn workspace | Assigned/relevant | — |
| Customer và device | Full workspace | Full workspace | Operational lookup cần cho hỗ trợ khách | Assigned order | Public subset |
| Tạo customer/device/order | Full | Full | Assigned/được cấp quyền | — mặc định | — |
| Intake, phụ kiện, hiện trạng | Full | Full | Assigned | Assigned khi được giao | Public subset |
| Diagnosis và technical evidence | Full | View/review | Chỉ xem tóm tắt có thể trao đổi với khách | Assigned | Public subset |
| Quote draft | Full | Review/ngoại lệ | View | Chỉnh kỹ thuật, hạng mục và giá trong phạm vi được giao, khi còn draft | — |
| Quote sent/approved | View và xử lý theo quyền | View và xử lý theo quyền | View | View, không sửa | Public + decision |
| Customer link | Tạo/revoke/version | Tạo/revoke/version | Gửi/cấp lại link được cấp quyền | — mặc định | Mở link hợp lệ sau OTP |
| Hủy/yêu cầu hoàn trả | Full | Full vận hành | Hủy trước sửa hoặc xác nhận hoàn trả trong phạm vi trách nhiệm | Xác nhận khi đang sửa trong phạm vi `repairer` | Gửi yêu cầu; không tự đổi trạng thái nội bộ |
| Repair work và repair checklist | Full | Điều phối/review | View tiến độ | Assigned | — |
| Quality check | Full | Review/ngoại lệ | View kết quả | Assigned responsibility `quality_checker` | Public subset |
| Handover | Full | Full vận hành | View trạng thái; ghi handover khi được phân công | View | Public subset |
| Timeline nghiệp vụ | Full | Full | Operational read-only toàn workspace | Assigned/relevant | Public subset |
| Audit log và metadata bảo mật | Full | View theo policy | — | — | — |

### 4.4. Quyền evidence ảnh ngoại quan C2

- Quyền xem evidence kế thừa quyền xem repair order trong cùng workspace.
- Quyền upload/xóa evidence yêu cầu actor có quyền xử lý/ghi trên repair order
  hoặc item tương ứng; Technician phải còn assignment hợp lệ.
- Người tạo intake được tiếp tục upload/xóa ảnh khi item chưa có mốc
  `evidence_locked_at`.
- Khi Technician xác nhận nhận bàn giao item, API từ chối upload/xóa ảnh của
  item đó cho mọi actor trong luồng thường. Việc xác nhận nhận bàn giao là
  event nghiệp vụ riêng, không suy ra chỉ từ việc assignment được tạo.
- C2 chưa có public access cho evidence; customer link chỉ nhận ảnh khi C5
  chốt public-scope policy.

### 4.1. Quy tắc riêng cho Receptionist

Receptionist có hai phạm vi rõ ràng:

1. Có thể tra cứu mọi order trong cùng workspace ở chế độ read-only để trả lời
   khách, gồm customer/device định danh cần thiết, trạng thái hiện tại, giai
   đoạn đã hoàn tất, bước tiếp theo, lý do đang chờ, tóm tắt lỗi/chẩn đoán an
   toàn để trao đổi, tiến độ sửa, thời gian dự kiến, QC và bàn giao.
2. Có thể tạo/cập nhật dữ liệu intake hoặc handover chỉ trên order/tác vụ được
   phân công và theo quyền của account.

Receptionist không được:

- Sửa diagnosis hoặc quote đã gửi/đã duyệt.
- Xem audit metadata, token hash, credential, session hoặc raw internal notes.
- Tự thay đổi assignment hoặc quyền của nhân sự.

Khi order chưa bắt đầu sửa chữa thực tế (`received`, `diagnosing`,
`waiting_for_approval` hoặc `approved`), Receptionist có thể thực hiện hủy
trong phạm vi intake/relevant order. Khi order đang `repairing`, Receptionist
không xác nhận quyết định dừng sửa; việc hoàn tất trả máy có thể do
Receptionist đang được giao bước hoàn trả hoặc Receptionist khác cùng role
thực hiện,
không bắt buộc trùng người tiếp nhận hoặc người ghi nhận yêu cầu. Lý do hủy
hoặc hoàn trả là bắt buộc và phải được ghi vào status history cùng audit log.

### 4.2. Quy tắc riêng cho Technician

Technician được xem order được phân công, issue khách cung cấp, device,
baseline evidence, diagnosis liên quan, quote hiện hành và các hạng mục đã
được duyệt để thực hiện công việc.

Technician được tạo/cập nhật diagnosis, quote draft, repair work, repair
evidence và quality check khi có assignment/responsibility tương ứng.
Khi order đang `repairing`, Technician đang giữ responsibility `repairer` có
thể xác nhận hoặc từ chối yêu cầu hủy; nếu xác nhận thì phải ghi tình trạng
hiện tại để chuyển sang luồng hoàn trả. Nếu từ chối, phải ghi lý do và order
tiếp tục `repairing`.

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
- Owner/Manager là người duy nhất được thêm, thay đổi hoặc kết thúc assignment.
  Có thể thay thế trực tiếp người đang handle task khi người đó chưa đủ kỹ
  năng hoặc không phù hợp; phải ghi lý do, gán người mới và giữ assignment,
  thao tác cùng audit history cũ.
- Manager không được mặc định quản lý credential của Owner hoặc thay đổi
  chính sách access cấp hệ thống.

## 5. Quy tắc kiểm tra quyền

Backend/API phải kiểm tra tối thiểu theo thứ tự:

1. Session còn hợp lệ và access principal đang active.
2. Membership thuộc workspace hiện tại và chưa bị suspend/removed.
3. `active_role` thuộc role-set của membership và có quyền thực hiện action.
4. Với thao tác ghi của Receptionist/Technician, order có
   assignment/responsibility phù hợp. Receptionist được phép dùng operational
   read projection trên toàn workspace cho các thao tác đọc đã giới hạn field.
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
  reset. Mặc định v0: idle timeout 30 phút và absolute session expiry 8 giờ.
- Trạng thái account/membership `active`, `inactive`, `locked`, `suspended`
  được kiểm tra ở Backend/API.
- Rate limit và audit cho login thất bại, login thành công, logout, reset và
  permission denied theo mức cần thiết.
- Manual reset/recovery do Owner hoặc quy trình hỗ trợ nội bộ thực hiện.

### Mặc định kỹ thuật đã chốt cho customer link

- OTP gồm 6 chữ số và hết hạn sau 5 phút.
- Một OTP challenge được nhập sai tối đa 5 lần; vượt giới hạn thì challenge
  bị khóa.
- Chỉ cho phép gửi lại sau 60 giây và tối đa 3 lần trong 15 phút.
- Rate limit áp dụng đồng thời theo IP, customer link và số điện thoại/email;
  khi vượt giới hạn thì khóa tạm 15 phút.
- Chỉ lưu hash OTP, không lưu mã OTP dạng plaintext. OTP chỉ được dùng một lần.
- Sau khi OTP hợp lệ, customer session có hiệu lực 30 phút; hết phiên phải
  xác thực lại OTP.
- OTP được gửi tới số điện thoại hoặc email đã được ghi nhận cho Customer hoặc
  người được ủy quyền.

### Không thiết kế trong MVP

- Customer account dài hạn.
- Self-signup.
- Tài khoản dùng chung.
- OAuth, Google login, SSO, SAML hoặc service account.
- MFA/2FA, passkey hoặc sinh trắc học bắt buộc trong MVP. MFA cho Owner/Manager
  được đưa vào giai đoạn sau.
- Custom role, permission editor hoặc ACL riêng cho từng user.
- Impersonation/login-as.
- Cross-workspace access hoặc workspace switching phức tạp.
- API key cho hệ thống bên ngoài.
- Email/SMS tự động cho invite hoặc reset.
- Device trust, IP allowlist, geo restriction và session management nâng cao.

## 7. Những nội dung để sau MVP

Các nội dung dưới đây chưa được biến thành contract bắt buộc trong v0:

- Chính sách độ phức tạp credential.
- Kênh và quy trình gửi invite/reset tự động trong tương lai.
- Chính sách MFA bắt buộc sau MVP.
- Field nào cần mask một phần, ví dụ customer phone đối với Technician.

Các điểm này không làm thay đổi định hướng đã chốt: staff có thể được cấp
account, nhưng quyền luôn bị giới hạn bởi role, workspace và assignment.

## 8. Acceptance baseline

- Account inactive/locked hoặc membership suspended không thể tạo session mới.
- Order trước khi bắt đầu sửa có thể được hủy với lý do bắt buộc; order đang
  `repairing` phải qua xác nhận của Technician phụ trách hoặc Owner và luồng
  hoàn trả do Receptionist thực hiện.
- Yêu cầu hủy bị từ chối khi đang `repairing` phải giữ order ở `repairing` và
  lưu lý do từ chối.
- Hoàn trả phải có Customer xác nhận đã nhận máy và chữ ký; Receptionist khác
  cùng role vẫn có thể là người thực hiện.
- Receptionist có thể đọc operational projection của order không được giao,
  nhưng không thể ghi hoặc đọc dữ liệu kỹ thuật/audit ngoài projection đó.
- Receptionist không thể cập nhật order ngoài assignment/responsibility.
- MVP login dùng email của account do Owner/Manager tạo; không có Google Login.
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
