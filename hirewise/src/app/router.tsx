import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { ActivatePage } from '@/features/auth/pages/ActivatePage';
import { JobBoardPage } from '@/features/jobs/pages/JobBoardPage';
import { ApplyPage } from '@/features/jobs/pages/ApplyPage';
import { ApprovalListPage } from '@/features/jobs/pages/ApprovalListPage';
import { ApprovalDetailPage } from '@/features/jobs/pages/ApprovalDetailPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { UserManagementPage } from '@/features/users/pages/UserManagementPage';
import { CloudStorageIntegrationPage } from '@/features/integrations/pages/CloudStorageIntegrationPage';
import { PipelineManagementPage } from '@/features/pipelines/pages/PipelineManagementPage';
import { KanbanBoardPage } from '@/features/kanban/pages/KanbanBoardPage';
import { ComponentShowcasePage } from '@/features/showcase/pages/ComponentShowcasePage';
import { EmailTemplatePage } from '@/features/email-templates/pages/EmailTemplatePage';
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
      { path: ROUTES.CAREERS, element: <JobBoardPage /> },
      { path: ROUTES.CAREERS_APPLY, element: <ApplyPage /> },
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
          {
            path: ROUTES.SETTINGS_INTEGRATIONS,
            element: <CloudStorageIntegrationPage />,
          },
          { path: ROUTES.PIPELINE_TEMPLATES, element: <PipelineManagementPage /> },
          /** danh sách mọi Job (lọc phòng ban/trạng thái) -> chi tiết Job  */
          { path: ROUTES.JOBS, element: <JobListPage /> },
          { path: ROUTES.JOB_DETAIL, element: <JobDetailPage /> },
          { path: ROUTES.SETTINGS_EMAIL_TEMPLATES, element: <EmailTemplatePage /> },
          { path: ROUTES.COMPONENT_SHOWCASE, element: <ComponentShowcasePage /> },
          /** UC-14: Hiring Manager xem danh sách Job đang chờ duyệt. */
          { path: ROUTES.JOB_APPROVALS, element: <ApprovalListPage /> },
          /** UC-15: Hiring Manager xem chi tiết và Phê duyệt / Từ chối Job. */
          { path: ROUTES.JOB_APPROVAL_DETAIL, element: <ApprovalDetailPage /> },
        ],
      },
    ],
  },
]);
