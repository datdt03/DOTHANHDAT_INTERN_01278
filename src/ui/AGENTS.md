# UI Rules — React, TypeScript, and CSS

## 1. Target structure

```text
src/ui/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── app/
│   ├── main.tsx              # React bootstrap and bootstrap states
│   ├── app-shell.tsx         # Stable facade for shell exports
│   ├── internal-shell.tsx    # Internal desktop/responsive shell
│   ├── customer-link-shell.tsx # Customer mobile-first shell
│   ├── status-screens.tsx    # Boot and API-unavailable states
│   └── routes.tsx            # Lightweight route boundary
├── config/                   # runtime and environment-sensitive config
├── features/                 # one directory per business screen/flow
├── shared/
│   ├── api/                 # typed API adapter boundary
│   ├── components/          # reusable UI primitives after real reuse exists
│   ├── styles/              # target.css and legacy reference styles
│   └── utils/               # shared pure utilities
└── mocks/                    # local preview data only
```

The vanilla files and `app.bundle.js` remain as a legacy functional/visual
reference until the migration acceptance is complete. Do not delete or edit the
generated bundle manually.

## 2. Product and technical boundaries

- UI display language is 100% Vietnamese for the MVP. Never expose raw status codes to users (e.g. use "Chờ khách duyệt" instead of `waiting_for_approval`).
- React renders presentation and manages local presentation state only.
- API calls go through `shared/api/`; components must not call `fetch` directly.
- API URL, timeout, feature flags, and environment values belong in `config/`.
- Permission enforcement, workflow transitions, diagnosis, price calculation,
  and database access belong to the ASP.NET Core API, not the browser.
- Keep internal shell and customer-link shell as separate route boundaries.
- C1 keeps the shared internal shell as a compatibility boundary. Starting with
  C2, each business area owns its mount boundary, local shell, route and state;
  C2 areas may compose shared primitives but must not import
  `RoleAwareNavigationShell` or depend on another business area's state.
- A network-driven screen MUST represent 5 mandatory states: loading (Skeleton),
  empty (icon + Vietnamese copy + CTA), error (user-friendly + retry), unavailable (preview fallback),
  and ready/success.

## 3. UI Design System & Color Standards (BẮT BUỘC TUÂN THỦ)

- **Tỷ lệ phối màu 85/15 (Color Distribution)**:
  - **85% diện tích**: Gam màu trung tính Slate (`--rf-bg-app: #f8fafc`, `--rf-surface: #ffffff`, `--rf-text-main: #0f172a`, `--rf-text-muted: #64748b`, `--rf-border: #e2e8f0`).
  - **10 - 15% diện tích**: Màu thương hiệu chủ đạo **Sky / Tech Blue** (`--rf-primary: #0284c7`, hover `#0369a1`) dùng cho Primary CTA, active tab, key badge.
- **Quy tắc chống rối màu (No Color Clutter)**:
  - **TUYỆT ĐỐI KHÔNG** nhồi nhét quá nhiều màu sắc hoặc tạo nhiều điểm nhấn màu vào cùng một khung giao diện.
  - Mỗi thẻ (card) hoặc khung nhìn chỉ có tối đa 1 điểm nhấn màu duy nhất (Primary focal point).
  - Màu bổ trợ (Semantic Status) phải dùng tone pastel dịu nhẹ (`--rf-status-*-bg`), không được dùng màu neon gắt, chói mắt.
- **Quy chuẩn Icon & Chống Lạm Dụng Icon (BẮT BUỘC - No Emoji / Monochrome Line SVG Only)**:
  - **TUYỆT ĐỐI KHÔNG DÙNG EMOJI HOẶC ICON NHIỀU MÀU SẶC SỠ**: Cấm hoàn toàn việc sử dụng emoji hệ thống (📊, 📋, ⏳, 👥, 📱, ⚙, 🏢, ⚠️, 📭, 🎨...) hay icon 3D nhiều màu trên toàn bộ màn hình. Chúng phá vỡ hệ màu 85/15, tạo cảm giác "AI làm vội / đồ họa đồ chơi" thiếu nghiêm túc.
  - **100% Monochrome Line SVG**: Toàn bộ icon bắt buộc là vector SVG nét mảnh (`stroke-width: 1.75px`, kích thước chuẩn 14 - 18px), sử dụng `stroke="currentColor"`. Màu icon luôn đồng bộ với chữ: bình thường là xám Slate (`#64748b`), khi active hoặc hover tự động chuyển sang màu xanh Sky Blue (`#0284c7`). Mọi icon dùng chung phải lấy từ `src/ui/shared/components/icons.tsx`.
  - **Chống lạm dụng icon (No Icon Spamming)**: Không gắn icon trang trí bừa bãi vào tiêu đề trang, nhãn input, chip hay nút bấm phụ. Ưu tiên Typography-first (chữ rõ ràng, tinh gọn). Icon chỉ dùng ở các vị trí thực sự có giá trị chức năng/định vị (Sidebar menu, kính lúp tìm kiếm, chevron, nút đóng, nút logout).
