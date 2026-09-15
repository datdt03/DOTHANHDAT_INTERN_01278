# RepairFlow v0 — Tiêu Chuẩn Giao Diện & Design System (UI Standards)

> Trạng thái: `DECIDED — UI standards và design system baseline`
>
> Ngày chốt: 2026-09-16
>
> Nguồn tham chiếu: [`06-ui-requirements.md`](./06-ui-requirements.md), [`08-ui-design-blueprint-and-stitch-handoff.md`](./08-ui-design-blueprint-and-stitch-handoff.md), `tmp/stitch_repairflow_v0/`

---

## 1. Mục Đích & Phạm Vi

Tài liệu này xác lập bộ tiêu chuẩn thống nhất về thiết kế giao diện (Design System), bảng màu, quy trình trải nghiệm người dùng (UX flows) và các quy tắc kỹ thuật (frontend rules) dành cho đội ngũ phát triển và AI Dev (Antigravity) khi xây dựng ứng dụng RepairFlow v0.

Mọi màn hình được triển khai phải tuân thủ nghiêm ngặt các quy chuẩn này nhằm đảm bảo tính nhất quán, chuyên nghiệp, dễ sử dụng cho các nhân sự cửa hàng và khách hàng.

---

## 2. Nền Tảng Thiết Kế (Visual Foundation)

### 2.1. Bảng Màu Chuẩn (Color Palette) & Quy Tắc 85/15

Hệ màu của RepairFlow tuân theo quy tắc nghiêm ngặt về tỷ lệ diện tích và độ tương quan để đảm bảo không bị rối mắt:

- **Màu trung tính chiếm 85% diện tích (Slate Palette)**: `--rf-bg-app: #f8fafc` (nền trang), `--rf-surface: #ffffff` (thẻ, bảng), `--rf-text-main: #0f172a` (chữ chính), `--rf-border: #e2e8f0` (đường viền).
- **Màu chủ đạo chiếm 10 - 15% diện tích**: **Sky / Tech Blue (`--rf-primary: #0284c7`)** dùng làm điểm nhấn duy nhất cho Primary CTA, tab đang chọn, hoặc icon tiêu điểm.
- **Quy tắc chống rối màu (No Color Clutter)**:
  - **Tuyệt đối không nhồi nhét quá nhiều màu hoặc tạo nhiều điểm nhấn màu vào chung một khung hình/thẻ card**. Mỗi thẻ chỉ có tối đa 1 điểm nhấn màu duy nhất.
  - Các màu bổ trợ (xanh lá, vàng cam, đỏ, tím) phải tương quan hài hòa, sử dụng tone pastel dịu nhẹ, **tuyệt đối không dùng màu neon quá gắt**.

#### A. Màu Thương Hiệu & Nền (Brand & Surfaces)
- **Primary Brand**: `--rf-primary: #0284c7` (Sky 600) — Nút hành động chính (CTA), trạng thái kích hoạt, thương hiệu.
- **Primary Hover**: `--rf-primary-hover: #0369a1` (Sky 700).
- **Primary Active**: `--rf-primary-active: #075985` (Sky 800).
- **Primary Subtle/Container**: `--rf-primary-subtle: #f0f9ff` (Sky 50), `--rf-primary-container: #e0f2fe` (Sky 100).
- **App Background**: `--rf-bg-app: #f8fafc` (Slate 50) — Nền tổng thể ứng dụng.
- **Card / Surface**: `--rf-surface: #ffffff` — Nền bảng, panel, thẻ nổi, dialog.
- **Subtle Surface**: `--rf-surface-subtle: #f1f5f9` (Slate 100) — Nền header bảng, hover menu.

