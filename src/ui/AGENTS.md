# Quy tắc UI — HTML, CSS và JavaScript

## 1. Cấu trúc đề xuất cho MVP

```text
src/ui/
├── index.html                 # app shell, chỉ chứa layout gốc và các thẻ script/style
├── app.js                     # khởi tạo app, route và kết nối feature
├── config/                    # cấu hình tập trung, không chứa business logic
│   ├── routes.js
│   └── ui.config.js
├── shared/                    # chỉ chứa thứ được dùng từ hai feature trở lên
│   ├── components/            # modal, badge, form field, empty state...
│   ├── styles/                # tokens.css, base.css, utilities.css
│   └── utils/                 # dom.js, format.js, validation.js
├── features/                  # mỗi màn hình/luồng nghiệp vụ là một feature
│   ├── dashboard/
│   │   ├── dashboard.html      # page/fragment nếu runtime hỗ trợ nạp HTML riêng
│   │   ├── dashboard.js
│   │   └── dashboard.css      # chỉ tạo khi feature có style riêng
│   ├── repair-orders/
│   │   ├── repair-orders.html
│   │   ├── repair-orders.js
│   │   └── repair-orders.css
│   ├── repair-order-detail/
│   │   ├── repair-order-detail.html
│   │   ├── repair-order-detail.js
│   │   └── repair-order-detail.css
│   ├── customers/
│   │   └── customers.js
│   └── customer-link/
│       ├── customer-link.js
│       └── customer-link.css
├── mocks/                     # dữ liệu demo, chỉ dùng khi chưa nối API thật
└── assets/
    └── images/
```

Đây là cấu trúc mặc định, không phải yêu cầu tạo đủ tất cả file ngay từ đầu. Chỉ tạo file khi có nhu cầu thực tế.

## 2. Quy tắc HTML

- `index.html` là shell ổn định: chứa vùng điều hướng, `<main id="app">`, vùng thông báo và các asset dùng chung.
- HTML riêng của feature chỉ chứa markup của page/fragment đó; không tạo HTML riêng cho từng button hoặc component nhỏ.
- Không nhúng JavaScript dài hoặc CSS dài trực tiếp trong HTML.
- Không nhồi markup dài vào template string trong JavaScript. Nếu runtime chưa hỗ trợ HTML fragment, giữ markup ở `index.html` hoặc bổ sung loader tối thiểu theo cấu trúc hiện có; không thêm framework chỉ vì lý do này.
- Mỗi màn hình phải có một root rõ ràng, ví dụ `data-page="dashboard"` hoặc `data-feature="repair-order-detail"`.
- Dùng HTML semantic: `header`, `nav`, `main`, `section`, `form`, `button`, `table` khi phù hợp.
- Mỗi form phải có label, trạng thái lỗi và trạng thái loading rõ ràng.
- Không dùng `div` thay cho button/link nếu phần tử có hành vi tương tác.
- Không dùng inline style và không dùng inline event handler như `onclick`.
- Nội dung hiển thị cho người dùng phải dùng thuật ngữ trong `docs/v0/ui-requirements.md`, không hiển thị mã trạng thái nội bộ nếu không cần.

## 3. Quy tắc CSS

- `shared/styles/tokens.css`: màu, font, spacing, radius, shadow và z-index.
- `shared/styles/base.css`: reset, typography và element mặc định.
- `shared/styles/utilities.css`: một số utility nhỏ, có tên rõ nghĩa.
- CSS riêng đặt cạnh feature, ví dụ `features/dashboard/dashboard.css`.
- Không tạo một file `styles.css` khổng lồ cho toàn bộ ứng dụng.
- Không lặp màu, spacing hoặc breakpoint; dùng CSS custom properties trong tokens.
- Class mô tả vai trò, không mô tả vị trí tạm thời. Ưu tiên `.status-badge` hơn `.blue-box`.
- Tránh selector lồng sâu quá 3 cấp và tránh `!important`.
- Mỗi component/feature phải có trạng thái `loading`, `empty`, `error` và `disabled` khi trạng thái đó có thể xảy ra.

## 4. Quy tắc JavaScript

- `app.js` chỉ khởi tạo ứng dụng, đăng ký route và kết nối các feature; không chứa toàn bộ logic màn hình.
- Mỗi feature chịu trách nhiệm cho việc render, event handler và state cục bộ của chính feature đó.
- API client, format ngày/tiền, thao tác DOM dùng chung phải đặt trong `shared/`; không gọi `fetch` lặp lại ở nhiều nơi.
- Tách rõ ba phần trong file feature theo thứ tự: `state` → `render` → `events/actions`.
- Tên hàm nên nói rõ hành động, ví dụ `renderRepairOrder`, `submitDiagnosis`, `handleApproval`.
- Không dùng biến global để truyền state giữa các feature. Dùng module import/export hoặc state store nhỏ khi thật sự cần.
- Không đặt logic chẩn đoán, tính giá, phân quyền hoặc chuyển trạng thái quan trọng chỉ ở frontend; frontend chỉ hiển thị và gọi API.
- Luôn xử lý `loading`, lỗi mạng, dữ liệu rỗng và phản hồi API không hợp lệ.
- Ưu tiên module nhỏ, named export và dependency một chiều: `feature → shared`, không để `shared → feature`.

## 5. Xử lý file JavaScript phình lớn

### Ngưỡng cần giữ

