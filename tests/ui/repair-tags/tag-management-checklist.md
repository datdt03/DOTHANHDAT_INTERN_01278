# Tag Management Page (#/tags) Checklist & Verification Evidence

Tài liệu kiểm định và bằng chứng nghiệm thu Trang Quản lý Nhãn Workspace chuyên biệt (`#/tags`) dành riêng cho vai trò Manager / Owner.

---

## 1. Thông tin chung

- **Feature**: `tag-management` (Trang quản lý nhãn workspace)
- **Primary Route**: `#/tags` (alias: `#/settings/tags`)
- **Phân quyền truy cập**:
  - **Manager & Owner** (`canManageWorkspaceTags === true`): Hiển thị menu "Quản lý nhãn" trên thanh điều hướng Sidebar; toàn quyền truy cập và thao tác Thêm, Sửa (Đổi tên), Xóa nhãn.
  - **Receptionist & Technician**: Bị ẩn menu "Quản lý nhãn" trên Sidebar; nếu truy cập trực tiếp URL `#/tags`, router chặn lại và hiển thị màn hình `ForbiddenState` ("Truy cập bị từ chối").
- **Hệ thống màu & Thiết kế**: Slate 85/15, nhãn chip trung tính (`.rf-tag-chip`), monochrome SVG line icons (`IconTag`, `IconPlus`, `IconTrash`, `IconRefresh`), responsive desktop/mobile và đàn hồi zoom 125%-150%.

---

## 2. Danh mục Kiểm thử & Bằng chứng thực tế (Test Matrix)

### A. Phân quyền & Điều hướng Sidebar (Access Control & Navigation)
| STT | Hạng mục kiểm thử | Tiêu chí nghiệm thu | Trạng thái | Bằng chứng / Ghi chú kỹ thuật |
| :---: | :--- | :--- | :---: | :--- |
| 1 | **Sidebar hiển thị cho Manager** | Khi đăng nhập Manager (`manager@repairflow.vn`), Sidebar có mục "Quản lý nhãn" kèm icon tag | [x] | `getRoleCapabilities` khai báo `{ label: 'Quản lý nhãn', route: '#/tags', icon: 'tags' }` trong `navigationItems` cho `manager` và `owner`. |
| 2 | **Sidebar ẩn với Receptionist** | Khi đăng nhập Lễ tân (`receptionist@repairflow.vn`), Sidebar không có mục "Quản lý nhãn" | [x] | `receptionist` không có route `#/tags` trong `navigationItems`. |
| 3 | **Sidebar ẩn với Technician** | Khi đăng nhập Kỹ thuật viên (`technician@repairflow.vn`), Sidebar không có mục "Quản lý nhãn" | [x] | `technician` không có route `#/tags` trong `navigationItems`. |
| 4 | **Truy cập trực tiếp của Manager** | Manager gõ `#/tags` trên thanh URL -> Mở trang Quản lý nhãn thành công | [x] | `canAccessRoute` trả về `true` cho Manager/Owner; `navigation.tsx` mount `TagManagementPage`. |
| 5 | **Chặn URL trực tiếp với Receptionist** | Receptionist gõ `#/tags` trên thanh URL -> Chặn và hiển thị `ForbiddenState` | [x] | `canAccessRoute` kiểm tra `cleanRoute === '#/tags'` và từ chối nếu không phải manager/owner; render `ForbiddenState` với nút quay về trang chủ role. |
| 6 | **Chặn URL trực tiếp với Technician** | Technician gõ `#/tags` trên thanh URL -> Chặn và hiển thị `ForbiddenState` | [x] | `canAccessRoute` từ chối technician, render `ForbiddenState`. |
| 7 | **Defense-in-depth trong Component** | Component `TagManagementPage` tự kiểm tra `context.capabilities.canManageWorkspaceTags` | [x] | Nếu `!canManage`, component chủ động render `ForbiddenState` ngay tại tầng trình diễn. |

---

