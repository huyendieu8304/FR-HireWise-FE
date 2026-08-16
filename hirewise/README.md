# HireWise — Frontend

Frontend ReactJS cho hệ thống ATS HireWise (xem `Planning/` ở thư mục gốc
repo để biết bối cảnh nghiệp vụ đầy đủ).

## Quick start

```bash
npm install
cp .env.example .env.local   # rồi điền VITE_API_BASE_URL trỏ tới backend thật
npm run dev
```

Mở `http://localhost:5173` — trang `/login` là điểm vào, `/components` là
trang tham chiếu trực quan cho toàn bộ UI component nền tảng.

## Scripts

| Lệnh                  | Mục đích                                   |
| ---------------------- | -------------------------------------------- |
| `npm run dev`           | Chạy dev server (HMR)                        |
| `npm run build`         | Typecheck + build production ra `dist/`      |
| `npm run preview`       | Preview bản build production                 |
| `npm run lint`           | Kiểm tra lỗi/style bằng ESLint                |
| `npm run lint:fix`       | Tự sửa lỗi ESLint có thể fix được             |
| `npm run format`         | Format toàn bộ code bằng Prettier             |
| `npm run format:check`   | Kiểm tra format mà không sửa (dùng cho CI)    |
| `npm run typecheck`      | Kiểm tra kiểu TypeScript, không build         |

## Tài liệu kiến trúc

Toàn bộ tài liệu kỹ thuật nằm trong [`docs/`](./docs):

- **[docs/GUIDE.md](./docs/GUIDE.md)** — cấu trúc thư mục, cách tùy chỉnh
  theme, cách gọi API, cách dùng Toast/Dialog, bộ input component tái sử
  dụng, utility formatter và coding conventions. Đọc trước khi code feature mới.
- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** — giải thích từng
  package trong `package.json` dùng để làm gì, và các file tương tác với
  nhau ra sao khi app chạy (dành cho người mới, có sơ đồ minh họa).