#### B. Màu Văn Bản & Đường Viền (Typography & Borders)
- **Text Main**: `--rf-text-main: #0f172a` (Slate 900) — Tiêu đề, số liệu chính, text quan trọng.
- **Text Body**: `--rf-text-body: #334155` (Slate 700) — Nội dung thông thường.
- **Text Muted**: `--rf-text-muted: #64748b` (Slate 500) — Chú thích, nhãn phụ, ngày giờ.
- **Text Disabled**: `--rf-text-disabled: #cbd5e1` (Slate 300).
- **Border**: `--rf-border: #e2e8f0` (Slate 200).
- **Border Light**: `--rf-border-light: #f1f5f9` (Slate 100).

#### C. Bảng Màu Trạng Thái Nghiệp Vụ Sửa Chữa (10 Semantic Workflow Statuses)

Mỗi giai đoạn trong luồng sửa chữa có một nhận diện màu sắc duy nhất, trực quan:

| Trạng thái nghiệp vụ | Badge Class | Text Color | Background | Border | Ý nghĩa UX |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Tiếp nhận / Bản nháp** | `.rf-badge--draft` | `#475569` | `#f1f5f9` | `#cbd5e1` | Phiếu mới tạo, lưu nháp, chưa intake xong |
| **Đang chẩn đoán** | `.rf-badge--diagnosing` | `#0369a1` | `#f0f9ff` | `#bae6fd` | KTV đang kiểm tra lỗi thiết bị |
| **Chờ khách duyệt** | `.rf-badge--waiting` | `#b45309` | `#fffbeb` | `#fde68a` | Đã gửi báo giá, đang chờ khách duyệt/phản hồi |
| **Đang sửa chữa** | `.rf-badge--repairing` | `#1d4ed8` | `#eff6ff` | `#bfdbfe` | Khách đã duyệt, KTV đang thực hiện sửa |
| **Kiểm tra chất lượng (QC)** | `.rf-badge--qc` | `#6d28d9` | `#faf5ff` | `#e9d5ff` | Đã sửa xong, đang chạy checklist nghiệm thu |
| **Sẵn sàng bàn giao** | `.rf-badge--ready` | `#047857` | `#ecfdf5` | `#a7f3d0` | QC Đạt, sẵn sàng hẹn khách lấy máy |
| **Đã hoàn tất** | `.rf-badge--completed` | `#0f766e` | `#f0fdfa` | `#99f6e4` | Đã bàn giao và lưu trữ hồ sơ |
| **QC Không đạt (Rework)** | `.rf-badge--rework` | `#b91c1c` | `#fef2f2` | `#fecaca` | QC Fail, quay lại hàng chờ sửa của KTV |
| **Khách từ chối / Hủy** | `.rf-badge--cancelled` | `#64748b` | `#f8fafc` | `#e2e8f0` | Khách không sửa hoặc hủy trước sửa |
| **Cảnh báo trễ hạn SLA** | `.rf-badge--overdue` | `#b91c1c` | `#fff1f2` | `#fecdd3` | Có hiệu ứng nhấp nháy `rfSlaPulse` |

---

### 2.2. Quy Chuẩn Typography

1. **Font giao diện chính**: `'Montserrat', sans-serif`
   - Sử dụng cho toàn bộ văn bản giao diện, nút bấm, nhãn, bảng điều hướng.
   - Nhập khẩu từ Google Fonts với các độ đậm: `400` (Regular), `500` (Medium), `600` (SemiBold), `700` (Bold), `800` (ExtraBold).
2. **Font dữ liệu kỹ thuật / mã / tiền tệ**: `'JetBrains Mono', monospace`
   - Áp dụng class `.rf-font-mono` hoặc `.order-id`.
   - Bắt buộc dùng cho:
     - Mã phiếu sửa chữa (ví dụ: `RF-2026-0891` hoặc `RF-20260911-001`).
     - Số Serial/IMEI thiết bị.
     - Số tiền báo giá (ví dụ: `1.250.000 đ`).
     - Thời gian SLA hoặc mốc timestamp chi tiết.

### 2.3. Spacing, Bo Góc & Đổ Bóng (Radii & Elevation)

