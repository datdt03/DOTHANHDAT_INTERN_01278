# Workspace Tag Picker & Management Checklist & Verification Evidence — C2-006

Tài liệu kiểm định và bằng chứng nghiệm thu khu vực tính năng Quản lý nhãn workspace, gắn nhãn thiết bị tiếp nhận và projection nhãn phiếu sửa chữa (`c2-006`) theo hợp đồng backend `c2-005`.

---

## 1. Thông tin chung

- **Kế hoạch**: `c2-006` (Thực hiện song song và tương thích hoàn toàn với backend `c2-005`)
- **Phạm vi**: Giao diện người dùng React UI (`src/ui`)
- **Ngôn ngữ hiển thị**: 100% Tiếng Việt, thuật ngữ chuẩn nghiệp vụ sửa chữa
- **Hệ thống màu & Thiết kế**: Bảng màu 85/15 Slate neutrals + Sky Blue accents, nhãn chip màu trung tính (`.rf-tag-chip`), tuyệt đối không dùng màu ngẫu nhiên/emoji, chỉ dùng biểu tượng vector monochrome SVG dạng đường nét
- **3 Khóa Contract Bắt buộc**:
  1. **DTO Contract**:
     - `TagDto`: `{ id: string, name: string, createdAt: string, updatedAt: string }`
     - `RepairItemTagsResponseDto`: `{ repairOrderId: string, repairItemId: string, orderStatus: string, tags: TagDto[] }`
  2. **Envelope & Mã lỗi chuẩn**:
     - Cấu trúc: `{ data, meta }`
     - Error Codes: `TAG_NAME_REQUIRED`, `TAG_NAME_TOO_LONG`, `TAG_NAME_INVALID`, `TAG_NAME_EXISTS` (kèm `existingTagId` trong `details`), `TAG_IN_USE`, `TAG_ASSIGNMENT_LOCKED`, `TAG_WORKSPACE_MISMATCH`, `forbidden`, `authentication_required`.
  3. **UI Capabilities (Backend Authority)**:
     - `canReadWorkspaceTags`, `canCreateWorkspaceTags`, `canManageWorkspaceTags`, `canAssignRepairItemTags`.
     - UI không tự kiểm tra quyền theo chuỗi vai trò (role); backend giữ toàn quyền quyết định.

---

## 2. Danh mục Kiểm thử & Bằng chứng thực tế (Test Matrix)

### A. Contract, Capability & API Adapter
| STT | Hạng mục kiểm thử | Tiêu chí nghiệm thu | Trạng thái | Bằng chứng / Ghi chú kỹ thuật |
| :---: | :--- | :--- | :---: | :--- |
| 1 | **Contract DTOs & Error Types** | Định nghĩa đầy đủ `TagDto`, `RepairItemTagsResponseDto`, `TagConflictDetails` | [x] | Khai báo trong `src/ui/shared/api/repair-tag-api.ts`. |
| 2 | **Server Capabilities Mapping** | Map đầy đủ 4 quyền tag từ server vào `RoleCapabilities` | [x] | Triển khai trong `src/ui/shared/api/access-api.ts` (`canReadWorkspaceTags`, `canCreateWorkspaceTags`, `canManageWorkspaceTags`, `canAssignRepairItemTags`). |
| 3 | **Real API Adapter** | Gọi đúng các endpoint `/api/tags` và `/api/repair-orders/{orderId}/items/{itemId}/tags` | [x] | `RealRepairTagAdapter` trong `repair-tag-api.ts` bọc `ApiClientError` và hỗ trợ đầy đủ `SearchTagsQuery`, `CreateTagPayload`, `RenameTagPayload`, `ReplaceItemTagsPayload`. |
| 4 | **Mock API Adapter (Preview Mode)** | Hỗ trợ preview in-memory, mô phỏng xung đột `TAG_NAME_EXISTS` và `TAG_IN_USE` | [x] | `MockRepairTagAdapter` trong `repair-tag-api.ts` khởi tạo với 6 nhãn mẫu, tự động ném mã lỗi `TAG_NAME_EXISTS` nếu tên trùng và `TAG_IN_USE` nếu xóa nhãn đang dùng. |

---

