# RepairFlow — Documentation v0

## Vai trò

`docs/v0/` là nơi lưu toàn bộ thông tin thảo luận, phân tích nghiệp vụ, phạm vi và quyết định đã được chốt cho giai đoạn v0 của RepairFlow.

Đây là nguồn tham chiếu để viết plan triển khai khi người dùng yêu cầu. Nội dung trong thư mục này không phải là task triển khai cho LLM và chưa phải API contract hoặc release handoff.

Luôn đọc [docs/README.md](../README.md) trước để biết quy tắc phân phase và
quy trình LLM phải tuân thủ khi đọc/viết tài liệu.

## Trạng thái v0

- Sản phẩm đang ở giai đoạn phân tích và chốt yêu cầu.
- FastAPI, PostgreSQL và SQL migration hiện tại mới là nền tảng kỹ thuật local.
- Chưa chốt đủ business flow, access implementation, public flow và các boundary tích hợp.
- Không được tự tạo API contract, API handoff hoặc release documentation mới khi chưa có yêu cầu và quyết định tương ứng.

## Tài liệu active

| File | Nội dung |
| --- | --- |
| [requirements-closure.md](./requirements-closure.md) | Danh sách vấn đề còn thiếu, decision backlog và Gate D0. |
| [usecase.md](./usecase.md) | User story, persona, main flow, alternative flow và acceptance baseline. |
| [architecture-and-requirements.md](./architecture-and-requirements.md) | Vai trò, access model, business rule, state machine và kiến trúc định hướng. |
| [database-requirements.md](./database-requirements.md) | Mô hình dữ liệu, ERD, constraint, index và transaction định hướng. |
| [ui-requirements.md](./ui-requirements.md) | Màn hình, UX flow, UI state và acceptance baseline. |

## Quy tắc chuyển giai đoạn

- Chỉ tạo `docs/v1/` khi người dùng yêu cầu chốt hoặc mở giai đoạn v1.
- Mỗi giai đoạn mới phải có thư mục riêng và không ghi đè lịch sử của v0.
- Chỉ đưa decision đã được người dùng chốt vào tài liệu active của giai đoạn.
- Nội dung chưa chốt phải nằm trong decision backlog, không được biến thành contract/API requirement bắt buộc.
- Khi cần triển khai, tạo file trong `plans/` chỉ sau khi người dùng yêu cầu; plan phải chỉ chứa task triển khai để LLM thực hiện.

## Archive

`archive/` chỉ giữ các bản nháp cũ để tham chiếu và không phải nguồn sự thật. LLM không được dùng các file archive để tự suy ra API, release status hoặc business rule mới.