- **Hệ số Spacing**: Lưới 4px (`4px`, `8px`, `12px`, `16px`, `20px`, `24px`, `32px`).
- **Bo góc (Border Radius)**:
  - `sm: 4px` (tag con, input phụ).
  - `md: 8px` (nút bấm, ô input, dropdown select).
  - `lg: 12px` (thẻ card, panel, modal popup).
  - `pill: 9999px` (status badge, chip, avatar).
- **Đổ bóng (Shadows)**:
  - `var(--rf-shadow-xs)`: Thẻ thông tin tĩnh nhẹ.
  - `var(--rf-shadow-sm)`: Thẻ card thông thường, hover state.
  - `var(--rf-shadow-md)`: Modal dialog, dropdown menu, popover.

### 2.4. Viewport Chuẩn & Quy Tắc Responsive

- **Internal Desktop Target**: `1440 × 1024 px` (môi trường chính của Manager và Technician).
- **Customer Mobile Target**: `390 × 844 px` (môi trường chính của Customer public page).
- **Receptionist High-Frequency Mobile**: `390 × 844 px` (màn tiếp nhận nhanh và tra cứu cơ động).
- **Mức kiểm tra responsive trung gian**: `1280 × 800 px` và `768 × 1024 px` (sidebar tự động thu gọn thành backdrop menu trượt).

### 2.5. Quy Chuẩn Icon & Chống Lạm Dụng Icon (Icon Standards & Anti-Spam)

1. **Tuyệt đối không dùng Emoji và Icon sặc sỡ**:
   - Nghiêm cấm hoàn toàn việc sử dụng emoji hệ thống (như 📊, 📋, ⏳, 👥, 📱, ⚙, 🏢, ⚠️, 📭, 🎨...) hay icon 3D nhiều màu trên toàn bộ giao diện.
   - Các icon nhiều màu phá vỡ tỷ lệ 85/15, tạo cảm giác "AI làm vội / đồ thị đồ chơi" và gây phân tán thị giác nghiêm trọng trong vận hành xưởng.
2. **Quy chuẩn 100% Monochrome Line SVG (Nét mảnh đơn sắc)**:
   - Toàn bộ icon trong hệ thống phải là SVG vector nét mảnh (`stroke-width: 1.75px`, kích thước chuẩn 14×14px đến 18×18px).
   - Icon bắt buộc sử dụng `stroke="currentColor"`. Màu icon luôn đồng bộ 100% với màu chữ:
     - Bình thường: Màu xám Slate (`--rf-text-muted: #64748b`).
     - Khi hover hoặc active: Màu xanh thương hiệu (`--rf-primary: #0284c7`).
   - Mọi icon dùng chung phải được quản lý tập trung trong `src/ui/shared/components/icons.tsx`.
3. **Chống lạm dụng icon (No Icon Spamming)**:
   - Ưu tiên Typography-first: Nhãn chữ rõ ràng, độ đậm chuẩn, khoảng cách thoáng đãng.
   - Không gắn icon trang trí bừa bãi vào tiêu đề trang, nhãn trường nhập liệu, status badge hay nút bấm phụ.
   - Icon chỉ được dùng ở các vị trí thực sự có giá trị chức năng/định vị:
     - Thanh điều hướng chính (Sidebar navigation) để định vị nhanh mục làm việc.
     - Ô tìm kiếm toàn cục (Kính lúp).
     - Điều hướng và điều khiển (Mũi tên chevron, nút đóng modal X, nút đăng xuất).
     - Trạng thái trống (Empty state) với hình minh họa nét mảnh tối giản.

---

## 3. Quy Trình & Luồng Giao Diện (UX & Workflow Architecture)

### 3.1. Phân Định 4 Persona & Điểm Vào Mặc Định

