# RepairFlow — Quy tắc phát triển cho AI

## 1. Mục tiêu

Giữ mã nguồn nhỏ, dễ tìm, dễ thay đổi và dễ cung cấp cho LLM khi làm từng tính năng. Mỗi thay đổi phải có phạm vi rõ ràng, ưu tiên đọc và tái sử dụng cấu trúc hiện có trước khi tạo file hoặc abstraction mới.

## 2. Nguồn sự thật của sản phẩm

- `README.md`: mục tiêu sản phẩm, phạm vi MVP và nghiệp vụ tổng thể.
- `docs/architecture-and-requirements.md`: kiến trúc, vai trò, dữ liệu và business rules.
- `docs/ui-requirements.md`: luồng UX/UI, màn hình, trạng thái và tiêu chí nghiệm thu.
- `src/ui/AGENTS.md`: quy tắc riêng cho HTML, CSS và JavaScript của giao diện.

Khi tài liệu và mã nguồn mâu thuẫn, không tự đoán. Nêu rõ mâu thuẫn, chỉ ra file liên quan và hỏi trước khi đổi nghiệp vụ.

## 3. Nguyên tắc tổ chức file

- Tổ chức theo **feature trước, loại file sau**. Một feature nên gom các file liên quan trong cùng thư mục.
- Mỗi file chỉ có một trách nhiệm chính.
- Không tạo thư mục sâu quá 3 cấp bên dưới `src/ui` nếu chưa có lý do cụ thể.
- Không tạo file chỉ để chứa một hằng số hoặc một hàm nhỏ nếu file đó chưa có khả năng tái sử dụng.
- Không tạo `helpers`, `misc`, `common2`, `new`, `final` hoặc tên mơ hồ.
- Không nhân bản cùng một logic cho nhiều màn hình; đưa logic dùng chung vào `shared` sau khi có ít nhất hai nơi sử dụng.
- Tên file dùng `kebab-case`; tên biến và hàm dùng `camelCase`; tên class CSS dùng `kebab-case`.
- Mỗi feature phải có một file chính có tên trùng thư mục, ví dụ `dashboard/dashboard.js`.
- Ưu tiên file ngắn và dễ đọc. Nếu một file vượt khoảng 250 dòng, xem xét tách theo trách nhiệm, không tách máy móc.

## 4. Cấu hình và dữ liệu

- Cấu hình ứng dụng đặt tập trung trong `src/ui/config/`.
- Không rải URL API, trạng thái, tên route, feature flag hoặc giá trị môi trường trong các file giao diện.
- Không commit secret, token thật hoặc dữ liệu khách hàng thật.
- Cấu hình khác nhau theo môi trường phải dùng biến môi trường hoặc file mẫu; không sửa trực tiếp trong feature.
- Dữ liệu giả lập/demo đặt trong `src/ui/mocks/`, không trộn vào `src/ui/features/`.
- Không đặt business rule vào file cấu hình. Rule nghiệp vụ phải nằm ở backend hoặc module nghiệp vụ tương ứng.

## 5. Quy trình cho mỗi thay đổi

1. Đọc `AGENTS.md` gần file cần sửa và tài liệu liên quan.
2. Tìm một ví dụ tương tự trong codebase trước khi tạo pattern mới.
3. Xác định rõ feature, file đầu vào, file đầu ra và hành vi cần thay đổi.
4. Sửa ít file nhất có thể; không refactor lan sang khu vực không liên quan.
5. Cập nhật tài liệu hoặc test nếu thay đổi contract, trạng thái hoặc luồng nghiệp vụ.
6. Chạy lệnh kiểm tra hiện có trong `package.json`; nếu chưa có script, không tự bịa lệnh.
7. Báo cáo file đã đổi, cách kiểm tra và phần còn chưa kiểm chứng.

## 6. Ranh giới không được tự ý vượt qua

- Không thêm framework, thư viện hoặc bundler mới chỉ để giải quyết vấn đề tổ chức file.
- Không đổi tên hàng loạt file hoặc di chuyển thư mục đang được sử dụng nếu chưa kiểm tra toàn bộ import/link.
- Không thay đổi database, API contract, quyền truy cập hoặc business rule khi yêu cầu chỉ nói về UI.
- Không xóa code cũ khi chưa xác định nơi sử dụng và chưa có thay thế tương đương.
- Không làm một file “siêu tổng hợp” chứa toàn bộ markup, style, API và state của ứng dụng.

## 7. Cách cung cấp context cho LLM

Mỗi task nên bắt đầu bằng một context nhỏ:

```text
Mục tiêu: [một câu]
Feature: [tên thư mục]
Đọc trước: [tối đa 5 file liên quan]
Được phép sửa: [danh sách file/thư mục]
Không được đổi: [API, business rule hoặc khu vực ngoài phạm vi]
Tiêu chí hoàn thành: [các điều kiện kiểm chứng được]
```

Không nạp toàn bộ repository vào một task. Chỉ đọc rule gốc, rule của thư mục đang làm và các file liên quan trực tiếp.

