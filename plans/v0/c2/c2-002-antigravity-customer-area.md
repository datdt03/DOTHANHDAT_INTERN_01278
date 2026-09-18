# C2-002 — Repair intake workflow

Plan ID: c2-002

Title: Antigravity repair-intake workflow — customer, device và order trong một màn hình

Owner: Antigravity

Status: READY — replan

Revision: 3

Depends on: c2-001-codex-customer-device-order-api.md

Produces: Một workflow UI ba giai đoạn, hỗ trợ một Customer với một hoặc nhiều
           thiết bị trong cùng một RepairOrder, API adapter và test/evidence riêng

Consumed by: c2-004, C3 intake/evidence và C9 khi mở order detail

## Task context

```text
Goal: Tạo một RepairOrder cho một Customer với một hoặc nhiều thiết bị trong một
      workflow trực quan, không chuyển qua Customer page rồi Device page rồi
      RepairOrder page.
Feature: repair-intake-workflow
Read first: src/ui/AGENTS.md, docs/v0/02-use-cases.md, docs/v0/06-ui-requirements.md,
            docs/v0/08-ui-design-blueprint-and-stitch-handoff.md,
            plans/v0/c2/README.md, c2-001-codex-customer-device-order-api.md
Allowed to change: src/ui/features/repair-intake-workflow, route/adapter tối thiểu,
                    tests/ui/repair-intake.
Do not change: shared application shell, role-specific HTML, C3 detailed evidence,
               C4 diagnosis/quote, Customer/Device domain rule hoặc database.
Completion criteria: area mount trực tiếp, ba giai đoạn, một submit atomic qua API
                     với danh sách device/repair item, đủ validation/state/evidence
                     và test độc lập.
```

## Goal

Đưa người dùng vào tác vụ thực tế **Tiếp nhận sửa chữa**. Customer là bước resolve
thông tin; mỗi thiết bị được mang tới là một device/repair item trong cùng phiếu;
RepairOrder là kết quả được tạo sau khi review. Không expose entity navigation như
một quy trình bắt buộc.

## Workflow

### Giai đoạn 1 — Thông tin khách hàng

Trong cùng một khung, có hai mode rõ ràng:

- `Tìm khách hàng`: search theo số điện thoại hoặc email, hiển thị kết quả an
  toàn để chọn.
- `Tạo khách hàng mới`: form cơ bản họ tên, số điện thoại, email và ghi chú.

Mode tạo mới luôn có thể được chọn chủ động; không phụ thuộc vào việc search
không có kết quả. Khi số điện thoại đã tồn tại, hiển thị candidate/khuyến nghị
dùng hồ sơ hiện có và không tạo bản ghi thứ hai.

### Giai đoạn 2 — Các thiết bị bàn giao và thông tin sửa chữa

Hiển thị một danh sách thiết bị lặp được. Người dùng có thể bấm `+ Thêm thiết
bị` để ghi nhận nhiều thiết bị trong cùng một lần tiếp nhận. Không yêu cầu
tìm/chọn thiết bị từ danh sách customer.

Mỗi thiết bị là một repair item độc lập trong cùng RepairOrder, gồm:

- Nhận diện thiết bị: loại, hãng, model, serial/identifier nếu có.
- Bàn giao: tình trạng ban đầu, phụ kiện, ghi chú bàn giao.
- Sửa chữa: lỗi khách mô tả, ghi chú tiếp nhận và các field đã được requirements
  freeze.
- Truy cập thiết bị: trạng thái mật khẩu/passcode và, nếu khách đồng ý, ô nhập
  masked để backend lưu encrypted; không hiển thị lại giá trị trong review.

Phải có tối thiểu một thiết bị. Có thể sửa, xóa một item trước khi xác nhận nhưng
không được để danh sách rỗng. Thứ tự các thiết bị phải ổn định trong review và
request submit để nhân viên đối chiếu với vật lý đã nhận.

Checklist chi tiết, ảnh hiện trạng và intake completion thuộc C3; C2 chỉ gửi
phần thông tin cơ bản mà API c2-001 đã chốt.

### Giai đoạn 3 — Tổng hợp và xác nhận

Hiển thị summary customer, toàn bộ danh sách device/repair item, handover, lỗi và
repair order. Cho phép quay lại chỉnh sửa state local. Chỉ khi bấm `Xác nhận tạo phiếu` mới gọi command
`POST /api/repair-orders/intake`.

Sau thành công, hiển thị order code/trạng thái `received` và mở order detail hoặc
đường dẫn tiếp tục intake theo contract. Không hiển thị success giả khi API lỗi.

## Scope

- Một route/mount chính, ví dụ `#/repair-intake/new`; route cuối cùng phải khớp
  app dispatcher hiện có.
- Local state cho ba giai đoạn, không lưu business draft vào localStorage.
- Customer search và customer create mode trong cùng surface.
- Danh sách device intake/repair item lặp được, tối thiểu một item; không có bước
  bắt buộc chọn device cũ.
- Mỗi item giữ riêng device identity, handover condition, accessories, notes và
  reported issue.
- Mỗi item giữ riêng credential status/consent; không lưu passcode vào localStorage,
  note hoặc client-side draft.
