import { Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Bọc quanh các route yêu cầu đăng nhập (khu vực nội bộ). Chưa đăng nhập ->
 * redirect về `/login`.
 *
 * Cố tình KHÔNG giữ lại `from` (trang đang đứng) để quay lại sau khi login:
 * cùng 1 tab thường có nhiều người thay phiên đăng nhập (test nhiều role,
 * máy dùng chung...) - nếu quay lại đúng URL cũ thì role MỚI đăng nhập có
 * thể bị "mắc kẹt" ở trang không dành cho role của họ (route ở đây chỉ gate
 * theo isAuthenticated, không theo permission - xem router.tsx). Luôn về
 * `ROUTES.DASHBOARD`, đúng và an toàn cho mọi role, là lựa chọn đáng tin hơn.
 */
export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <Outlet />;
}