- File entry của page nên dưới 150 dòng.
- Module thông thường nên dưới 250 dòng.
- Từ 250–400 dòng: không thêm logic mới trước khi xem xét tách file.
- Trên 400 dòng: phải lập kế hoạch tách theo trách nhiệm khi tiếp tục phát triển.
- Trên 800 dòng: coi là việc cần refactor trước, không tiếp tục nối thêm tính năng vào file đó.
- Trên 1.000 dòng: không cắt file theo số dòng tùy ý; phải tách theo section UI, state, API và action.

Nếu “1000k dòng” nghĩa là hàng trăm nghìn hoặc hàng triệu dòng, trước tiên kiểm tra đó có phải file build/minified/generated hay không. Không sửa trực tiếp file trong `dist/` hoặc file sinh tự động; hãy tìm source và source map tương ứng. Nếu đó thực sự là source code, cần chia thành nhiều feature/module và lập kế hoạch tái cấu trúc riêng.

### Cấu trúc cho một page lớn

```text
features/repair-order-detail/
├── index.js                    # orchestrator, khởi tạo page và nối module
├── state.js                    # state cục bộ, không thao tác DOM
├── selectors.js                # dữ liệu dẫn xuất từ state
├── api.js                      # gọi API của feature
├── actions.js                  # hành động người dùng và điều phối cập nhật
├── validators.js               # kiểm tra input của feature
├── render-header.js            # section header
├── render-overview.js          # section tổng quan
├── render-condition.js         # hiện trạng và bằng chứng
├── render-quote.js             # chẩn đoán và báo giá
├── render-repair.js            # công việc sửa chữa
├── render-quality-check.js     # kiểm tra chất lượng
├── render-handover.js          # bàn giao và bảo hành
├── render-timeline.js          # timeline/audit
├── repair-order-detail.html
└── repair-order-detail.css
```

Không bắt buộc tạo đủ file ngay từ đầu. Chỉ tách section khi section đó có state, render hoặc hành vi riêng. Khi feature có hơn khoảng 12 module, mới cân nhắc thêm thư mục con `views/`, `actions/` hoặc `data/`; không tạo thư mục sâu chỉ để đổi tên file.

### Ranh giới trách nhiệm

- `index.js`: điều phối, không chứa markup dài hoặc logic nghiệp vụ.
- `state.js`: lưu state và hàm cập nhật state, không biết DOM.
- `api.js`: chỉ giao tiếp API, không render và không đọc phần tử DOM.
- `render-*.js`: render một section, không gọi `fetch` trực tiếp.
- `actions.js`: nhận event, gọi API/validator, cập nhật state và yêu cầu render lại.
- `selectors.js`: tính dữ liệu hiển thị, không sửa state.
- `validators.js`: kiểm tra dữ liệu, không hiển thị toast hoặc gọi API.

Luồng phụ thuộc chuẩn:

```text
index.js → actions.js → api.js/state.js
index.js → render-*.js → selectors.js/state.js
```

Không cho phép `api.js` gọi `render`, `state.js` import view hoặc các section render gọi lẫn nhau.

### Cách tách một file đang vượt 1.000 dòng

1. Ghi lại các hàm public và hành vi hiện tại để tránh đổi behavior ngoài ý muốn.
2. Tách hằng số, formatter, validator và API trước vì chúng ít phụ thuộc DOM.
3. Tách render theo section UI, mỗi file có một hàm entry rõ ràng.
4. Tách action/event handler theo nghiệp vụ: `saveDiagnosis`, `submitQuote`, `completeRepair`, `handoverDevice`.
5. Giữ file cũ làm orchestrator trong thời gian chuyển tiếp; không đổi toàn bộ import trong một lần.
6. Chạy kiểm tra sau từng nhóm tách, sau đó xóa code chết và cập nhật route/import.

Không chia kiểu `page-1.js`, `page-2.js` hoặc cắt mỗi file 200 dòng. Cách đó làm mất ranh giới nghiệp vụ và khiến LLM phải đọc nhiều file không liên quan.

## 6. Quy tắc cấu hình

```text
src/ui/config/
├── routes.js       # tên route và mapping feature
└── ui.config.js    # giá trị UI có thể thay đổi theo môi trường
```

- Một cấu hình chỉ có một nơi định nghĩa.
- Không hard-code API base URL trong feature.
- Không đặt dữ liệu mock, dữ liệu nghiệp vụ hoặc secret vào `config/`.
- Khi thêm cấu hình, ghi rõ kiểu dữ liệu, giá trị mặc định và nơi sử dụng.

## 7. Quy tắc thêm feature mới

1. Tạo `src/ui/features/<feature-name>/`.
2. Tạo file `<feature-name>.js`.
3. Chỉ tạo `<feature-name>.css` nếu style không thể đặt ở `shared/styles/`.
4. Đăng ký route trong `src/ui/config/routes.js`.
5. Gắn feature vào `app.js` bằng một entry rõ ràng.
6. Tái sử dụng component trong `shared/`; nếu component chỉ dùng một lần, giữ nó trong feature.
7. Cập nhật tài liệu UI hoặc test nếu có màn hình, trạng thái hay hành vi mới.

## 8. Tiêu chí hoàn thành UI

- Người đọc có thể đoán được file cần sửa từ tên feature.
- Không có logic bị lặp giữa hai màn hình.
- Không có URL API, token hoặc cấu hình môi trường rải trong feature.
- Có trạng thái tải, lỗi và rỗng cho luồng có gọi API.
- UI bám đúng trạng thái nghiệp vụ trong tài liệu, đặc biệt: duyệt báo giá, kiểm tra chất lượng và bàn giao.
- Chỉ sửa các file nằm trong phạm vi task, trừ khi có lý do được ghi rõ.
