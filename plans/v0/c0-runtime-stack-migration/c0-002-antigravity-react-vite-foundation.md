# C0-002 — Antigravity React/Vite foundation

Plan ID: c0-002

Title: Migrate UI runtime foundation to React + Vite + TypeScript

Owner: Antigravity

Status: PLANNED

Revision: 1

Depends on: c0-001-codex-dotnet-api-foundation.md

Produces: React/Vite/TypeScript app shell, typed API adapter boundary and target UI build

Consumed by: c0-003-shared-stack-migration-acceptance.md and c1-002-antigravity-ui-shell.md

## Goal

Chuyển `src/ui` từ vanilla JavaScript prototype sang React + Vite + TypeScript,
giữ các màn hình hiện tại làm functional/visual reference trong thời gian
migrate. Task chỉ dựng frontend foundation và adapter boundary; chưa làm login,
permission hoặc business workflow.

## Main business and technical requirements

- UI target là React + Vite + TypeScript cho Internal Web UI và Customer Link UI.
- Vite chỉ đảm nhiệm dev/build; production output là static assets.
- React chỉ render UI và quản lý presentation state; không chứa business rule,
  permission enforcement hoặc database access.
- UI gọi ASP.NET Core API qua adapter; API URL và environment config không được
  rải trong feature component.
- Internal shell và customer-link layout phải có boundary riêng.
- UI phải có loading, error và unavailable API state ngay từ foundation.

## Scope

- Tạo Vite app target trong `src/ui` và giữ prototype files chưa được dùng làm
  reference cho tới khi shared acceptance xác nhận migration.
- Tạo React bootstrap, route boundary, shell mount và typed API client tối thiểu.
- Chuyển style tokens/base cần cho shell target; không port toàn bộ business page.
- Cập nhật `src/ui/AGENTS.md` để quy tắc local phản ánh React/TypeScript/Vite.
- Tạo build/type-check scripts phù hợp package manager hiện có.

## Out of scope

- Login/session UI, role navigation và access business behavior; thuộc C1.
- Customer/order/quote/repair screens hoàn chỉnh.
- Gọi trực tiếp database hoặc tự enforce permission trong browser.
- Thay đổi API contract của c0-001.
- Xóa ngay các file vanilla JS/bundle cũ trước khi biết chắc không còn usage.
- Thêm state library, UI kit hoặc test framework mới nếu chưa có quyết định
  trong docs/v0.

## Dependencies

- `c0-001-codex-dotnet-api-foundation.md`.
- `AGENTS.md` và `src/ui/AGENTS.md`.
- `docs/v0/06-ui-requirements.md`.
- `docs/v0/08-ui-design-blueprint-and-stitch-handoff.md`.
- `docs/v0/03-business-and-domain-requirements.md`, tech boundary.
- `docs/v0/04-architecture-c4-arc42.md`, target web topology.
- `src/ui/index.html`, `src/ui/app.js`, `src/ui/config/routes.js` và các feature
  prototype hiện tại chỉ dùng để đối chiếu behavior/visual.

## Input files

- `src/ui/AGENTS.md`.
- `src/ui/index.html`.
- `src/ui/app.js`.
- `src/ui/config/routes.js`.
- `src/ui/features/dashboard/`.
- `src/ui/features/customer-link/`.
- `src/ui/shared/styles/`.
- `docs/v0/06-ui-requirements.md`.
- `docs/v0/08-ui-design-blueprint-and-stitch-handoff.md`.
- Handoff API base URL và health contract từ c0-001.

## Output files

- React app mount được bằng Vite.
- TypeScript API adapter gọi được health endpoint target.
- Internal/customer-link layout boundary rõ ràng.
- Vite production build và type-check chạy được.
- Prototype vanilla vẫn còn nguyên cho tới khi c0-003 xác nhận đủ reference.

## Files to write

- [ ] `src/ui/package.json`.
- [ ] `src/ui/vite.config.ts`.
- [ ] `src/ui/tsconfig.json`.
- [ ] `src/ui/index.html`.
- [ ] `src/ui/app/main.tsx`.
- [ ] `src/ui/app/app-shell.tsx`.
- [ ] `src/ui/app/routes.tsx`.
- [ ] `src/ui/config/runtime-config.ts`.
- [ ] `src/ui/shared/api/api-client.ts`.
- [ ] `src/ui/shared/styles/target.css`.
- [ ] `src/ui/AGENTS.md`, chỉ cập nhật quy tắc sau khi target structure đã freeze.

## Step-by-step implementation

- [ ] Kiểm tra package manager và Node version đang được repository sử dụng;
  không tạo lockfile hoặc command của package manager khác nếu chưa cần.
- [ ] Tạo Vite React TypeScript entry trong `src/ui` mà không xóa prototype files.
- [ ] Tạo runtime config cho API base URL từ environment; có local default an
  toàn và không chứa token/secret.
- [ ] Tạo typed `api-client` với timeout, JSON parsing và mapping lỗi envelope
  từ ASP.NET Core.
- [ ] Tạo app bootstrap với ba trạng thái rõ ràng: booting, API unavailable và
  ready; không render protected screen khi chưa có context.
- [ ] Tạo route boundary tách internal layout và customer-link layout.
- [ ] Dùng CSS target riêng hoặc file style target để tránh làm hỏng prototype
  reference trong khi migration chưa nghiệm thu.
- [ ] Cập nhật local AGENTS để các task C1 biết target path, naming và build flow.
- [ ] Chạy type-check/build và ghi lại command/output cho c0-003.

## Testing plan

- [ ] TypeScript type-check pass nếu package scripts đã định nghĩa.
- [ ] Vite development server mount được React app.
- [ ] Vite production build tạo static assets.
- [ ] API adapter gọi `/health` của c0-001 và parse đúng envelope.
- [ ] API unavailable state hiển thị được khi server không chạy.
- [ ] Internal layout không được tự động gắn vào customer-link route.
- [ ] Kiểm tra desktop/mobile foundation ở viewport theo UI requirements.
- [ ] Không xóa hoặc sửa generated bundle prototype bằng tay.

## Acceptance criteria

- [ ] `src/ui` có React + Vite + TypeScript target rõ ràng.
- [ ] UI build được mà không cần Python/FastAPI runtime.
- [ ] Adapter là boundary duy nhất để gọi API trong target foundation.
- [ ] Type-check/build command được handoff cho C0 acceptance.
- [ ] Không có business rule hoặc permission check mới nằm trong component.
- [ ] C1 có thể mở rộng feature theo `app`, `config`, `features`, `shared` mà
  không phải quay lại migration stack.

## Change impact

Nếu c0-001 đổi response envelope, API URL hoặc OpenAPI contract, sửa adapter và
tăng Revision; không tạo shape riêng cho mock. Nếu docs/v0 đổi information
architecture, cập nhật docs trước rồi mới sửa shell. Nếu package manager hoặc
folder layout khác với giả định này, cập nhật master plan và các plan C1 trước.
