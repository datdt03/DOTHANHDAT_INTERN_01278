# RepairFlow — Yêu cầu UX/UI

## 1. Mục tiêu tài liệu

Tài liệu này mô tả yêu cầu UX/UI cho RepairFlow — hệ thống quản lý quy trình sửa chữa thiết bị cá nhân. Giao diện phải giúp cửa hàng tạo ra một chuỗi bằng chứng rõ ràng từ lúc tiếp nhận thiết bị đến khi chẩn đoán, báo giá, sửa chữa, bàn giao và bảo hành.

Mỗi phiếu sửa chữa là một workspace trung tâm. Mọi thông tin liên quan đến khách hàng, thiết bị, hiện trạng, báo giá, công việc, kiểm tra chất lượng và bàn giao phải truy cập được từ cùng một hồ sơ.

## 2. Nguyên tắc thiết kế

- Mỗi trạng thái phải cho người dùng biết bước tiếp theo và người chịu trách nhiệm.
- Bằng chứng quan trọng như ảnh, checklist, báo giá và quyết định của khách phải dễ tìm lại.
- Không cho phép bỏ qua các bước bắt buộc trước khi chuyển trạng thái.
- Giao diện nhân viên có đầy đủ thông tin nghiệp vụ; giao diện khách hàng chỉ hiển thị thông tin cần thiết và dễ hiểu.
- Nút hành động chính thay đổi theo trạng thái hiện tại của phiếu.
- Ngôn ngữ giao diện dùng thuật ngữ dễ hiểu với nhân viên cửa hàng và khách hàng, không phụ thuộc vào mã trạng thái nội bộ.

## 3. Vai trò và điểm vào chính

### Mô hình truy cập MVP

- Chỉ Owner/Manager nhìn thấy màn hình đăng nhập và sử dụng phiên nội bộ.
- Receptionist/Technician không có tài khoản riêng; quản lý thao tác trên giao diện và chọn đúng hồ sơ nhân sự cho từng bước.
- Không hiển thị “Đăng nhập kỹ thuật viên”. “Việc của kỹ thuật viên” là bộ lọc theo hồ sơ được phân công.
- Customer vẫn truy cập public link bằng token, không cần tài khoản.

### Receptionist/Front Desk

Ưu tiên các tác vụ:

- Tạo phiếu.
- Ghi nhận hiện trạng.
- Gửi link báo giá.
- Bàn giao thiết bị.
- Các thao tác được thực hiện trong phiên Owner/Manager; không có login riêng trong MVP.

### Technician

Ưu tiên các tác vụ:

- Xem việc được phân công.
- Chẩn đoán.
- Lập và cập nhật báo giá.
- Ghi nhận sửa chữa.
- Kiểm tra chất lượng.
- Kỹ thuật viên là hồ sơ được gán vào phiếu; không có login riêng trong MVP.

### Manager/Owner

Ưu tiên các tác vụ:

- Theo dõi Dashboard.
- Phân công nhân viên.
- Theo dõi phiếu trễ hoặc đang chờ xử lý.
- Xem báo cáo và lịch sử thao tác.

### Customer

Không cần tài khoản trong MVP. Khách truy cập thông tin thông qua link bảo mật được cấp cho đúng phiếu và báo giá.

## 4. Luồng nghiệp vụ tổng thể

```text
Dashboard
    → Tạo phiếu sửa chữa
    → Tiếp nhận khách và thiết bị
    → Ghi nhận hiện trạng và bằng chứng
    → Chẩn đoán
    → Lập báo giá
    → Gửi link cho khách
    → Khách duyệt hoặc từ chối
    → Tiến hành sửa chữa
    → Kiểm tra chất lượng
    → Sẵn sàng bàn giao
    → Bàn giao và kích hoạt bảo hành
    → Lịch sử sửa chữa
```

### Luồng trạng thái nội bộ

```text
received
    → diagnosing
    → waiting_for_approval
    → approved | rejected
    → repairing
    → quality_check
    → ready_for_pickup
    → handed_over
    → warranty_active
```

Nếu kiểm tra chất lượng không đạt, phiếu quay lại `repairing`.

## 5. Cấu trúc điều hướng nội bộ

