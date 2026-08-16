# HireWise Frontend — Developer Guide

Tài liệu này giải thích kiến trúc nền tảng đã được thiết lập cho dự án
HireWise (ATS). Đọc file này trước khi bắt đầu implement feature mới.

> Xem tóm tắt nghiệp vụ đầy đủ trong `Planning/`. Đây chỉ là tài liệu kỹ
> thuật cho tầng frontend.
>
> Mới, chưa quen codebase? Đọc [`ARCHITECTURE.md`](./ARCHITECTURE.md) trước
> — giải thích từng package/file tương tác với nhau ra sao, dễ tiếp cận hơn
> cho người chưa có kinh nghiệm.

## Mục lục

1. [Stack & vì sao chọn](#1-stack--vì-sao-chọn)
2. [Cấu trúc thư mục](#2-cấu-trúc-thư-mục)
3. [Tùy chỉnh Theme (Design Tokens)](#3-tùy-chỉnh-theme-design-tokens)
4. [Gọi API bằng API Client](#4-gọi-api-bằng-api-client)
5. [Global Error / Toast / Confirm Dialog](#5-global-error--toast--confirm-dialog)
6. [Reusable Input Components](#6-reusable-input-components)
7. [Utility Formatters](#7-utility-formatters)
8. [Routing & Layouts](#8-routing--layouts)
9. [State Management: khi nào dùng gì](#9-state-management-khi-nào-dùng-gì)
10. [Coding Conventions](#10-coding-conventions)
11. [Việc cần làm tiếp theo](#11-việc-cần-làm-tiếp-theo)

---

## 1. Stack & vì sao chọn

| Layer            | Lựa chọn                          | Lý do                                                                 |
| ---------------- | ---------------------------------- | ---------------------------------------------------------------------- |
| Build tool        | Vite + React 19 + TypeScript       | App dashboard nội bộ nhiều route, không cần SSR/SEO sâu.               |
| Styling           | Tailwind CSS v4                    | CSS-first config (`@theme`), sinh utility trực tiếp từ design token.  |
| Routing           | React Router v7 (`createBrowserRouter`) | Chuẩn de-facto cho SPA React, hỗ trợ layout route lồng nhau.      |
| Server state      | TanStack Query                     | Cache/loading/error tự động cho mọi API call, khớp với Global Error Handler. |
| Client state      | Zustand                            | Nhẹ, không boilerplate, chỉ dùng cho state KHÔNG phải server-data (session, UI toggle...). |
| Form              | react-hook-form + zod               | Validate khai báo, tương thích native với input `register()`.         |
| HTTP              | axios                              | Interceptor mạnh, hỗ trợ hủy request, transform response.             |
| Date/time         | dayjs (locale `vi`)                | Nhẹ (~2KB core), API giống Moment, đủ cho format & so sánh ngày.       |
| Icon              | @phosphor-icons/react              | Bộ icon nhất quán, nhiều weight, tránh trộn nhiều family icon.        |

Toàn bộ các gói trên đã được cài sẵn trong `package.json`. Không tự ý thêm
thư viện lớn khác (state management thứ hai, UI kit khác, CSS-in-JS...) mà
không thống nhất với team trước — tránh phá vỡ tính nhất quán kiến trúc.

---

## 2. Cấu trúc thư mục

```
src/
├── app/                      # Lắp ráp ứng dụng cấp cao nhất
│   ├── AppProviders.tsx      #   Ráp mọi Provider theo đúng thứ tự (Error > Query > Toast/Dialog > Router)
│   ├── router.tsx            #   Khai báo toàn bộ route
│   └── ErrorBoundary.tsx     #   Bắt lỗi runtime JS ở tầng render
│
├── components/
│   ├── ui/                   # Component NỀN TẢNG, tái sử dụng ở MỌI feature
│   │   ├── Button/
│   │   ├── TextInput/  NumberInput/  Select/  DatePicker/
│   │   ├── Modal/  ConfirmDialog/  Toast/
│   │   ├── Skeleton/          #là một khung hình giả lập giao diện, giúp giảm cảm giác chờ đợi
│   │   ├── FormField/         #  wrapper nội bộ (label/error/helper) — không import trực tiếp
│   │   ├── inputStyles.ts     #  class Tailwind dùng chung cho mọi input
│   │   └── index.ts           #  barrel export — import từ đây: `import { Button, TextInput } from '@/components/ui'`
│   └── layout/                # Khung layout cấp trang: AppShell (nội bộ), PublicLayout (candidate), ProtectedRoute
│
├── features/                  # Code theo NGHIỆP VỤ (feature-based), KHÔNG theo loại file
│   ├── auth/
│   │   ├── api/                #   Hàm gọi API riêng của feature (dùng `http` từ lib/apiClient)
│   │   ├── pages/               #   Page component (route đích)
│   │   └── schema.ts            #   Zod schema validate form của feature
│   ├── dashboard/             
│   └── showcase/                # Trang tham chiếu sống — xem `/components` khi chạy `npm run dev`
│
├── hooks/                      # Custom hook DÙNG CHUNG toàn app (useNotification, useDialog...)
├── lib/                        # Hạ tầng kỹ thuật: apiClient.ts, queryClient.ts, authEvents.ts là một thư mục tùy chọn dùng để chứa các mã nguồn bổ trợ
├── store/                      # Zustand store (global client-state), là một kho chứa dữ liệu trung tâm (state) và các hàm thay đổi dữ liệu (actions), cho phép mọi component trong ứng dụng đọc và cập nhật dữ liệu trực tiếp mà không cần truyền props phức tạp hay bọc thẻ Provider.
├── styles/
│   ├── tokens.css              # ⭐ DESIGN TOKENS — nguồn sự thật duy nhất cho theme
│   └── index.css                # Entry CSS: import tokens + base layer + utility layer
├── types/                       # Type dùng chung nhiều nơi (vd `types/api.ts`: ApiResponse, AppError)
├── utils/
│   ├── cn.ts                    # Helper gộp className (clsx + tailwind-merge)
│   └── formatters/               # text.ts, number.ts, date.ts — xem mục 7
└── constants/
    └── routes.ts                 # Hằng số path route
```

**Quy tắc thêm feature mới:** tạo 1 thư mục trong `src/features/<ten-feature>/`
với các thư mục con `pages/`, `api/`, `components/` (nếu feature có component
riêng không dùng chỗ khác), `schema.ts` (nếu có form). Component nào được
dùng bởi ≥ 2 feature thì chuyển lên `components/ui/` (nếu là input/control
thuần) hoặc `components/layout/` (nếu là khung trang).

---

## 3. Tùy chỉnh Theme (Design Tokens)

**File duy nhất cần sửa khi rebrand / đổi theme: [`src/styles/tokens.css`](../src/styles/tokens.css).**

Tailwind v4 dùng cấu hình CSS-first — khối `@theme { ... }` định nghĩa biến
CSS và Tailwind **tự động sinh utility class tương ứng**, không cần khai báo
lại trong `tailwind.config.js` (project này không có file đó, đúng chuẩn v4).

### Ví dụ: đổi màu Primary

```css
/* src/styles/tokens.css */
@theme {
  --color-primary-600: #2563eb; /* đổi giá trị này */
}
```

Sau khi lưu, MỌI nơi dùng `bg-primary-600`, `text-primary-600`,
`border-primary-600`, `ring-primary-600`... trong toàn bộ codebase tự động
đổi theo — không cần sửa từng component.

### Các nhóm token có sẵn

| Nhóm            | Tiền tố class                          | Vị trí trong `tokens.css` |
| ---------------- | ---------------------------------------- | -------------------------- |
| Màu sắc          | `bg-`, `text-`, `border-`, `ring-`        | Mục 1 — `primary`, `secondary`, `neutral`, `success`, `warning`, `danger`, `info` |
| Typography       | `text-` (size), `font-`                   | Mục 2 — `--font-sans`, `--font-size-*`, `--font-weight-*` |
| Border radius     | `rounded-`                                | Mục 3 — `--radius-sm/md/lg/xl/full`         |
| Spacing           | `p-`, `m-`, `gap-`, hoặc `(--spacing-x)` | Mục 4 — alias ngữ nghĩa: `gutter`, `section`, `sidebar`, `header` |
| Shadow/Elevation | `shadow-elevation-1..4`                    | Mục 5                                        |
| Z-index           | `z-(--z-index-toast)` v.v.                | Mục 6 — tránh xung đột chồng lớp modal/toast/dropdown |

### Quy tắc bắt buộc khi code UI

- **Không hard-code hex color** trong component (`className="bg-[#2563eb]"` ❌).
  Luôn dùng token (`bg-primary-600` ✅).
- **Không tự ý thêm thang bo góc mới.** Input/button/card dùng `rounded-md`
  (`--radius-md`), badge/pill dùng `rounded-full`. Xem quy tắc SHAPE
  CONSISTENCY LOCK trong `inputStyles.ts` và `Button.tsx`.
- **Chỉ 1 accent màu chủ đạo** (`primary`) cho các hành động chính trong 1
  màn hình. `secondary` dùng cho nhấn nhá phụ, không thay thế `primary`.
- Dark mode: thêm class `dark` lên `<html>` (đã cấu hình `@custom-variant dark`
  trong `tokens.css`), style dark override đặt cạnh style light bằng biến thể
  `dark:` (vd `dark:bg-neutral-900`).

---

## 4. Gọi API bằng API Client

Toàn bộ giao tiếp HTTP đi qua **một** instance axios duy nhất:
[`src/lib/apiClient.ts`](../src/lib/apiClient.ts). Không gọi `axios.get(...)`
trực tiếp hay tạo `axios.create()` mới ở feature code.

### Cấu hình sẵn

- `baseURL` đọc từ `VITE_API_BASE_URL` (xem `.env.example` → copy thành `.env.local`).
- `timeout`: 15s.
- **Request interceptor**: tự gắn `Authorization: Bearer <token>` từ
  `useAuthStore` nếu đã đăng nhập.
- **Response interceptor**:
  - Bóc `data` khỏi envelope `{ data, message, meta }` — component nhận
    thẳng payload, không phải viết `res.data.data`.
  - Quy đổi MỌI lỗi (network, 4xx, 5xx) thành một kiểu `AppError` duy nhất
    (`src/types/api.ts`) — nơi gọi API chỉ cần `catch (err) { if (err instanceof AppError) ... }`.
  - Tự động toast lỗi cho các nhóm "hệ thống": mất mạng, 403, 429, 5xx.
  - `401`: tự xóa session (`useAuthStore.clearSession()`) và điều hướng về
    `/login` (qua `authEvents.ts`, xem mục 5).
  - `404` / `422`: **không** tự toast — để component tự quyết định hiển thị
    (inline lỗi form, empty state...).

### Cách gọi API mới — 3 bước

**Bước 1** — Tạo hàm gọi API trong `src/features/<feature>/api/`:

```ts
// src/features/jobs/api/jobsApi.ts
import { http } from '@/lib/apiClient';

export interface Job {
  id: string;
  title: string;
  salaryMin: number;
  salaryMax: number;
}

export function getJobs() {
  return http.get<Job[]>('/jobs');
}

export function createJob(payload: Omit<Job, 'id'>) {
  return http.post<Job>('/jobs', payload);
}
```

**Bước 2** — Dùng qua TanStack Query trong component/hook:

```tsx
// Đọc dữ liệu (query)
import { useQuery } from '@tanstack/react-query';
import { getJobs } from '../api/jobsApi';

const { data: jobs, isLoading, error } = useQuery({
  queryKey: ['jobs'],
  queryFn: getJobs,
});
```

```tsx
// Ghi dữ liệu (mutation)
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createJob } from '../api/jobsApi';
import { useNotification } from '@/hooks/useNotification';

const queryClient = useQueryClient();
const notify = useNotification();

const createJobMutation = useMutation({
  mutationFn: createJob,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['jobs'] });
    notify.success('Đã tạo tin tuyển dụng.');
  },
  // onError không bắt buộc — lỗi 5xx/network/403 đã tự toast qua queryClient
  // global onError (xem lib/queryClient.ts). Chỉ viết onError khi cần xử lý
  // RIÊNG (vd set lỗi inline cho field, như ví dụ LoginPage.tsx).
});
```

**Bước 3** — Nếu API cần hành vi đặc biệt:

```ts
// Không tự toast lỗi (tự xử lý UI riêng)
http.get('/jobs/search', { params: { q }, silent: true });

// Không tự đăng xuất khi 401 (dùng cho chính API login/refresh token)
http.post('/auth/refresh', payload, { skipAuthRedirect: true });
```

### Format envelope backend cần trả về

```jsonc
// Thành công
{ "data": { "id": "1", "title": "Backend Engineer" }, "message": "OK" }

// Lỗi validate (422)
{ "message": "Dữ liệu không hợp lệ", "errors": { "email": ["Email đã tồn tại"] } }
```

Nếu backend đổi format envelope, **chỉ sửa 1 chỗ**: hàm bóc `data` trong
response interceptor của `apiClient.ts` — không phải sửa từng lời gọi API.

---

## 5. Global Error / Toast / Confirm Dialog

### 5.1 Toast (`useNotification`)

```tsx
import { useNotification } from '@/hooks/useNotification';

function SomeComponent() {
  const notify = useNotification();

  notify.success('Đã lưu thành công!');
  notify.error('Có lỗi xảy ra.'); // hoặc truyền thẳng AppError: notify.error(err)
  notify.warning('Slot phỏng vấn sắp hết hạn.');
  notify.info('Đã đồng bộ 5 hồ sơ mới.');
}
```

Toast tự đóng sau 4s (lỗi: 6s), có thể đóng tay. Provider (`ToastProvider`)
đã được mount 1 lần ở gốc app (`AppProviders.tsx`) — **không** mount lại ở
feature khác.

> Lưu ý kỹ thuật: `apiClient.ts` (không phải component React) cũng bắn được
> toast, thông qua "toast bus" (`components/ui/Toast/toastBus.ts`) — một kênh
> pub/sub đơn giản mà `useNotification` cũng gọi vào. Không cần quan tâm chi
> tiết này khi dùng, chỉ cần biết `useNotification()` là API chuẩn cho component.

### 5.2 Confirm Dialog (`useDialog`)

Thay thế `window.confirm()` bằng modal có style riêng, trả `Promise<boolean>`:

```tsx
import { useDialog } from '@/hooks/useDialog';

function DeleteJobButton({ jobId }: { jobId: string }) {
  const { confirm } = useDialog();

  async function handleDelete() {
    const ok = await confirm({
      title: 'Xóa vị trí tuyển dụng?',
      description: 'Toàn bộ hồ sơ ứng viên liên quan sẽ bị gỡ khỏi pipeline.',
      confirmLabel: 'Xóa',
      tone: 'danger', // đổi nút xác nhận sang màu đỏ cho hành động phá hủy
    });
    if (ok) deleteJobMutation.mutate(jobId);
  }

  return <Button variant="danger" onClick={handleDelete}>Xóa</Button>;
}
```

### 5.3 Lỗi runtime JS (`ErrorBoundary`)

Đã bọc sẵn ở gốc app — không cần làm gì thêm cho trường hợp chung. Nếu một
khu vực cụ thể (vd 1 widget dashboard phức tạp) cần fallback UI RIÊNG thay vì
để lỗi kéo sập cả trang, bọc thêm 1 `ErrorBoundary` cục bộ quanh khu vực đó.

### 5.4 Tổng kết luồng lỗi

```
Lỗi API (axios)  → apiClient interceptor → AppError → toast tự động (403/429/5xx/network)
                                                     → hoặc để component tự xử lý (404/422)
Lỗi mutation/query chưa bắt riêng → queryClient global onError → toast dự phòng
Lỗi render JS   → ErrorBoundary → fallback UI toàn trang
Xác nhận hành động → useDialog().confirm() → Promise<boolean>
Thông báo chủ động → useNotification() → toast
```

---

## 6. Reusable Input Components

Import từ barrel `@/components/ui`:

```tsx
import { Button, TextInput, NumberInput, Select, DatePicker } from '@/components/ui';
```

### TextInput — tương thích trực tiếp `register()`

```tsx
<TextInput
  label="Email"
  type="email"
  placeholder="ban@congty.com"
  prefixIcon={<EnvelopeSimple />}
  helperText="Dùng để đăng nhập"
  error={errors.email?.message}
  required
  {...register('email')}
/>
```

### Select — cũng dùng trực tiếp `register()`

```tsx
<Select
  label="Phòng ban"
  placeholder="Chọn phòng ban"
  options={[{ value: 'eng', label: 'Engineering' }]}
  error={errors.departmentId?.message}
  {...register('departmentId')}
/>
```

### DatePicker — native `<input type="date">`, dùng trực tiếp `register()`

```tsx
<DatePicker label="Hạn nộp hồ sơ" mode="date" {...register('deadline')} />
<DatePicker label="Giờ phỏng vấn" mode="datetime-local" {...register('interviewAt')} />
```

Giá trị trả về theo chuẩn ISO (`YYYY-MM-DD` / `YYYY-MM-DDTHH:mm`). Dùng
`utils/formatters/date.ts` (`toDateInputValue`, `parseDateInputValue`) để
chuyển đổi qua lại với `Date`/API.

### NumberInput — **controlled**, dùng với `Controller` (không dùng `register()` trực tiếp)

Lý do: input cần format hiển thị (dấu phân cách hàng nghìn) khác với giá trị
số thực lưu trong form — native `register()` không hỗ trợ transform 2 chiều
kiểu này.

```tsx
<Controller
  name="salary"
  control={control}
  render={({ field, fieldState }) => (
    <NumberInput
      label="Mức lương"
      currencySymbol="₫"
      value={field.value}
      onChange={field.onChange}
      onBlur={field.onBlur}
      error={fieldState.error?.message}
    />
  )}
/>
```

### Xem demo chạy được

Chạy `npm run dev`, đăng nhập (bất kỳ email/password — sẽ demo toast lỗi
network vì chưa nối backend thật), rồi vào `/components` để xem toàn bộ
Button/TextInput/NumberInput/Select/DatePicker/Toast/Dialog hoạt động trực
tiếp — code mẫu tại
[`src/features/showcase/pages/ComponentShowcasePage.tsx`](../src/features/showcase/pages/ComponentShowcasePage.tsx).

### Khi nào KHÔNG dùng bộ input này

`Select` dựa trên `<select>` gốc (không hỗ trợ multi-select có tìm kiếm),
`DatePicker` dựa trên `<input type="date">` gốc (không hỗ trợ chọn khoảng
ngày / disable ngày cụ thể). Đây là lựa chọn có chủ đích để giữ nền tảng nhẹ,
không phụ thuộc thư viện ngoài. Khi 1 feature cụ thể cần hành vi phức tạp
hơn, tạo component riêng trong `features/<feature>/components/`, KHÔNG sửa
đè lên component nền tảng dùng chung.

---

## 7. Utility Formatters

Import từ barrel `@/utils/formatters`:

```ts
import {
  capitalize, capitalizeWords, truncate, slugify, removeVietnameseTones, getInitials,
  formatNumber, formatCurrency, formatCompactNumber, formatPercent,
  formatDate, formatDateTime, formatTime, formatRelativeTime, isDateToday, daysSince,
} from '@/utils/formatters';

formatCurrency(18_000_000, 'VND');   // "18.000.000 ₫"
formatCurrency(1500.5, 'USD');       // "$1,500.50"
formatNumber(1234567);                // "1.234.567"
formatDate('2026-08-13');             // "13/08/2026"
formatDateTime(new Date());           // "14:05 13/08/2026"
formatRelativeTime(Date.now() - 300000); // "5 phút trước"
truncate('Senior Backend Engineer (Java/Spring)', 20); // "Senior Backend…"
slugify('Kỹ sư Backend (Java/Spring)'); // "ky-su-backend-java-spring"
getInitials('Nguyễn Văn A');           // "NA"
```

**Quy tắc:** mọi nơi hiển thị ngày/số/tiền tệ trong UI PHẢI đi qua các hàm
này — không gọi `.toLocaleDateString()` hay tự nối dấu phẩy thủ công rải rác,
để đảm bảo định dạng nhất quán toàn hệ thống và chỉ cần đổi 1 chỗ khi cần
thay đổi (vd đổi từ `DD/MM/YYYY` sang format khác).

---

## 8. Routing & Layouts

Route khai báo tập trung tại [`src/app/router.tsx`](../src/app/router.tsx), chia
2 nhánh:

- **`PublicLayout`** (`components/layout/PublicLayout.tsx`) — khu vực không
  cần đăng nhập: trang login, và sau này là trang tuyển dụng công khai /
  form ứng tuyển dành cho candidate.
- **`ProtectedRoute` → `AppShell`** (`components/layout/`) — khu vực nội bộ
  (sidebar + topbar), bắt buộc đăng nhập (`useAuthStore.isAuthenticated`).
  Chưa đăng nhập sẽ tự redirect về `/login`.

Thêm 1 trang mới vào khu vực nội bộ:

```tsx
// 1. Tạo page trong feature tương ứng
// src/features/jobs/pages/JobListPage.tsx

// 2. Thêm path vào constants/routes.ts
export const ROUTES = { ...existing, JOBS: '/jobs' };

// 3. Đăng ký route trong app/router.tsx, bên trong children của AppShell
{ path: ROUTES.JOBS, element: <JobListPage /> }
```

---

## 9. State Management: khi nào dùng gì

| Loại state                                                        | Dùng gì                          |
| -------------------------------------------------------------------- | ---------------------------------- |
| Dữ liệu fetch từ API (danh sách job, chi tiết ứng viên...)            | **TanStack Query** (`useQuery`/`useMutation`) |
| State UI cục bộ trong 1 component (form input tạm, tab đang mở)       | `useState` / `useReducer`          |
| State toàn cục KHÔNG phải server-data (session, sidebar collapsed...) | **Zustand** (xem `store/useAuthStore.ts` làm ví dụ) |
| Giá trị liên tục theo con trỏ/scroll/kéo-thả (drag Kanban card...)     | Cân nhắc thư viện chuyên biệt cho tương tác đó — KHÔNG dùng `useState` (gây re-render liên tục) |

**Không** cache dữ liệu server trong Zustand — TanStack Query đã lo cache,
invalidate, refetch. Trộn 2 việc này gây bug đồng bộ khó debug.

---

## 10. Coding Conventions

- **TypeScript strict** — không dùng `any`, ưu tiên suy luận kiểu từ Zod
  schema (`z.infer<typeof schema>`) thay vì định nghĩa interface trùng lặp.
- **Import type riêng biệt**: `import type { Foo } from '...'` khi chỉ dùng
  làm type (bật `verbatimModuleSyntax` trong `tsconfig`, ESLint rule
  `@typescript-eslint/consistent-type-imports` sẽ nhắc nếu quên).
- **Path alias `@/`** trỏ tới `src/` — luôn import tuyệt đối qua `@/...`,
  không dùng đường dẫn tương đối kiểu `../../../components`.
- **Component**: PascalCase, 1 component chính / file, đặt tên file trùng
  tên component (`Button.tsx` export `Button`).
- **Hook**: bắt đầu bằng `use`, đặt trong `src/hooks/` nếu dùng toàn app,
  hoặc `features/<feature>/hooks/` nếu chỉ riêng feature đó.
- **className**: luôn dùng `cn(...)` (`@/utils/cn`) khi có class điều kiện
  hoặc khi component nhận `className`/`containerClassName` từ ngoài — đảm
  bảo override không bị xung đột (nhờ `tailwind-merge`).
- **Form**: label phía trên input, error phía dưới, helper text luôn có mặt
  trong markup (dù rỗng) — đã được đảm bảo tự động nếu dùng
  `TextInput`/`NumberInput`/`Select`/`DatePicker` từ `components/ui`. Không
  tự viết input thô ngoài bộ này trừ khi thực sự cần thiết.
- **Không dùng `window.confirm`/`alert`** — dùng `useDialog()`/`useNotification()`.
- **Lint & format trước khi commit**:
  ```bash
  npm run lint        # ESLint (báo lỗi/warning chất lượng code)
  npm run lint:fix     # tự sửa lỗi có thể fix được
  npm run format        # Prettier format toàn bộ (kể cả sắp xếp class Tailwind
                         #   nhờ prettier-plugin-tailwindcss)
  npm run typecheck     # tsc --noEmit, không build ra dist
  ```
- **1 icon family duy nhất**: chỉ dùng `@phosphor-icons/react`. Không tự vẽ
  SVG icon tay, không trộn icon từ thư viện khác.

---

## 11. Việc cần làm tiếp theo

Phần "nền tảng kiến trúc" đã sẵn sàng. Các việc sau thuộc phạm vi triển khai
từng feature nghiệp vụ (xem `Planning/Planning/Backlog.xlsx` — sheet `User
Stories`), KHÔNG thuộc phạm vi setup này:

- Nối `VITE_API_BASE_URL` với backend thật, xóa mock demo trong `LoginPage`.
- Kanban Pipeline (kéo-thả) — cần chọn thư viện DnD riêng (vd `@dnd-kit/core`),
  chưa nằm trong bộ dependency hiện tại — thống nhất với team trước khi thêm.
- Biểu đồ báo cáo (Pipeline Velocity, Source ROI) — cần chọn thư viện chart
  (vd Recharts) khi bắt đầu feature Reports.
- Code-splitting theo route (`React.lazy`) khi số lượng feature/route tăng —
  hiện bundle chưa cần vì app còn nhỏ.
- Hoàn thiện RBAC thực tế trong `AppShell` (hiện sidebar hiển thị cố định
  cho mọi role, chưa lọc theo `user.role`).
