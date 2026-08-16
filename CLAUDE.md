# HireWise — Hướng dẫn cho AI Agent làm việc trong repo này

## Bối cảnh dự án

HireWise là hệ thống ATS (Applicant Tracking System) cho SME. Đọc
`Planning/Planning/` khi cần hiểu nghiệp vụ (Backlog.xlsx: Feature / Main
Flow / User Stories, và bản Proposal) — đặc biệt trước khi implement 1
feature nghiệp vụ mới (Kanban pipeline, Scorecard, Offer & e-Signature...).

> `Planning/` không được push lên Git (xem `.gitignore` ở gốc repo) — chỉ
> tồn tại local. Nếu bạn không thấy thư mục này, hỏi người quản lý dự án để
> lấy lại tài liệu nghiệp vụ.

## Trước khi code bất cứ thứ gì trong `hirewise/`

1. Đọc **`hirewise/docs/GUIDE.md`** — kiến trúc, cách gọi API, cách dùng
   Toast/Dialog, bộ input component tái sử dụng, formatter, coding
   conventions. Đây là quy chuẩn kỹ thuật bắt buộc tuân theo.
2. Đọc **`hirewise/docs/ARCHITECTURE.md`** khi cần hiểu package/file tương
   tác với nhau ra sao (hữu ích khi debug hoặc onboard thành viên mới).
3. Với bất kỳ việc gì liên quan đến **giao diện/UI/thiết kế** (tạo trang
   mới, chỉnh layout, chọn màu, spacing, typography, animation...): dùng
   skill `design-taste-frontend` (định nghĩa tại
   `.agents/skills/design-taste-frontend/SKILL.md`). Lưu ý: skill này viết
   cho landing page/portfolio là chính — với HireWise (app dashboard nội
   bộ + cổng ứng viên), chỉ áp dụng phần tổng quát (Design Tokens, màu sắc,
   typography, shape consistency, a11y, form pattern, loading/empty/error
   state); **bỏ qua** phần Hero/Bento/Marquee/Layout Diversification vốn
   dành riêng cho trang landing.

## Quy tắc bắt buộc

- Không tự thêm dependency/thư viện mới (state management khác, UI kit
  khác, thư viện chart, DnD...) mà không hỏi ý kiến người dùng trước — xem
  `hirewise/docs/GUIDE.md` mục 1 và mục 11 ("Việc cần làm tiếp theo").
- Mọi màu sắc/spacing/radius phải dùng Design Token đã khai báo trong
  `hirewise/src/styles/tokens.css` — không hard-code hex color.
- Mọi lời gọi API phải đi qua `hirewise/src/lib/apiClient.ts` (qua hàm
  `http.*`) — không gọi `axios`/`fetch` trực tiếp trong component.
- Input trong form dùng bộ component ở `hirewise/src/components/ui/`
  (TextInput, NumberInput, Select, DatePicker) — không tự viết `<input>` thô.

## Cấu trúc repo

```
Planning/          # Tài liệu nghiệp vụ — CHỈ local, không push lên Git
hirewise/          # Source code React
hirewise/docs/     # GUIDE.md + ARCHITECTURE.md
hirewise/README.md # Quick start (trỏ vào hirewise/docs/)
.agents/skills/     # Skill định nghĩa cho agent, dùng chung cả team (design-taste-frontend)
skills-lock.json    # Lockfile của skill ở trên
```
