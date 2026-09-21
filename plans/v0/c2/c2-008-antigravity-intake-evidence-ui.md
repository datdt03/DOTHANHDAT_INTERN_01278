# C2-008 — Antigravity capture/upload ảnh ngoại quan trong intake

Plan ID: c2-008

Title: UX/UI chụp tối đa 5 ảnh và mô tả tổng bắt buộc

Owner: Antigravity

Status: READY

Revision: 3

Depends on: c2-002-antigravity-customer-area.md,
             c2-007-codex-intake-evidence-foundation.md

Produces: Vùng ảnh ngoại quan trong từng repair item, local photo state,
          guided capture flow, evidence upload/retry, lock state và handoff C3.

Consumed by: c2-009 vertical acceptance và C3 intake/evidence

## Task context

```text
Goal: Cho nhân viên chụp/chọn một hoặc nhiều ảnh ngoại quan ngay tại bước tiếp
      nhận, với tối đa 5 ảnh và mô tả tổng tình trạng bắt buộc.
Feature: repair-intake-workflow condition evidence
Read first: src/ui/AGENTS.md, c2-002, c2-007, docs/v0/06-ui-requirements.md,
            docs/v0/08-ui-design-blueprint-and-stitch-handoff.md.
Allowed to change: repair-intake-workflow, typed evidence adapter, route tối thiểu
                    và tests UI evidence.
Do not change: CreateRepairIntake JSON semantics, server authorization, global
               shell, tag catalog c2-005/c2-006, C3 transition hoặc localStorage.
Completion criteria: mỗi item có capture/picker, tối đa 5 photo preview,
                     mô tả tổng required, upload retry đúng sequence và read-only
                     state sau khi Technician nhận bàn giao.
```

## UX contract

Trong Giai đoạn 2, mỗi repair item hiển thị `Ảnh ngoại quan ban đầu`:

- mở camera trên thiết bị hỗ trợ;
- chọn nhiều file ảnh trên desktop;
- preview thumbnail, filename và size;
- xóa ảnh trước khi tạo order;
- không có caption riêng từng ảnh trong C2;
- field `Mô tả tổng tình trạng ngoại quan *` là bắt buộc;
- hiển thị upload state theo ảnh: pending, uploading, uploaded, failed/retry.

Gợi ý quy trình chụp:

1. Mặt trước.
2. Mặt sau.
3. Các cạnh/cổng kết nối.
4. Khu vực hư hỏng.
5. Phụ kiện nếu cần.

Đây là hướng dẫn, không bắt buộc đủ mọi góc. Điều kiện bắt buộc là mỗi item có
ít nhất một ảnh hợp lệ, tối đa 5 ảnh và mô tả tổng không rỗng. Chỉ cho phép
JPG/JPEG/PNG, mỗi ảnh tối đa 1 MB.

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

Storage do c2-007 quản lý qua private S3-compatible Object Storage. UI không
biết bucket, credential hoặc object key; adapter chỉ nhận safe metadata và
signed access response từ API.

Không đưa `File`, Base64 hoặc object URL vào JSON `CreateRepairIntakePayload`.
Adapter phải có method upload riêng. Object URL phải được revoke khi xóa ảnh,
reset workflow hoặc component unmount.

Nếu upload một ảnh lỗi:

- order đã tạo vẫn ở `received`;
- ảnh thành công không upload lại;
- ảnh lỗi có nút retry riêng;
- không gọi lại CreateRepairIntake;
- không hiển thị `Tiếp nhận hoàn tất` cho tới khi tất cả item đạt rule.

Khi Technician xác nhận nhận bàn giao item, UI chuyển vùng ảnh sang read-only:
không hiển thị thêm/xóa/upload. Lock này theo item; item khác trong cùng order
vẫn theo trạng thái riêng.

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
- [ ] Thêm multiple selection, preview/remove, giới hạn 5 ảnh và 1 MB/ảnh.
- [ ] Thêm guided shot suggestions nhưng không lưu shot type thành metadata.
- [ ] Bắt buộc mô tả tổng ở validation UI trước khi submit.
- [ ] Nối create-order → upload-evidence adapter.
- [ ] Implement partial success, per-photo retry và reset cleanup.
- [ ] Implement read-only lock state sau Technician handover acceptance.
- [ ] Không lưu photos/credential/business draft vào localStorage.
- [ ] Viết checklist/evidence theo UI rules.

## Testing plan

- [ ] Một ảnh hợp lệ + mô tả tổng hợp lệ.
- [ ] Nhiều ảnh tối đa 5 ảnh/item, không có caption riêng từng ảnh.
- [ ] Nhiều repair item, ảnh không bị gán nhầm item.
- [ ] Thiếu ảnh và thiếu mô tả tổng đều chặn hoàn tất.
- [ ] Upload lỗi không tạo success giả và retry không tạo order thứ hai.
- [ ] Item đã lock không còn control upload/remove; item chưa lock vẫn chỉnh sửa được.
- [ ] Preview/unavailable là read-only.
- [ ] Camera fallback desktop picker.
- [ ] Keyboard/focus, mobile, zoom và responsive.
- [ ] Không direct fetch/database/localStorage trong feature.

## Acceptance criteria

- [ ] Nhân viên thêm được một hoặc nhiều ảnh trên mỗi thiết bị.
- [ ] Mỗi item thêm được tối đa 5 ảnh JPG/JPEG/PNG, mỗi ảnh <= 1 MB.
- [ ] Mô tả tổng tình trạng ngoại quan là bắt buộc.
- [ ] UI có hướng dẫn chụp nhưng không ép đủ mọi góc.
- [ ] Ảnh upload sau khi order tồn tại, có retry riêng.
- [ ] Upload failure giữ order `received` và không tạo success giả.
- [ ] UI phản ánh đúng lock theo item sau khi Technician nhận bàn giao.
- [ ] Không chuyển order sang `diagnosing` trong C2.
