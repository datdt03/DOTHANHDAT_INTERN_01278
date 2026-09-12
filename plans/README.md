# Plans — LLM implementation tasks

Thư mục này chỉ chứa kế hoạch triển khai dành cho LLM. Chỉ tạo hoặc cập nhật
file trong `plans/` sau khi Product yêu cầu rõ ràng.

## Quy tắc phạm vi

- Thảo luận nghiệp vụ, quyết định đã chốt, câu hỏi còn mở và context sản phẩm nằm trong `docs/v0/`.
- `plans/` chỉ chứa mục tiêu triển khai, task cards, file được phép sửa, test và acceptance criteria.
- Mỗi task phải đủ nhỏ để một LLM thực hiện và kiểm chứng được.
- Với task full-stack, chia theo cluster: một nhánh Codex xử lý server và một nhánh Antigravity xử lý UI trong cùng cluster; không chờ hoàn thành toàn bộ server mới làm UI.
- Không tạo API contract, API handoff, release note hoặc tài liệu production trong thư mục này nếu Product chưa yêu cầu riêng.
- Không dùng nội dung trong `docs/v0/archive/` làm nguồn sự thật.

## Plan đang hiệu lực

- [000 — RepairFlow v1 implementation](./000-repairflow-v1-implementation.md): bản đồ triển khai lớn theo cluster và gate.
- [002 — API server Codex](./002-api-server-codex.md): task packet phía FastAPI/PostgreSQL.
- [003 — UI Antigravity](./003-ui-antigravity.md): task packet phía UI.

## Nguồn đầu vào bắt buộc

- [Product docs v0](../docs/v0/README.md).
- [Requirements closure](../docs/v0/requirements-closure.md), nếu task còn phụ thuộc quyết định chưa hoàn tất.
- `README.md`, `AGENTS.md` và `src/ui/AGENTS.md` khi task chạm khu vực tương ứng.

## Cấu trúc tối thiểu của một plan

- Goal
- Scope
- Out of scope
- Input files
- Output files
- Files to write
- Step-by-step implementation
- Testing plan
- Acceptance criteria

Mọi checklist phải ghi rõ trạng thái; không ghi kết quả triển khai hoặc nhật ký thảo luận dài vào plan.