Thanh điều hướng chính gồm:

- **Dashboard**: tổng quan tiến độ và các phiếu cần xử lý.
- **Phiếu sửa chữa**: danh sách, tìm kiếm, lọc và tạo phiếu mới.
- **Việc của tôi**: các phiếu được phân công cho nhân viên hiện tại.
- **Khách hàng**: hồ sơ và lịch sử sửa chữa theo khách hàng.
- **Thiết bị**: thông tin thiết bị và lịch sử theo serial number hoặc mã nhận diện.
- **Thông báo**: báo giá chờ duyệt, phiếu quá hạn, phiếu sẵn sàng bàn giao.
- **Cài đặt**: cửa hàng, nhân viên, vai trò và chính sách quy trình.

## 6. Yêu cầu màn hình và luồng chi tiết

### 6.1. Dashboard

Dashboard phải trả lời nhanh các câu hỏi:

- Có bao nhiêu phiếu đang xử lý theo từng trạng thái?
- Phiếu nào đang chờ khách duyệt?
- Phiếu nào quá thời gian dự kiến?
- Phiếu nào sẵn sàng bàn giao?
- Nhân viên nào đang có phiếu được phân công?

Các thẻ chỉ số đề xuất:

- Đang tiếp nhận/chẩn đoán.
- Chờ khách duyệt.
- Đang sửa chữa.
- Chờ kiểm tra chất lượng.
- Sẵn sàng bàn giao.
- Quá hạn.

Mỗi thẻ phải dẫn đến danh sách đã được lọc tương ứng.

### 6.2. Danh sách phiếu sửa chữa

Mỗi dòng phiếu hiển thị:

- Mã phiếu.
- Tên khách hàng.
- Thiết bị.
- Trạng thái.
- Người phụ trách chính.
- Ngày tiếp nhận.
- Ngày dự kiến hoàn tất.
- Dấu hiệu quá hạn nếu có.

Bộ lọc tối thiểu:

- Trạng thái.
- Người phụ trách.
- Ngày tiếp nhận.
- Phiếu quá hạn.
- Phiếu đang chờ khách.

### 6.3. Tạo phiếu sửa chữa

#### Bước 1: Chọn hoặc tạo khách hàng

Form gồm:

- Tên khách hàng.
- Số điện thoại.
- Email.
- Ghi chú.

Nếu số điện thoại đã tồn tại, hệ thống phải đề xuất hồ sơ khách hàng cũ để tránh tạo trùng.

#### Bước 2: Chọn hoặc tạo thiết bị

Form gồm:

- Loại thiết bị.
- Hãng và model.
- Serial number hoặc mã nhận diện.
- Ghi chú thiết bị.

Nếu thiết bị đã có lịch sử, hiển thị nhanh các phiếu sửa chữa trước đó.

#### Bước 3: Ghi nhận vấn đề khách mô tả

Form gồm:

- Vấn đề khách gặp phải.
- Thời điểm bắt đầu nếu biết.
- Trạng thái bật nguồn.
- Phụ kiện nhận kèm.
- Ngày dự kiến hoàn tất.
- Ghi chú tiếp nhận.

Sau khi lưu, hệ thống tạo mã phiếu dễ đọc và duy nhất trong workspace, ví dụ `RF-20260911-001`.

### 6.4. Ghi nhận hiện trạng và bằng chứng

Đây là bước bắt buộc trước khi bắt đầu chẩn đoán hoặc sửa chữa. Giao diện kết hợp checklist, ghi chú và ảnh.

Các nhóm kiểm tra đề xuất:

- Ngoại hình: trầy, móp, nứt, vỡ.
- Màn hình.
- Camera.
- Loa và micro.
- Nút bấm.
- Cổng sạc.
- Wi-Fi và Bluetooth.
- Tình trạng bật nguồn.
- Phụ kiện đi kèm.
- Ghi chú khác.

Ảnh phải hiển thị dưới dạng thumbnail, có thể ghi chú từng ảnh và đánh dấu ảnh quan trọng. Có thể dùng hướng dẫn chụp mặt trước, mặt sau, cạnh bên và vùng hư hỏng.

