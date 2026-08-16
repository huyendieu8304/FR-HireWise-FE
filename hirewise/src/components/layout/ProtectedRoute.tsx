import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Bọc quanh các route yêu cầu đăng nhập (khu vực nội bộ). Chưa đăng nhập ->
 * redirect về `/login`, giữ lại `from` để quay lại đúng trang sau khi login.
 */
export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  }

  return <Outlet />;
}