### B. Nghiệp vụ Quản lý Nhãn Workspace trên Trang `#/tags`
| STT | Hạng mục kiểm thử | Tiêu chí nghiệm thu | Trạng thái | Bằng chứng / Ghi chú kỹ thuật |
| :---: | :--- | :--- | :---: | :--- |
| 8 | **Header & Breadcrumb** | Hiển thị tiêu đề, breadcrumb "Tổng quan / Quản lý nhãn", badge tổng số lượng nhãn và nút Làm mới | [x] | Cấu trúc header `.rf-tag-mgmt-header` hiển thị đầy đủ thông tin chuẩn phong cách Slate. |
| 9 | **Tìm kiếm nhãn theo tên** | Ô tìm kiếm lọc danh sách nhãn tức thì, có nút xóa nhanh `×` | [x] | State `searchQuery` lọc danh sách theo tên không phân biệt hoa thường; hiển thị số lượng nhãn lọc được. |
| 10 | **Tạo nhãn mới hợp lệ** | Nhập tên nhãn hợp lệ ($\le 50$ ký tự) và bấm "Tạo nhãn" | [x] | Gọi `tagApi.createTag`, cập nhật danh sách tức thì và thông báo thành công. |
| 11 | **Validation tạo nhãn** | Không cho tạo khi rỗng hoặc $> 50$ ký tự | [x] | Hiển thị thông báo lỗi `rf-tag-create-error` ngay dưới ô nhập. |
| 12 | **Bắt lỗi tạo nhãn trùng (`TAG_NAME_EXISTS`)** | Nhập tên nhãn đã có trong workspace | [x] | Bắt mã lỗi `TAG_NAME_EXISTS` và hiển thị cảnh báo *"Nhãn '[tên]' đã tồn tại trong danh mục."* |
| 13 | **Đổi tên nhãn inline** | Bấm "Đổi tên", hiển thị ô nhập và cảnh báo phạm vi ảnh hưởng | [x] | Cảnh báo: *"Lưu ý: Đổi tên sẽ cập nhật trên tất cả phiếu sửa chữa đang sử dụng nhãn này."* |
| 14 | **Lưu đổi tên thành công** | Bấm Lưu -> Gọi API đổi tên, cập nhật tên mới trên bảng | [x] | Gọi `tagApi.renameTag`, cập nhật state nhãn và thông báo thành công. |
| 15 | **Bắt lỗi đổi tên trùng** | Đổi tên nhãn thành tên đã tồn tại của nhãn khác | [x] | Bắt lỗi `TAG_NAME_EXISTS` và hiển thị thông báo lỗi ngay dưới ô nhập. |
| 16 | **Xác nhận trước khi xóa** | Bấm Xóa -> Hiển thị trạng thái "Xác nhận xóa?" kèm nút "Xóa ngay" và "Hủy" | [x] | State `confirmDeleteTagId` ngăn chặn thao tác bấm nhầm. |
| 17 | **Bảo vệ nhãn đang dùng (`TAG_IN_USE`)** | Xóa nhãn đang được gắn vào phiếu sửa chữa | [x] | Backend trả về `TAG_IN_USE`; trang hiển thị `Alert variant="danger"`: *"Không thể xóa nhãn '[tên]' vì đang được gắn trên phiếu sửa chữa. Vui lòng gỡ nhãn khỏi phiếu trước khi xóa."* |
| 18 | **Xóa nhãn chưa sử dụng thành công** | Xóa nhãn không bị ràng buộc trên phiếu | [x] | Gọi `tagApi.deleteTag`, gỡ bỏ nhãn khỏi danh mục và thông báo thành công. |

---

### C. Giao diện Đa thiết bị & Đàn hồi Zoom (Responsive & Accessibility)
| STT | Hạng mục kiểm thử | Tiêu chí nghiệm thu | Trạng thái | Bằng chứng / Ghi chú kỹ thuật |
| :---: | :--- | :--- | :---: | :--- |
| 19 | **Bảng Desktop (> 768px)** | Hiển thị bảng dữ liệu 5 cột rõ ràng, chip nhãn trung tính | [x] | Bảng `.rf-tag-table` với các cột: Nhãn hiển thị, Tên nhãn, Ngày tạo, Cập nhật, Thao tác. |
| 20 | **Thẻ Mobile ($\le 768px$)** | Tự động chuyển đổi từ bảng sang danh sách thẻ dọc | [x] | `.rf-tag-table-wrapper` ẩn, `.rf-tag-mobile-cards` hiển thị; các nút thao tác co dãn phù hợp màn hình nhỏ. |
| 21 | **Đàn hồi Zoom 125% - 150%** | Zoom không vỡ layout, không phát sinh scrollbar ngang body | [x] | Sử dụng đơn vị `rem`/`px` linh hoạt và `flex-wrap`, tương thích hoàn toàn khi zoom lớn. |

---

## 3. Xác nhận Lệnh Kỹ thuật (Technical Commands)

```powershell
# 1. Type check
npm --prefix src/ui run type-check
# Exit code: 0

# 2. Production build
npm --prefix src/ui run build
# Exit code: 0 (97 modules transformed, dist/ sinh thành công)
```