Nếu checklist hoặc bằng chứng tối thiểu chưa hoàn tất, hiển thị:

```text
Chưa hoàn tất hiện trạng. Chưa thể chuyển sang chẩn đoán.
```

### 6.5. Chi tiết phiếu sửa chữa

Đây là workspace trung tâm của nhân viên.

#### Header

Hiển thị:

- Mã phiếu.
- Tên khách hàng.
- Thiết bị.
- Trạng thái hiện tại.
- Người phụ trách và các vai trò liên quan.
- Ngày dự kiến hoàn tất.
- Nút hành động chính theo trạng thái.

Nút hành động đề xuất:

| Trạng thái | Nhãn hiển thị | Hành động chính |
| --- | --- | --- |
| `received` | Đã tiếp nhận | Bắt đầu chẩn đoán |
| `diagnosing` | Đang chẩn đoán | Tạo báo giá |
| `waiting_for_approval` | Chờ khách duyệt | Sao chép hoặc gửi link |
| `approved` | Đã duyệt | Bắt đầu sửa |
| `repairing` | Đang sửa | Hoàn tất sửa chữa |
| `quality_check` | Kiểm tra chất lượng | Ghi nhận kết quả |
| `ready_for_pickup` | Sẵn sàng bàn giao | Tạo biên bản bàn giao |

#### Nội dung phiếu

Chia thành các section hoặc tab:

1. Tổng quan.
2. Hiện trạng và bằng chứng.
3. Chẩn đoán và báo giá.
4. Công việc sửa chữa.
5. Kiểm tra chất lượng.
6. Bàn giao và bảo hành.
7. Timeline lịch sử.

Timeline nên luôn hiển thị ở cạnh phải hoặc cuối màn hình, gồm thời điểm, người thực hiện, hành động, ghi chú và tài liệu liên quan.

Ví dụ:

```text
09:10 — Linh tiếp nhận thiết bị
09:45 — Nam hoàn tất chẩn đoán
10:20 — Đã gửi báo giá phiên bản 1
11:05 — Khách đã duyệt báo giá
13:30 — Hoàn tất sửa chữa
14:00 — Đạt kiểm tra chất lượng
```

### 6.6. Chẩn đoán và báo giá

#### Chẩn đoán

Form gồm:

- Kết quả kiểm tra.
- Nguyên nhân lỗi.
- Đề xuất xử lý.
- Thời gian sửa dự kiến.
- Người chẩn đoán.
- Ảnh hoặc ghi chú kỹ thuật.

#### Báo giá

Mỗi dòng báo giá gồm:

- Loại: linh kiện hoặc công sửa.
- Mô tả.
- Số lượng.
- Đơn giá.
- Lý do thay thế hoặc sửa chữa.
- Thời gian dự kiến.

Cuối báo giá hiển thị tạm tính, tổng tiền, ghi chú gửi khách và phiên bản báo giá.

Báo giá phải có ba hành động: **Lưu nháp**, **Gửi link khách hàng** và **Tạo phiên bản mới**. Báo giá đã gửi hoặc đã duyệt ở trạng thái chỉ đọc. Mọi thay đổi sau đó phải tạo phiên bản mới và yêu cầu khách quyết định lại.

### 6.7. Giao diện khách hàng qua link

Khách hàng không cần tạo tài khoản. Trang public tập trung vào thông tin cần xem và quyết định cần thực hiện.

Nội dung đề xuất:

1. Tên cửa hàng, mã phiếu và thiết bị.
2. Tiến độ sửa chữa.
3. Tình trạng thiết bị lúc tiếp nhận.
4. Kết quả chẩn đoán.
5. Chi tiết báo giá.
6. Thời gian dự kiến.
7. Ảnh liên quan.
8. Nút **Đồng ý sửa chữa**.
9. Nút **Từ chối hoặc trao đổi**.

Khi khách duyệt, hiển thị bước xác nhận gồm tên người xác nhận, phiên bản báo giá và thời gian. Sau khi ghi nhận, nút duyệt bị khóa để tránh gửi lặp.

### 6.8. Sửa chữa và kiểm tra chất lượng

#### Sửa chữa

