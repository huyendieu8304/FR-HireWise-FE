import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { ActivatePage } from '@/features/auth/pages/ActivatePage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { UserManagementPage } from '@/features/users/pages/UserManagementPage';
import { CloudStorageIntegrationPage } from '@/features/integrations/pages/CloudStorageIntegrationPage';
import { ComponentShowcasePage } from '@/features/showcase/pages/ComponentShowcasePage';
import { ROUTES } from '@/constants/routes';

/**
 * Cấu hình route gốc — 2 nhánh chính:
 * 1. Public (PublicLayout): trang không cần đăng nhập (login, careers/apply
 *    cho ứng viên sau này).
 * 2. Internal (ProtectedRoute > AppShell): toàn bộ nghiệp vụ ATS nội bộ,
 *    bắt buộc đăng nhập.
 *
 * Thêm feature mới -> thêm 1 route con vào đúng nhánh, KHÔNG tạo layout mới
 * trừ khi thực sự là một khu vực có bố cục khác biệt.
 */
export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: <Navigate to={ROUTES.LOGIN} replace /> },
      { path: ROUTES.LOGIN, element: <LoginPage /> },
      { path: ROUTES.ACTIVATE, element: <ActivatePage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: ROUTES.DASHBOARD, element: <DashboardPage /> },
          { path: ROUTES.USERS, element: <UserManagementPage /> },
          { path: ROUTES.SETTINGS_INTEGRATIONS, element: <CloudStorageIntegrationPage />,},
          { path: ROUTES.COMPONENT_SHOWCASE, element: <ComponentShowcasePage /> },
        ],
      },
    ],
  },
]);
