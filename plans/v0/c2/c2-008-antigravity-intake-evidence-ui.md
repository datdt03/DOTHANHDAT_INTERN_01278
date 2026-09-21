# C2-008 — Antigravity capture/upload ảnh ngoại quan trong intake

Plan ID: c2-008

Title: UX/UI chụp nhiều ảnh, caption tùy chọn và mô tả tổng bắt buộc

Owner: Antigravity

Status: READY

Revision: 2

Depends on: c2-002-antigravity-customer-area.md,
             c2-007-codex-intake-evidence-foundation.md

Produces: Vùng ảnh ngoại quan trong từng repair item, local photo state,
          guided capture flow, evidence upload/retry và handoff C3.

Consumed by: c2-009 vertical acceptance và C3 intake/evidence

## Task context

```text
Goal: Cho nhân viên chụp/chọn một hoặc nhiều ảnh ngoại quan ngay tại bước tiếp
      nhận, kèm caption tùy chọn và mô tả tổng tình trạng bắt buộc.
Feature: repair-intake-workflow condition evidence
Read first: src/ui/AGENTS.md, c2-002, c2-007, docs/v0/06-ui-requirements.md,
            docs/v0/08-ui-design-blueprint-and-stitch-handoff.md.
Allowed to change: repair-intake-workflow, typed evidence adapter, route tối thiểu
                    và tests UI evidence.
Do not change: CreateRepairIntake JSON semantics, server authorization, global
               shell, tag catalog c2-005/c2-006, C3 transition hoặc localStorage.
Completion criteria: mỗi item có capture/picker, multiple photo preview, caption
                     optional, mô tả tổng required và upload retry đúng sequence.
```

## UX contract

Trong Giai đoạn 2, mỗi repair item hiển thị `Ảnh ngoại quan ban đầu`:

- mở camera trên thiết bị hỗ trợ;
- chọn nhiều file ảnh trên desktop;
- preview thumbnail, filename, size và shot type;
- xóa ảnh trước khi tạo order;
- caption/bình luận riêng cho từng ảnh là tùy chọn;
- field `Mô tả tổng tình trạng ngoại quan *` là bắt buộc;
- hiển thị upload state theo ảnh: pending, uploading, uploaded, failed/retry.

Gợi ý quy trình chụp:

1. Mặt trước.
2. Mặt sau.
3. Các cạnh/cổng kết nối.
4. Khu vực hư hỏng.
5. Phụ kiện nếu cần.

Đây là hướng dẫn, không bắt buộc đủ mọi góc. Điều kiện bắt buộc là mỗi item có
ít nhất một ảnh hợp lệ và mô tả tổng không rỗng.

## Upload sequence

```text
User nhập item + tag + mô tả tổng
        ↓
Ảnh giữ trong memory của workflow
        ↓
POST /api/repair-orders/intake
        ↓
Nhận repairOrderItemId
        ↓
Upload từng ảnh qua c2-007
        ↓
Hiển thị completed hoặc pending retry
```

Không đưa `File`, Base64 hoặc object URL vào JSON `CreateRepairIntakePayload`.
Adapter phải có method upload riêng. Object URL phải được revoke khi xóa ảnh,
reset workflow hoặc component unmount.

Nếu upload một ảnh lỗi:

- order đã tạo vẫn ở `received`;
- ảnh thành công không upload lại;
- ảnh lỗi có nút retry riêng;
- không gọi lại CreateRepairIntake;
- không hiển thị `Tiếp nhận hoàn tất` cho tới khi tất cả item đạt rule.

## Required states and accessibility

- loading skeleton cho picker/upload;
- empty state khi chưa có ảnh;
- validation cho thiếu ảnh hoặc thiếu mô tả tổng;
- upload error/retry với message tiếng Việt;
- unavailable/preview read-only;
- forbidden/session expired không giữ protected detail cũ;
- accessible label, keyboard focus, camera permission fallback;
- responsive 1440×1024, 1280×800, 768×1024 và mobile 390×844;
- zoom 110–150% không tạo horizontal body overflow.

## Implementation sequence

- [ ] Tách local photo draft khỏi API payload hiện tại.
- [ ] Tạo component capture/picker theo từng repair item.
- [ ] Thêm multiple selection, preview/remove và caption.
- [ ] Thêm guided shot suggestions/shot type.
- [ ] Bắt buộc mô tả tổng ở validation UI trước khi submit.
- [ ] Nối create-order → upload-evidence adapter.
- [ ] Implement partial success, per-photo retry và reset cleanup.
- [ ] Không lưu photos/credential/business draft vào localStorage.
- [ ] Viết checklist/evidence theo UI rules.

## Testing plan

- [ ] Một ảnh hợp lệ + mô tả tổng hợp lệ.
- [ ] Nhiều ảnh, caption có/không có.
- [ ] Nhiều repair item, ảnh không bị gán nhầm item.
- [ ] Thiếu ảnh và thiếu mô tả tổng đều chặn hoàn tất.
- [ ] Upload lỗi không tạo success giả và retry không tạo order thứ hai.
- [ ] Preview/unavailable là read-only.
- [ ] Camera fallback desktop picker.
- [ ] Keyboard/focus, mobile, zoom và responsive.
- [ ] Không direct fetch/database/localStorage trong feature.

## Acceptance criteria

- [ ] Nhân viên thêm được một hoặc nhiều ảnh trên mỗi thiết bị.
- [ ] Caption từng ảnh là tùy chọn.
- [ ] Mô tả tổng tình trạng ngoại quan là bắt buộc.
- [ ] UI có hướng dẫn chụp nhưng không ép đủ mọi góc.
- [ ] Ảnh upload sau khi order tồn tại, có retry riêng.
- [ ] Upload failure giữ order `received` và không tạo success giả.
- [ ] Không chuyển order sang `diagnosing` trong C2.