- **Typography**:
  - Giao diện chính: `Montserrat`, sans-serif.
  - Mã phiếu (`RF-2026-XXXX`), Serial máy, số tiền VNĐ: bắt buộc dùng `JetBrains Mono` (`.rf-font-mono` hoặc component `<OrderCode />`).
- **Thành phần khung & Component Suite dùng chung (Unified Shared Components)**:
  - C1 shell dùng bộ khung từ `src/ui/shared/components`:
    - `<AppHeader />`: Headerbar đồng bộ (Breadcrumb, Search, Store Status, Notification, Avatar).
    - `<AppSidebar />`: Sidebar điều hướng chuẩn (Role-aware tabs, Workspace switcher, Workshop capacity).
    - `<AppFooter />`: Chân trang hệ thống thống nhất.
  - C2 business area sở hữu shell riêng và chỉ tái sử dụng primitive, token,
    icon, API client/type; không dùng shared shell làm business state boundary.
  - **Bộ Component SB Admin 2 style**: `<StatCard />`, `<CardPanel />`, `<PageHeader />`, `<DataTable />`, `<FormGroup />`, `<FormInput />`, `<FormSelect />`, `<Alert />`, `<Modal />`, `<ProgressStepper />`, `<EmptyState />`.
  - Mọi màn hình khách hàng dùng chung `<CustomerHeader />` và `<CustomerFooter />`.
- **Quy tắc đàn hồi Zoom (Zoom Resilience - 110% Baseline, 125% - 150% Reflow)**:
  - Mặc định lấy giao diện web tại **110% zoom** làm tiêu chuẩn nhìn đẹp mắt, cân đối.
  - Khi phóng to **125%** hoặc **150%**, toàn bộ layout/content phải tự động co lại theo `body`, không sinh thanh cuộn ngang body.
  - Sử dụng CSS Grid auto-fit (`repeat(auto-fit, minmax(min(100%, 220px), 1fr))`) cho các nhóm card/stat, typography dùng `clamp()`, và bảng dữ liệu bọc trong container cuộn ngang cục bộ.
- **Phân định 4 Persona & Điểm vào**:
  - **Manager**: Mặc định vào *Tổng quan vận hành* (`UI-A06`).
  - **Receptionist**: Mặc định vào *Hôm nay* (`UI-A07`) & *Tra cứu tiến độ* (`UI-B02` - **READ-ONLY tuyệt đối**, không có nút sửa chữa/đổi giá).
  - **Technician**: Mặc định vào *Hàng chờ công việc* (`UI-A08` - dạng danh sách ưu tiên theo SLA, không dùng Kanban làm luồng chính).
  - **Customer**: Public Mobile link (`UI-C05/C06`, `390×844`, xác thực OTP, không có sidebar nội bộ).
  - **Showcase**: `#/showcase` để kiểm thử toàn bộ thành phần và đo lường độ co giãn zoom.

## 4. Naming and file organization

- Organize by feature first and file type second.
- Use `kebab-case` for filenames, `camelCase` for variables/functions, and
  `PascalCase` for React components and types.
- Each feature has a primary file named after its directory.
- Keep entry files below 150 lines where possible and ordinary modules below
  250 lines. Split by responsibility, not arbitrary line count.
- Do not create vague folders such as `helpers`, `misc`, `common2`, or `final`.
- Do not create a new abstraction for one tiny consumer.
- Keep mock/demo data in `mocks/`; do not place it in `config/` or API modules.

## 5. React rules

- `app/main.tsx` owns startup and bootstrap status only.
- `app/routes.tsx` owns route matching and shell boundary selection.
- A feature owns its local render, event handlers, and presentation state.
- Prefer small named components and one-way dependencies: feature → shared,
  never shared → feature.
- C2 areas implement the `C2AreaMountProps` contract from
  `app/area-boundary.ts`; access context is passed in, not inferred from the
  URL or local storage.
- Use semantic HTML and accessible labels. Use `<button>` for actions and links
  for navigation; do not make a `<div>` interactive.
- Do not put secrets, tokens, or real customer data in the UI repository.

## 6. CSS rules

- `shared/styles/tokens.css` contains the design tokens (colors, fonts, radii, shadows).
- `shared/styles/target.css` contains target shell layout, reset, and responsive rules.
- `shared/styles/utilities.css` contains semantic badges, buttons, cards, skeletons, and toast.
- Use CSS custom properties for colors, spacing, radii, shadows, and breakpoints.
- Name classes by role, such as `.rf-badge--waiting`, `.rf-btn-primary`, not temporary position names.
- Avoid selectors deeper than three levels and avoid `!important`.
- Internal desktop target: `1440 × 1024`; customer/receptionist mobile target:
  `390 × 844`. Desktop-first internal views must remain responsive.

## 7. Local commands

Run these from `src/ui`:

```powershell
npm install
npm run type-check
npm run build
npm run dev
```

Use `?preview=1` or `VITE_UI_PREVIEW=true` for the local shell preview when
the backend health endpoint is not running. Preview data is read-only demo data.