| Persona | Điểm vào mặc định | Chức năng trọng tâm | Giới hạn bắt buộc |
| :--- | :--- | :--- | :--- |
| **Manager / Owner** | **Tổng quan vận hành** (`UI-A06`) | Nắm bắt điểm nghẽn, phiếu quá hạn SLA, việc chờ duyệt, phân công kỹ thuật, tải xưởng. | Quản trị toàn diện, xem audit log đầy đủ. |
| **Receptionist** | **Tổng quan hôm nay** (`UI-A07`) | Tiếp nhận khách, wizard tạo phiếu, tra cứu tiến độ khi khách gọi điện, bàn giao trả máy. | **Màn hình tra cứu (`UI-B02`) là READ-ONLY tuyệt đối**: không có nút sửa lỗi, đổi giá, gán thợ. |
| **Technician** | **Hàng chờ công việc** (`UI-A08`) | Xem việc được giao theo thứ tự ưu tiên SLA, mở phiếu để chẩn đoán, ghi nhận sửa chữa, kích hoạt QC. | Dùng layout **danh sách theo mức ưu tiên**; không dùng Kanban kéo-thả làm luồng chính. |
| **Customer** | **Trang tiến độ qua Token Link** (`UI-C05/C06`) | Xem tiến độ, chi tiết lỗi, bảng báo giá, thực hiện Approve / Reject, ký nhận khi bàn giao. | **Giao diện mobile-first, xác thực OTP**. Tuyệt đối không dùng sidebar nội bộ. |

---

### 3.2. Năm Trạng Thái Bắt Buộc cho Mọi Màn Hình Mạng (5 Mandatory States)

Mọi màn hình có dữ liệu mạng phải thiết kế và xử lý đủ 5 trạng thái:
1. **Loading State**: Sử dụng hiệu ứng Skeleton Shimmer (`.rf-skeleton`) với kích thước tương ứng các thành phần dữ liệu thực tế; không dùng spinner đơn điệu quay toàn màn hình.
2. **Empty State**: Icon minh họa tinh gọn, dòng thông báo tiếng Việt lịch sự, dễ hiểu ("Không có phiếu sửa chữa nào cần xử lý") kèm nút hành động gợi ý tiếp theo.
3. **Error State**: Trình bày lỗi bằng ngôn ngữ người dùng (không để lộ raw backend stack trace hoặc mã lỗi 500 thô), có nút "Thử lại" (`onRetry`).
4. **Unavailable State**: Trạng thái mất kết nối API, có thông báo rõ ràng kèm tùy chọn chuyển sang chế độ Preview dữ liệu mẫu.
5. **Success / Ready State**: Hiển thị dữ liệu chính xác, bảng biểu rõ nét, status badge có màu chuẩn.

---

### 3.3. Luồng Wizard Tạo Phiếu 4 Bước (Intake Wizard)

1. **Bước 1 — Khách hàng**: Tra cứu nhanh qua Số điện thoại (tự động gợi ý hồ sơ cũ nếu đã từng sửa để tránh tạo trùng lặp) hoặc nhập mới.
2. **Bước 2 — Thiết bị**: Chọn/nhập loại máy, hãng, model, serial/IMEI và mô tả lỗi khách phản ánh ban đầu.
3. **Bước 3 — Hiện trạng & Bằng chứng ảnh**:
   - Checklist ngoại quan (màn hình, vỏ, nút bấm, cổng sạc, camera, mic).
   - Tối thiểu 1 ảnh hiện trạng bắt buộc; không giới hạn số lượng ảnh chụp thêm.
4. **Bước 4 — Xem lại & Lưu**:
   - Tóm tắt toàn bộ thông tin.
   - Luôn hỗ trợ hai lựa chọn: **Lưu nháp (Save draft)** để tiếp tục sau hoặc **Hoàn tất tiếp nhận (Complete Intake)** để chuyển sang chẩn đoán.

---

## 4. Bộ Quy Tắc Phát Triển Cho Kỹ Sư & Agent (Engineering Rules)

