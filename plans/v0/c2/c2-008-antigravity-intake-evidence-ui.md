# C2-008 — Antigravity intake evidence UI

Plan ID: c2-008

Title: Thu ảnh hiện trạng trong Giai đoạn 2 và handoff sang C3 evidence

Owner: Antigravity

Status: READY

Revision: 1

Depends on: c2-002-antigravity-customer-area.md,
             c2-007-codex-intake-evidence-foundation.md

Produces: Vùng chụp/tải ảnh hiện trạng trong repair-intake-workflow, typed adapter,
          local photo state và UI evidence cho handoff C3

Consumed by: c2-009-shared-intake-evidence-acceptance.md và C3 intake/evidence

## Task context

```text
Goal: Cho nhân viên chụp hoặc chọn ảnh hiện trạng ngay trong Giai đoạn 2 mà không biến C2 thành owner của evidence completion.
Feature: repair-intake-workflow evidence capture
Read first: src/ui/AGENTS.md, plans/v0/c2/README.md, c2-002, c2-007,
            docs/v0/06-ui-requirements.md, docs/v0/08-ui-design-blueprint-and-stitch-handoff.md
Allowed to change: src/ui/features/repair-intake-workflow, typed feature adapter,
                   route/adapter tối thiểu và tests/ui/repair-intake
Do not change: global shell, Customer/Device API, CreateRepairIntake JSON contract,
               C3 status transition rule, direct fetch/database hoặc localStorage draft
Completion criteria: Stage 2 có capture/upload area, preview/retry/accessibility states,
                     order creation handoff đúng thứ tự và acceptance evidence pass.
```

## Goal

Bổ sung điểm thu ảnh hiện trạng đúng nơi nhân viên đang ghi nhận thiết bị. File
chỉ nằm trong memory của workflow trước khi submit; sau khi `CreateRepairIntake`
trả về order ID, adapter gửi ảnh qua c2-007 evidence API. C3 vẫn kiểm tra
evidence completion và cho phép chuyển sang `diagnosing`.

## UX flow

1. Trong mỗi repair item ở Giai đoạn 2, hiển thị khu vực `Ảnh hiện trạng`.
2. Cho phép mở camera trên thiết bị hỗ trợ hoặc chọn nhiều file ảnh trên desktop.
3. Hiển thị thumbnail, tên/kích thước, caption tùy chọn, xóa ảnh và thêm ảnh.
4. Validate sớm loại file/kích thước ở client để phản hồi nhanh; server vẫn là authority.
5. Review hiển thị số lượng và thumbnail an toàn, không hiển thị object key hoặc URL private.
6. Submit tạo order trước bằng command hiện tại; sau khi có order ID, upload các ảnh
   `before_repair` qua typed evidence adapter.
7. Nếu upload lỗi, hiển thị order đã tạo ở trạng thái `received`, danh sách ảnh lỗi
   và nút retry; không báo hoàn tất evidence hoặc chuyển status giả.

## Scope

- Capture bằng camera/file picker với `image/*` và fallback desktop.
- Nhiều ảnh cho mỗi repair item, giữ thứ tự local ổn định.
- Preview thumbnail, remove, caption/description và important marker nếu contract hỗ trợ.
- Client loading/progress, validation, empty, error/retry, unavailable, forbidden,
  expired và success state.
- Typed adapter chỉ gọi API qua shared/feature adapter; không gọi fetch trong JSX.
- Không lưu File/blob/base64 vào localStorage, URL query hoặc log.
- Responsive mobile-first cho receptionist và desktop zoom checks.
- Evidence handoff map rõ `orderId`, `repairItemId` nếu backend contract yêu cầu.

## Out of scope

- Checklist hiện trạng chi tiết và minimum-photo completion.
- Persist evidence trước khi order tồn tại.
- Sửa `CreateRepairIntake` để nhận multipart nếu c2-007 không chốt hướng đó.
- Chuyển `received` → `diagnosing`.
- Evidence sau sửa, diagnosis, quote, repair, QC, handover hoặc customer link.
- Camera permission management ngoài browser-native behavior.
- Local draft/resume hoặc upload queue sau khi đóng tab.

## Dependencies

- c2-002 cung cấp workflow ba giai đoạn và repair item local state.
- c2-007 cung cấp endpoint, DTO, error codes và upload/access sequence.
- C3 tiếp nhận evidence completion và status transition sau này.

## Files to write or update

- [ ] `src/ui/features/repair-intake-workflow/repair-item-step.tsx`.
- [ ] `src/ui/features/repair-intake-workflow/intake-review-step.tsx`.
- [ ] `src/ui/features/repair-intake-workflow/repair-intake-workflow.tsx`.
- [ ] `src/ui/features/repair-intake-workflow/repair-intake-api.ts`.
- [ ] `src/ui/features/repair-intake-workflow/repair-intake-workflow.css`.
- [ ] `tests/ui/repair-intake/` checklist/evidence and test files.

## Step-by-step implementation

- [ ] Map local photo state và error states vào từng repair item.
- [ ] Implement accessible capture/file input, thumbnail list và remove/retry actions.
- [ ] Giữ File object trong memory, không đưa vào review text, localStorage hoặc log.
- [ ] Nối typed adapter với c2-007 và bảo đảm request theo đúng order/item mapping.
- [ ] Tách submit sequence: create order → upload evidence → render handoff result.
- [ ] Xử lý partial upload và retry không tạo success giả hoặc duplicate ngoài contract.
- [ ] Cập nhật review summary bằng safe photo count/thumbnail, không expose private URL.
- [ ] Kiểm tra mobile camera affordance, desktop picker, keyboard/focus và zoom.
- [ ] Viết evidence cho API unavailable, session expired và forbidden upload.

## Testing plan

- [ ] Chọn một hoặc nhiều ảnh ở mobile/desktop và thấy thumbnail.
- [ ] Xóa, thêm lại, đổi caption và giữ đúng repair item.
- [ ] File không hợp lệ bị chặn trước khi submit; server denial hiển thị đúng.
- [ ] Submit tạo order rồi upload ảnh đúng thứ tự.
- [ ] Upload thất bại không làm mất order; retry chỉ gửi ảnh lỗi.
- [ ] Review không hiển thị credential, object key hoặc signed URL lâu hạn.
- [ ] Session expired/forbidden/unavailable không làm lộ ảnh đã chọn.
- [ ] Không có localStorage/blob persistence hoặc direct fetch trong component.
- [ ] Vietnamese copy, keyboard/focus, mobile viewport và zoom evidence.

## Acceptance criteria

- [ ] Giai đoạn 2 có vùng `Ảnh hiện trạng` dùng được trên mobile và desktop.
- [ ] Người dùng có thể chụp/chọn nhiều ảnh, xem thumbnail, xóa và retry.
- [ ] Ảnh được handoff qua typed adapter sau khi order tồn tại.
- [ ] Lỗi upload không hiển thị thành công giả và không chuyển status.
- [ ] UI không sở hữu evidence completion hoặc backend authorization.
- [ ] Không thay đổi Customer/Device/CreateRepairIntake contract ngoài handoff đã chốt.
- [ ] Có checklist/evidence độc lập cho capture, upload và failure states.

## Change impact

C2-008 là amendment UI cho c2-002. Nó giải quyết khoảng trống trải nghiệm tại
Giai đoạn 2 nhưng giữ C3 là owner của evidence completion, checklist và transition.