- RepairOrder intake fields và review summary.
- Typed adapter gọi search/customer detail và một command intake; không tuần tự
  create Customer/Device/Order từ browser.
- Loading skeleton, validation, search empty, duplicate conflict, error/retry,
  forbidden/session expired, unavailable/preview và success.
- Capability-driven presentation; backend vẫn là authority.
- Responsive desktop `1440×1024`, checks `1280×800`/`768×1024` và mobile khi
  receptionist flow cần.

## Out of scope

- Customer records page hoặc Device records page là primary intake path.
- Device search/select theo customer.
- C3 checklist chi tiết, ảnh/evidence, server draft/resume và transition.
- Diagnosis, quote, repair, QC, handover.
- Customer public link/OTP.
- Sửa/xóa lịch sử ngoài contract.
- Import `RoleAwareNavigationShell` hoặc state của area khác.

## Files to write

- [ ] `src/ui/features/repair-intake-workflow/repair-intake-workflow.tsx`.
- [ ] `src/ui/features/repair-intake-workflow/repair-intake-workflow.css`.
- [ ] `src/ui/features/repair-intake-workflow/repair-intake-api.ts`.
- [ ] `tests/ui/repair-intake/repair-intake-workflow-checklist.md`.
- [ ] `tests/ui/repair-intake/` test files theo runner hiện có.
- [ ] Route dispatcher tối thiểu nếu cần; không refactor global shell.

## Step-by-step implementation

- [ ] Lập mapping ba giai đoạn → component/state/API/error trước khi code.
- [ ] Tạo area shell riêng theo `C2AreaMountProps` hoặc mount contract tương đương.
- [ ] Implement customer search/create mode trong cùng màn hình.
- [ ] Implement repeatable device handover/repair item form với tối thiểu một item.
- [ ] Cho phép thêm, sửa, xóa item trước submit nhưng không để danh sách rỗng.
- [ ] Giữ thứ tự item ổn định giữa local state, review và request payload.
- [ ] Thêm reported issue, item notes và credential status cho từng item.
- [ ] Nếu nhập passcode, gửi một lần qua HTTPS trong intake command; không log,
  không đưa vào review summary và không lưu browser-side.
- [ ] Implement review summary và một submit command atomic.
- [ ] Xử lý duplicate phone/identifier theo error contract, không tự quyết định
  security hoặc silently link entity.
- [ ] Thêm accessible labels, keyboard focus, Vietnamese copy và disabled/loading
  submit để chống double-click.
- [ ] Kiểm tra responsive/zoom và viết evidence theo từng giai đoạn.

## Testing plan

- [ ] Mount workflow trực tiếp không cần Customer/Device/Order page khác.
- [ ] Customer search theo phone/email có kết quả, không có kết quả và retry.
- [ ] Chuyển chủ động sang create customer mode.
- [ ] Existing customer không tạo duplicate.
- [ ] New customer + một device intake + order submit thành công.
- [ ] Existing customer + nhiều device intake trong một RepairOrder.
- [ ] Thêm/sửa/xóa item trước submit và giữ đúng thứ tự review.
- [ ] Device item thiếu field/serial conflict/invalid field.
- [ ] Một item lỗi không được tạo order thành công giả hoặc tạo order một phần.
- [ ] Credential status/consent hiển thị đúng; passcode bị mask và không xuất hiện
      trong summary, log hoặc error state.
- [ ] Không có external vault/container/storage dependency trong UI flow.
- [ ] Review back/forward không mất state local.
- [ ] Command lỗi/forbidden/network không hiển thị success giả.
- [ ] Session expired không hiển thị protected data cũ.
- [ ] Capability action hidden/disabled không thay thế backend denial.
- [ ] Preview/unavailable state read-only.
- [ ] Keyboard/focus và viewport checklist.

## Acceptance criteria

- [ ] Người dùng hoàn tất quy trình chính trong một màn hình/wizard ba giai đoạn.
- [ ] Customer search và customer create là hai lựa chọn trong cùng khung.
- [ ] Một RepairOrder có thể chứa một hoặc nhiều device/repair item.
- [ ] Mỗi device được ghi nhận bằng form bàn giao riêng; không bắt tìm/chọn device
      cũ theo customer.
- [ ] Mỗi item có mô tả lỗi và ghi chú riêng; có thể ghi nhận trạng thái passcode
      để Technician sử dụng sau này.
- [ ] Passcode thật không xuất hiện trong UI summary hoặc response thông thường;
      việc lưu trữ dùng encrypted storage bên trong backend/database hiện tại.
- [ ] Trước khi submit có summary đầy đủ và có thể quay lại chỉnh sửa.
- [ ] Browser gọi một intake command với `devices[]`/repair items thay vì gọi
      một create API riêng cho từng entity hoặc từng thiết bị.
- [ ] UI không có database/fetch trực tiếp và không phụ thuộc state area khác.
- [ ] UI hiển thị đúng Vietnamese states và backend error.

## Change impact

Plan này thay thế c2-002 Customer records area Revision 1 và bổ sung multi-device
intake. C2-001 phải freeze contract/schema theo quan hệ một order — nhiều
device/repair item trước khi Antigravity implement adapter. Tên file cũ chỉ còn
là lịch sử plan; không tạo lại `customer-records-area` làm primary workflow.
