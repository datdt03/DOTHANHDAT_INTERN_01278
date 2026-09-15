# RepairFlow plans — implementation standard

Thư mục này chuyển requirements và architecture đã chốt trong `docs/v0/` thành
các lát triển khai nhỏ, có owner, dependency, file đầu ra và tiêu chí nghiệm thu.
Plan không thay thế requirements; mọi thay đổi về nghiệp vụ, quyền, state,
database contract hoặc API contract phải cập nhật source of truth trước.

## Cấu trúc

```text
plans/
├── README.md
└── v0/
    ├── README.md
    ├── 00-master-plan.md
    ├── c0-runtime-stack-migration/
    │   ├── c0-001-codex-dotnet-api-foundation.md
    │   ├── c0-002-antigravity-react-vite-foundation.md
    │   └── c0-003-shared-stack-migration-acceptance.md
    ├── c1-access-and-application-shell/
    │   └── ...
    └── c2-customer-device-order/
        └── ...
```

Chỉ tạo plan chi tiết cho cluster kế tiếp khi output của cluster trước đã được
kiểm chứng và đủ thông tin. `00-master-plan.md` là bản đồ ổn định; các file
`cX-...` mới chứa hướng triển khai chi tiết.

## Đánh số và thứ tự

Tên file dùng format:

```text
c<cluster>-<sequence>-<owner>-<short-description>.md
```

Ví dụ: `c1-001-codex-api-foundation.md` là lát đầu tiên của C1,
`c1-002-antigravity-ui-shell.md` là lát UI tiếp theo.

- Số thứ tự thể hiện hướng triển khai dự kiến; trường `Depends on` mới là
  dependency cuối cùng khi có ngoại lệ.
- `codex` phụ trách server/API; `antigravity` phụ trách UI; `shared` là bước
  hai bên cùng kiểm thử và nghiệm thu.
- Không đổi số của plan đã bắt đầu hoặc đã hoàn tất. Scope nhỏ thì tăng
  `Revision`; phát sinh task mới thì dùng sequence tiếp theo.
- Thay đổi ảnh hưởng nhiều cluster phải cập nhật master plan và tạo amendment
  plan ở cluster liên quan.

## Tech stack target và compatibility baseline

Target đã chốt trong `docs/v0/`:

- Backend/API: ASP.NET Core Web API trên .NET, modular monolith.
- Data access: Entity Framework Core + Npgsql, PostgreSQL.
- Schema: versioned SQL migrations, được thực thi bởi migration runner trên
  backend .NET và giữ đúng schema contract/thứ tự đã chốt.
- Web UI: React + Vite + TypeScript; Vite chỉ làm dev/build, frontend runtime
  là static assets.
- Boundary: React gọi ASP.NET Core API qua adapter; business rule, permission,
  transaction và response contract nằm ở backend.

`src/app/` và `src/db/` là compatibility prototype Python/FastAPI đã được xóa.
`src/ui/` vẫn là vanilla JavaScript prototype dùng làm functional/visual
reference. Không phần nào trong số đó là nền tảng target để viết C1. Việc dựng
target được tách thành C0; không khôi phục các file database/migration prototype
cũ chỉ để làm plan.

## Vòng triển khai bắt buộc

Mỗi capability đi theo vertical slice:

```text
Codex: ASP.NET Core API/schema/behavior/test
    ↓
Antigravity: React screen/component/state/API adapter
    ↓
Codex: điều chỉnh API khi UI phát hiện gap đã xác nhận
    ↓
Antigravity: hoàn thiện UI state, responsive và visual QA
    ↓
Shared: integration + acceptance
```

API-first nghĩa là server phải cung cấp behavior tối thiểu và contract có thể
kiểm thử trước khi UI slice được chốt; không có nghĩa Codex phải làm xong toàn
bộ backend của một cluster trước khi Antigravity bắt đầu.

## Phân vai

| Khu vực | Codex | Antigravity | Shared |
| --- | --- | --- | --- |
| Backend/API | ASP.NET Core endpoints, contracts/OpenAPI 3.0, application services, policy, transaction | Dùng API qua adapter, phản hồi gap bằng plan | Verify behavior end-to-end |
| Database | EF Core + Npgsql, versioned SQL migration runner, constraints, query và fixture | Không truy cập database trực tiếp | Kiểm tra dữ liệu hiển thị và isolation |
| UI | Cung cấp response/error/loading/forbidden states của boundary | React components, screens, navigation, state, Vite build, responsive/visual QA | Scenario và acceptance |
| Tests | .NET unit/API/integration/migration tests | Type-check, Vite build, UI/manual/visual checks theo khả năng repo | Acceptance matrix |
| Business rules | Enforce đúng docs/v0 ở backend | Chỉ phản ánh rule, không tự phát minh hoặc dùng UI làm security boundary | Escalate conflict về docs/v0 |

## Header bắt buộc

Mỗi plan phải bắt đầu bằng:

```text
Plan ID: c1-001
Title: Codex API foundation
Owner: Codex
Status: READY
Revision: 1
Depends on: c0-003-shared-stack-migration-acceptance.md
Produces: API/schema/behavior/test output
Consumed by: c1-002-antigravity-ui-shell.md
```

Status dùng thống nhất: `DRAFT`, `READY`, `IN PROGRESS`, `BLOCKED`, `DONE`,
`SUPERSEDED`.

## Section bắt buộc trong mỗi plan

- Goal
- Main business requirements, nếu task có tác động nghiệp vụ
- Scope
- Out of scope
- Dependencies
- Input files
- Output files
- Files to write
- Step-by-step implementation
- Testing plan
- Acceptance criteria
- Change impact

Checklist chỉ đánh dấu `[x]` sau khi có bằng chứng kiểm tra tương ứng. Không
đánh dấu `DONE` nếu còn test hoặc acceptance criterion chưa xác minh.

## Quy tắc thay đổi

- Đọc `AGENTS.md`, `docs/README.md`, `docs/v0/README.md`, requirements và
  architecture liên quan trước khi sửa plan.
- Không dùng `docs/v0/archive/` làm nguồn yêu cầu.
- Nếu phát hiện business rule, permission, state, data model hoặc API contract
  mới: dừng phần bị ảnh hưởng, cập nhật docs/v0, rồi tăng revision hoặc tạo
  plan mới.
- Không thêm framework, service hạ tầng hoặc business rule chỉ để làm plan
  thuận tiện.
- Không sửa generated artifact thủ công nếu repo có build command tạo lại.
- Plan thay đổi stack phải đi qua C0; các cluster C1–C10 chỉ dùng target stack
  sau khi C0 migration acceptance pass.