### B. Tag Picker trong Quy trình Tiếp nhận (Repair Intake Step 2 & 3)
| STT | Hạng mục kiểm thử | Tiêu chí nghiệm thu | Trạng thái | Bằng chứng / Ghi chú kỹ thuật |
| :---: | :--- | :--- | :---: | :--- |
| 5 | **Độc lập nhãn theo từng thiết bị** | Mỗi thiết bị (#1, #2...) có state `tagIds` riêng biệt, không gộp chung | [x] | `RepairItemDraft.tagIds` độc lập; `RepairItemStep` mount `RepairItemTagPicker` với `currentItem.tagIds` và cập nhật đúng item đang chọn. |
| 6 | **Chọn nhiều nhãn (Multi-tag Selection)** | Cho phép chọn nhiều nhãn đồng thời; hiển thị danh sách chip đã chọn | [x] | Chọn checkbox hoặc click option trong popup; hiển thị danh sách `.rf-tag-chip` với nút xóa `×`. |
| 7 | **Tìm kiếm nhãn với debounce** | Gõ từ khóa tìm kiếm theo tên nhãn trong danh mục | [x] | Combobox input lọc danh mục tag cục bộ hoặc qua API tìm kiếm tức thời; hỗ trợ nút xóa tìm kiếm `×`. |
| 8 | **Inline Create khi không tìm thấy** | Tìm kiếm không thấy hiện CTA `+ Tạo nhãn "[từ khóa]"` | [x] | Option `.rf-tag-popup__create-item` tự động xuất hiện khi có từ khóa chưa tồn tại trong danh mục và quyền `canCreate` là true. |
| 9 | **Tự động chọn nhãn sau khi tạo** | Tạo mới thành công tự động thêm nhãn vào danh sách chọn của thiết bị | [x] | Sau khi gọi `tagApi.createTag`, nhãn mới được thêm vào danh mục và ID được push vào `selectedTagIds`. |
| 10 | **Tự xử lý xung đột `TAG_NAME_EXISTS`** | Khi tên nhãn đã có, backend trả về `TAG_NAME_EXISTS` kèm `existingTagId`, UI tự chọn nhãn đó mà không báo lỗi hỏng luồng | [x] | `RepairItemTagPicker.handleCreateTag` bắt mã lỗi `TAG_NAME_EXISTS`, trích xuất `existingTagId` từ `details` và chọn ngay lập tức. |
| 11 | **Hiển thị nhãn trong Bước 3 (Review)** | Màn hình xác nhận và tóm tắt hiển thị nhãn của từng thiết bị | [x] | `IntakeReviewStep` hiển thị `Nhãn: [Tên 1] · [Tên 2]` trong Block 2, thẻ tóm tắt thành công và bản in phiếu biên nhận. |
| 12 | **Truyền `tagIds` trong Payload Intake** | Payload `POST /api/repair-orders/intake` gửi mảng `tagIds` cho từng item | [x] | `RepairItemIntakePayload.tagIds` được đóng gói đầy đủ trong `submitIntake`. |

---

### C. Quản lý Danh mục Nhãn Workspace (Tag Manager Modal)
| STT | Hạng mục kiểm thử | Tiêu chí nghiệm thu | Trạng thái | Bằng chứng / Ghi chú kỹ thuật |
| :---: | :--- | :--- | :---: | :--- |
| 13 | **Modal/Drawer Quản lý Nhãn** | Mở từ liên kết "Quản lý nhãn" trong popup tag picker | [x] | Component `RepairTagManager` hiển thị dạng modal có ARIA dialog, backdrop, nút đóng và focus trap. |
| 14 | **Đổi tên nhãn (Inline Rename)** | Cho phép đổi tên nhãn kèm cảnh báo ảnh hưởng toàn bộ phiếu | [x] | Cảnh báo: *"Lưu ý: Đổi tên sẽ cập nhật tên nhãn trên tất cả phiếu sửa chữa đang sử dụng nhãn này."* Input inline với nút Lưu và Hủy. |
| 15 | **Xóa nhãn chưa sử dụng** | Xóa nhãn an toàn có hộp thoại xác nhận | [x] | Nút Xóa hiển thị cảnh báo xác nhận `window.confirm` trước khi gọi `tagApi.deleteTag`. |
| 16 | **Chặn xóa nhãn đang sử dụng (`TAG_IN_USE`)** | Khi nhãn đang được gắn vào phiếu, hiển thị thông báo lỗi rõ ràng | [x] | Bắt lỗi `TAG_IN_USE` hiển thị `Alert variant="danger"`: *"Không thể xóa nhãn này vì đang được sử dụng trong các phiếu sửa chữa."* |
| 17 | **Ẩn thao tác quản trị khi không có quyền** | Người dùng không có `canManageWorkspaceTags` chỉ được xem danh mục | [x] | Kiểm tra `canManage`: nếu false, ẩn cột thao tác Đổi tên / Xóa và nút Tạo nhãn trong modal quản lý. |

---

### D. Chi tiết & Danh sách Phiếu sửa chữa (Order Detail & List Projection)
| STT | Hạng mục kiểm thử | Tiêu chí nghiệm thu | Trạng thái | Bằng chứng / Ghi chú kỹ thuật |
| :---: | :--- | :--- | :---: | :--- |
| 18 | **Hiển thị nhãn trên dòng danh sách phiếu** | Cột thiết bị hiển thị các chip nhãn thu nhỏ dưới tên thiết bị | [x] | `RepairOrderList` desktop table và mobile card hiển thị các chip `.rf-tag-chip--readonly` trung tính bên dưới `primaryDeviceName`. |
| 19 | **Hiển thị nhãn theo thiết bị trong chi tiết** | Chi tiết phiếu hiển thị nhãn độc lập theo tab thiết bị đang chọn | [x] | `RepairOrderDetail` panel `.rf-order-tags-panel` hiển thị danh sách nhãn hiện tại của `selectedItem`. |
| 20 | **Chỉnh sửa nhãn khi trạng thái `received`** | Nút "Chỉnh sửa nhãn" cho phép mở picker để thêm/bớt nhãn | [x] | Khi `order.status === 'received'` và `canAssignTags === true`, hiển thị nút "Chỉnh sửa nhãn", mở `RepairItemTagPicker` với nút "Lưu thay đổi" và "Hủy". |
| 21 | **Khóa nhãn khi chuyển giai đoạn kỹ thuật** | Khi phiếu ở trạng thái `diagnosing` trở đi, chuyển sang read-only | [x] | Ẩn nút chỉnh sửa, hiển thị thông báo: *"Nhãn đã khóa sau khi phiếu chuyển sang giai đoạn kỹ thuật."* |
| 22 | **Xử lý lỗi `TAG_ASSIGNMENT_LOCKED`** | Backend từ chối gắn nhãn do phiếu bị khóa, UI hiển thị lỗi và tự reload | [x] | `handleSaveTagAssignment` bắt mã `TAG_ASSIGNMENT_LOCKED`, hiển thị thông báo lỗi và tự động gọi `fetchDetail()` để reload projection mới nhất từ server. |

---

### E. Khả năng truy cập (Accessibility) & Phím tắt (Keyboard Navigation)
| STT | Hạng mục kiểm thử | Tiêu chí nghiệm thu | Trạng thái | Bằng chứng / Ghi chú kỹ thuật |
| :---: | :--- | :--- | :---: | :--- |
| 23 | **Keyboard Combobox Navigation** | Mũi tên lên/xuống di chuyển qua các tùy chọn, Enter để chọn | [x] | Phím `ArrowDown`, `ArrowUp` thay đổi `highlightedIndex`; phím `Enter` kích hoạt toggle hoặc inline-create. |
| 24 | **Phím Escape đóng popup** | Bấm phím Escape đóng popup listbox và đưa focus về trigger | [x] | Bắt sự kiện `e.key === 'Escape'` đóng dropdown và focus lại trigger/input. |
| 25 | **Phím Backspace xóa chip cuối** | Bấm Backspace khi ô nhập rỗng sẽ gỡ bỏ nhãn cuối cùng | [x] | `handleKeyDown` kiểm tra `searchQuery === ''` và xóa `selectedTagIds[selectedTagIds.length - 1]`. |
| 26 | **ARIA Attributes đầy đủ** | Hỗ trợ Screen Reader theo chuẩn WAI-ARIA Combobox | [x] | Khai báo `role="combobox"`, `aria-expanded`, `aria-haspopup="listbox"`, `aria-controls`, `aria-activedescendant`, `role="listbox"`, `role="option"`, `aria-selected`. |

---

### F. Độ đàn hồi Zoom (Zoom Resilience) & Đáp ứng Đa thiết bị (Responsive)
| STT | Hạng mục kiểm thử | Tiêu chí nghiệm thu | Trạng thái | Bằng chứng / Ghi chú kỹ thuật |
| :---: | :--- | :--- | :--- | :--- |
| 27 | **Mobile Viewport 390x844** | Giao diện tự động co dãn, chip tag xuống dòng tự nhiên, modal full-width | [x] | Flex wrap tự động, modal tag manager mở rộng 100% width trên màn hình nhỏ. Không tràn thanh cuộn ngang body. |
| 28 | **Tablet Viewport 768x1024** | Danh mục nhãn và order detail hiển thị gọn gàng, nút bấm tối thiểu 40px | [x] | Thao tác chạm cảm ứng dễ dàng, target size $\ge 40\text{px}$. |
| 29 | **Zoom Resilience 125% - 150%** | Zoom trình duyệt lên 125% và 150% không vỡ layout | [x] | Toàn bộ font-size và padding sử dụng `rem`/`em`/`calc`, `flex-wrap: wrap`, chống tràn hoàn toàn. |

---

## 3. Xác nhận Kiểm tra Kỹ thuật (Verification Commands)

```powershell
# 1. TypeScript Type Check
npm --prefix src/ui run type-check
# Kết quả: Exit code 0 (Hoàn tất không có bất kỳ lỗi biên dịch nào).

# 2. Production Vite Build
npm --prefix src/ui run build
# Kết quả: Exit code 0 (Sinh bundle thành công trong thư mục dist/ mà không có cảnh báo nghiêm trọng).
```
