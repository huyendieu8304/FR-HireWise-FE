/**
 * Hằng số đường dẫn route — import từ đây thay vì gõ tay chuỗi path, để đổi
 * URL chỉ cần sửa một chỗ và tránh lỗi gõ nhầm khi dùng `<Link>`/`navigate()`.
 */
export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  JOBS: '/jobs',
  COMPONENT_SHOWCASE: '/components',
  CAREERS: '/careers',
} as const;