### 4.1. Quy Tắc React & TypeScript
- **Cấu trúc Feature-First**: Tổ chức code theo tính năng tại `src/ui/features/<feature-name>/`.
- **Thành phần Khung dùng chung (Unified Shared Layout Components)**:
  - Mọi màn hình nội bộ **BẮT BUỘC** dùng chung bộ khung từ `src/ui/shared/components`:
    - `<AppHeader />`: Headerbar đồng bộ (Breadcrumb, Search, Store Status, Notification, Avatar).
    - `<AppSidebar />`: Sidebar điều hướng chuẩn (Role-aware tabs, Workspace switcher, Workshop capacity).
    - `<AppFooter />`: Chân trang hệ thống thống nhất.
  - Mọi màn hình khách hàng dùng chung `<CustomerHeader />` và `<CustomerFooter />`.
- **Tách biệt Shell**:
  - `app/internal-shell.tsx`: Dành cho nhân viên cửa hàng có phiên đăng nhập hợp lệ.
  - `app/customer-link-shell.tsx`: Dành cho khách hàng truy cập public link qua OTP.
- **Không gọi `fetch` trực tiếp trong Component**: Toàn bộ thao tác API phải đi qua tầng adapter `src/ui/shared/api/`.
- **Thành phần dùng chung**: Các component nguyên tử (`ui-primitives.tsx`) đặt tại `src/ui/shared/components/`. Chỉ đưa một component vào `shared` khi đã có từ 2 nơi tiêu thụ thực tế trở lên.

### 4.2. Quy Tắc CSS & Đặt Tên
- Sử dụng Design Tokens đã định nghĩa trong `src/ui/shared/styles/tokens.css`.
- Đặt tên class theo ngữ nghĩa nghiệp vụ: `.rf-badge--diagnosing`, `.rf-btn-primary`, `.rf-card`.
- Không sử dụng `!important` trừ các trường hợp font ép buộc đặc biệt.
- Không lồng selector CSS sâu quá 3 cấp.

### 4.3. Quy Tắc Trải Nghiệm & Ngôn Ngữ
- **Ngôn ngữ hiển thị**: 100% tiếng Việt cho giao diện người dùng.
- **Không hiển thị mã trạng thái nội bộ**: Luôn dùng nhãn thân thiện (ví dụ: "Chờ khách duyệt" thay vì `waiting_for_approval`).
- **Phân biệt rõ ràng Read-only và Editable**:
  - Khi người dùng không có quyền ghi (ví dụ Lễ tân xem màn tra cứu, hoặc KTV xem báo giá đã gửi), tuyệt đối không render form inputs hoặc nút submit để tránh nhầm lẫn.

### 4.4. Thư Viện Thành Phần Dùng Chung Chuẩn SB Admin 2 & Tính Đàn Hồi Zoom (Zoom Resilience)

Nhằm đảm bảo giao diện thống nhất, không phải sửa đi sửa lại và đáp ứng độ co giãn trên nhiều tỷ lệ hiển thị, RepairFlow xây dựng bộ thành phần dùng chung lấy cảm hứng từ cấu trúc vững chãi, phẳng và trực quan của **SB Admin 2**:

1. **Bộ Thành phần cốt lõi (Shared Component Suite - `src/ui/shared/components/`)**:
   - `<StatCard />`: Thẻ chỉ số đường viền nhấn trái (`rf-stat-card--primary`, `--success`, `--warning`, `--danger`), hiển thị số liệu lớn, nhãn phụ và icon.
   - `<CardPanel />`: Khung panel chuẩn mực gồm `<CardPanelHeader />`, `<CardPanelBody />` (hỗ trợ `flush`), và `<CardPanelFooter />`.
   - `<PageHeader />`: Header đầu trang chuẩn hóa gồm tiêu đề lớn, nhãn phân loại (eyebrow), phụ đề giải thích và vùng chứa nút bấm hành động (`actions`).
   - `<DataTable />`: Bảng hiển thị dữ liệu responsive tự động bọc trong lớp trượt `.rf-table-responsive`, hỗ trợ định dạng cột, phân canh lề và trạng thái rỗng `emptyMessage`.
   - `<FormGroup />`, `<FormInput />`, `<FormSelect />`: Bộ điều khiển biểu mẫu chuẩn, tích hợp nhãn, icon tích hợp bên trong ô nhập, gợi ý (`hint`) và thông báo lỗi (`error`).
   - `<Alert />`: Băng thông báo 4 cấp độ (Info, Success, Warning, Danger) kèm nút đóng tắt `dismissible`.
   - `<Modal />`: Hộp thoại xác nhận thao tác trọng yếu, khóa nền mờ và bắt sự kiện phím Esc.
   - `<ProgressStepper />`: Thanh tiến trình 6 bước sửa chữa trực quan.
   - `<EmptyState />`: Thành phần chuẩn khi danh sách hoặc kết quả tìm kiếm không có dữ liệu.

