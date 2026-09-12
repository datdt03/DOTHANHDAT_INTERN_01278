# RepairFlow — Documentation guide for LLM

## 1. Mục đích

File này là điểm vào bắt buộc cho LLM trước khi đọc, tạo hoặc cập nhật bất kỳ
tài liệu nào trong repository. Nó quy định tài liệu nào là nguồn thảo luận sản
phẩm, tài liệu nào là task triển khai và giới hạn những điều LLM không được tự
quyết định.

## 2. Quy tắc phân khu vực

| Khu vực | Vai trò | Quy tắc sử dụng |
| --- | --- | --- |
| `docs/README.md` | Quy tắc đọc/viết docs và bản đồ phase | Không chứa nghiệp vụ chi tiết của một phase. |
| `docs/v0/` | Tài liệu thảo luận, phân tích, phạm vi và quyết định của phase v0 | Đây là phase hiện tại; đọc `docs/v0/README.md` trước các file con. |
| `docs/v1/`, `docs/v2/`, ... | Tài liệu của phase tương lai | Chỉ tạo khi Product yêu cầu chốt hoặc mở phase tương ứng. |
| `docs/*/archive/` | Bản nháp/lịch sử | Không phải nguồn sự thật; không dùng để suy ra nghiệp vụ. |
| `plans/` | Hướng dẫn triển khai cho LLM | Chỉ tạo/cập nhật sau khi người dùng yêu cầu plan; không ghi nhật ký thảo luận vào đây. |
| `README.md` | Tổng quan repository và cách chạy local | Không thay thế tài liệu nghiệp vụ trong phase. |

Tài liệu active của phase không đặt trực tiếp ở `docs/` ngoài file README này.

## 3. Thứ tự bắt buộc trước khi viết docs

1. Đọc `AGENTS.md` ở root và `AGENTS.md` gần khu vực code liên quan.
2. Đọc file này để xác định ranh giới tài liệu.
3. Đọc `docs/v0/README.md` để biết phase hiện tại và danh sách tài liệu active.
4. Chỉ đọc các tài liệu liên quan trực tiếp đến chủ đề đang xử lý:
   - `requirements-closure.md` cho câu hỏi mở và decision backlog.
   - `usecase.md` cho actor, user story, main flow, alternative flow và failure flow.
   - `architecture-and-requirements.md` cho role, state, security, audit và business rules.
   - `database-requirements.md` cho entity, schema, constraint, index và transaction.
   - `ui-requirements.md` cho màn hình, UX, state và acceptance criteria.
5. Tìm nội dung tương tự trước khi tạo file hoặc section mới.
6. Nếu có mâu thuẫn giữa tài liệu, code và yêu cầu mới, dừng việc chốt nghiệp vụ,
   nêu rõ file/mâu thuẫn và chờ Product xác nhận.

## 4. Phân biệt thông tin đã chốt và thông tin đang mở

Mọi tài liệu phase phải phân biệt rõ:

- `DECIDED`: Product đã chốt; LLM được dùng làm cơ sở triển khai.
- `OPEN`: câu hỏi hoặc policy chưa chốt; LLM không được dùng làm business rule bắt buộc.
- `PROPOSED`: phương án đề xuất để Product xem xét; không được coi là quyết định.
- `DRAFT`: nội dung đang soạn, chưa phải nguồn sự thật.
- `ARCHIVED`: bản cũ, chỉ giữ lịch sử và phải bỏ qua khi triển khai.

Không biến default đề xuất, mock UI, tên endpoint hoặc suy luận từ code thành
`DECIDED` nếu chưa có xác nhận của Product.

## 5. Quy tắc viết tài liệu phase

Khi người dùng yêu cầu viết hoặc cập nhật docs:

- Xác định phase trước; hiện tại là `v0`.
- Cập nhật file active phù hợp trong `docs/v0/`, không tạo bản sao ở `docs/` root.
- Giữ một nguồn sự thật cho mỗi chủ đề; dùng link thay vì sao chép nội dung.
- Ghi rõ phạm vi, actor, điều kiện trước, kết quả mong đợi, alternative flow,
  failure flow, dữ liệu liên quan và acceptance criteria khi mô tả nghiệp vụ.
- Ghi các câu hỏi chưa chốt vào decision backlog với trạng thái `OPEN` hoặc `PROPOSED`.
- Chỉ ghi quyết định vào phần active sau khi người dùng/Product chốt.
- Cập nhật mục lục hoặc link liên quan nếu đổi tên/di chuyển file.
- Không đưa secret, token thật, dữ liệu khách hàng thật hoặc thông tin môi trường thật vào docs.

## 6. Những nội dung chưa được tự tạo

Trong trạng thái hiện tại, LLM không được tự tạo hoặc coi là chính thức:

- API contract hoặc API handoff.
- Release note, production status, staging/production runbook.
- Quyết định mới về access, state machine, quote, payment, warranty, retention,
  privacy hoặc concurrency khi chưa được Product chốt.
- Một `docs/v1/` mới khi người dùng chưa yêu cầu mở phase v1.
- Một file trong `plans/` khi người dùng chưa yêu cầu lập plan.

Nếu cần ghi nhận khoảng trống để Product thảo luận, đưa vào
`docs/v0/requirements-closure.md`, đánh dấu rõ `OPEN`/`PROPOSED`, không giả vờ
đã freeze contract hoặc business rule.

## 7. Khi nào được viết plan

Chỉ viết plan khi người dùng yêu cầu rõ ràng. Khi được yêu cầu:

- Plan phải là instruction để LLM triển khai, không phải tài liệu thảo luận.
- Nêu rõ goal, scope, out of scope, input files, output files, files được phép
  sửa, task nhỏ, testing plan và acceptance criteria.
- Với full-stack, chia task theo cluster song song giữa Codex/server và
  Antigravity/UI; không làm toàn bộ server rồi mới làm UI.
- Plan phải trỏ về tài liệu active trong `docs/v0/`, không trỏ archive làm nguồn.
- Không thêm API contract, handoff hoặc release deliverable nếu người dùng chưa yêu cầu.

## 8. Checklist trước khi hoàn tất một tài liệu

- [ ] Đúng phase và đúng thư mục.
- [ ] Không trùng nguồn sự thật với file khác.
- [ ] Phân biệt `DECIDED`, `OPEN`, `PROPOSED`, `DRAFT`, `ARCHIVED`.
- [ ] Không tự chốt nghiệp vụ từ mock, code hoặc default.
- [ ] Có main flow và alternative/failure flow nếu tài liệu mô tả use case.
- [ ] Có liên kết tương đối hợp lệ tới tài liệu liên quan.
- [ ] Không chứa secret, dữ liệu thật, API contract/handoff hoặc release status ngoài phạm vi được yêu cầu.
- [ ] Nếu thay đổi decision đã chốt, đã có xác nhận Product và ghi rõ tác động.

## 9. Phase hiện tại

Đọc tiếp [docs/v0/README.md](./v0/README.md). Đây là mục lục và nguồn hướng dẫn
cho toàn bộ tài liệu active của phase v0.