Màn hình quản lý công việc kỹ thuật gồm:

- Danh sách công việc đã được duyệt.
- Checklist thực hiện.
- Ghi chú tiến độ.
- Thời gian bắt đầu và kết thúc.
- Ảnh sau sửa.
- Linh kiện thực tế đã sử dụng.

UI phải phân biệt rõ bốn trạng thái của công việc: **đề xuất**, **đã duyệt**, **đã thực hiện** và **đã kiểm tra**.

#### Kiểm tra chất lượng

Checklist nên gồm:

- Lỗi ban đầu đã được xử lý chưa.
- Thiết bị có khởi động bình thường không.
- Chức năng liên quan có hoạt động không.
- Có phát sinh lỗi mới không.
- Ngoại hình sau sửa.
- Ảnh sau sửa.
- Kết luận đạt hoặc không đạt.
- Ghi chú giới hạn còn lại.

Nếu không đạt, phiếu quay lại `repairing` và không được chuyển thẳng sang bàn giao.

### 6.9. Bàn giao và bảo hành

Form bàn giao gồm:

- Tên người nhận.
- Ngày giờ bàn giao.
- Phụ kiện trả lại.
- Tình trạng cuối.
- Ghi chú.
- Xác nhận bàn giao.
- Người thực hiện bàn giao.
- Thời hạn bảo hành hoặc ngày hết hạn.

Sau khi lưu:

- Chuyển trạng thái sang `handed_over`.
- Kích hoạt bảo hành từ ngày bàn giao.
- Khóa các thông tin quan trọng của phiếu.
- Đưa phiếu vào lịch sử khách hàng và thiết bị.

## 7. Trạng thái lỗi và ngoại lệ

UX phải có trạng thái và thông báo rõ cho các trường hợp:

- Link khách hàng hết hạn hoặc đã bị thu hồi.
- Khách từ chối báo giá.
- Báo giá được thay đổi sau khi khách đã duyệt.
- Checklist hiện trạng chưa hoàn tất.
- Thiếu ảnh bằng chứng.
- Kiểm tra chất lượng không đạt.
- Phiếu quá thời gian dự kiến.
- Thiết bị đã có phiếu sửa chữa đang mở.
- Nhân viên bị vô hiệu hóa nhưng vẫn còn phiếu được phân công.

## 8. Danh sách màn hình MVP

1. Đăng nhập Owner/Manager.
2. Dashboard.
3. Danh sách phiếu sửa chữa.
4. Tạo phiếu sửa chữa.
5. Chi tiết phiếu sửa chữa.
6. Ghi nhận hiện trạng và ảnh.
7. Chẩn đoán.
8. Báo giá theo phiên bản.
9. Trang public cho khách hàng.
10. Checklist sửa chữa.
11. Kiểm tra chất lượng.
12. Bàn giao và bảo hành.
13. Hồ sơ khách hàng.
14. Hồ sơ thiết bị.
15. Timeline và audit log cơ bản.

## 9. Tiêu chí nghiệm thu UX/UI

- Người dùng luôn nhìn thấy trạng thái hiện tại và bước tiếp theo của phiếu.
- Owner/Manager có thể hoàn tất luồng tạo phiếu và ghi nhận staff profile Receptionist mà không cần rời khỏi luồng.
- Quản lý chỉ chọn và ghi nhận Technician trong phạm vi hồ sơ nhân sự đang active; Technician không có session riêng trong MVP.
- Khách hàng có thể xem báo giá, hiểu nội dung cần duyệt và đưa ra quyết định không cần tài khoản.
- Không thể bắt đầu sửa nếu chưa có quyết định `approved` cho đúng phiên bản báo giá.
- Không thể bàn giao nếu checklist chất lượng chưa đạt.
- Có thể truy ngược từ phiếu đến ảnh, báo giá, quyết định khách, checklist, bàn giao và bảo hành.
- Giao diện hiển thị rõ các trường hợp link hết hạn, báo giá mới, phiếu quá hạn và kiểm tra không đạt.

## 10. Tài liệu liên quan

- [README sản phẩm](../../README.md)
- [Kiến trúc và yêu cầu hệ thống](./architecture-and-requirements.md)