2. **Tiêu chuẩn Hiển Thị Độ Đàn Hồi Zoom (Zoom Resilience Standard)**:
   - **Mức nhìn chuẩn**: Mặc định lấy giao diện web ở **tỷ lệ 110% làm tiêu chuẩn nhìn**.
   - **Thích ứng khi phóng to 125% và 150%**:
     - Toàn bộ nội dung phía trong **tự động co lại theo `body`** mà không làm xuất hiện thanh cuộn ngang tổng thể.
     - Sử dụng CSS Grid tự động thích ứng: `grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr))` để các thẻ StatCard tự động xuống dòng từ 4 cột sang 3 cột hoặc 2 cột một cách tự nhiên.
     - Bảng dữ liệu dài luôn được cô lập cuộn ngang bên trong container `.rf-table-responsive`.
     - Kích cỡ tiêu đề và chữ số lớn sử dụng hàm `clamp(min, preferred, max)` và đơn vị `rem` để không bị vỡ bố cục khi zoom to.

3. **Vị Trí Xem & Trải Nghiệm Thư Viện Giao Diện (UI Showcase)**:
   - **Đường dẫn trực tiếp**: Truy cập hash `#/showcase` (ví dụ: `http://localhost:5173/#/showcase`).
   - **Thao tác từ thanh điều hướng**: Tại Sidebar nội bộ, click vào mục **"Hệ thống" → "Thư viện UI (Showcase)"** (biểu tượng 🎨).
   - **Từ trang đăng nhập**: Có sẵn liên kết trực tiếp ở chân trang đăng nhập.

---

## 5. Danh Mục Kiểm Tra Nghiệm Thu Giao Diện (UI Acceptance Checklist)

Trước khi bàn giao bất kỳ màn hình hoặc tính năng giao diện nào, lập trình viên/Agent phải tự kiểm tra:

- [ ] Đúng persona và viewport mục tiêu (`1440×1024` desktop hoặc `390×844` mobile).
- [ ] Tuân thủ tỷ lệ màu 85% Slate / 15% Sky, không nhồi nhét nhiều điểm nhấn màu vào cùng một card.
- [ ] Không lạm dụng bo tròn góc hoặc lồng card trong card (box-in-box).
- [ ] Đạt chuẩn Zoom Resilience: Đẹp mắt ở 110%, tự co giãn và rớt dòng mượt mà khi zoom 125% và 150%.
- [ ] Font chữ hiển thị chuẩn: `Montserrat` cho text và `JetBrains Mono` cho mã phiếu, số tiền, serial.
- [ ] Sử dụng đúng màu sắc và badge semantic trong bảng 10 trạng thái sửa chữa.
- [ ] Xử lý đầy đủ 5 trạng thái (Loading skeleton, Empty, Error, Unavailable, Success).
- [ ] Không có nút chỉnh sửa trên các giao diện Read-only (đặc biệt là Tra cứu của Lễ tân).
- [ ] Giao diện khách hàng có bước OTP bảo mật và nút hành động to bản, thân thiện di động.
- [ ] Lệnh kiểm tra chạy thành công không có cảnh báo hay lỗi:
  - `npm --prefix src/ui run type-check`
  - `npm --prefix src/ui run build`
