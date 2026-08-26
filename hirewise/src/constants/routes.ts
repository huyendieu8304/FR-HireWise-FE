/**
 * Hằng số đường dẫn route — import từ đây thay vì gõ tay chuỗi path, để đổi
 * URL chỉ cần sửa một chỗ và tránh lỗi gõ nhầm khi dùng `<Link>`/`navigate()`.
 */
export const ROUTES = {
  LOGIN: '/login',
  ACTIVATE: '/activate',
  DASHBOARD: '/dashboard',
  JOBS: '/jobs',
  USERS: '/users',
  COMPONENT_SHOWCASE: '/components',
  CAREERS: '/careers',
  CAREERS_APPLY: '/careers/:jobId/apply',
  SETTINGS_INTEGRATIONS: '/settings/integrations',
  PIPELINE_TEMPLATES: '/settings/pipeline-templates',
  SETTINGS_EMAIL_TEMPLATES: '/settings/email-templates',
  /** UC-14: Hiring Manager xem danh sách Job đang chờ duyệt. */
  JOB_APPROVALS: '/approvals',
  /** UC-15: chi tiết 1 Job để Approve/Reject (chưa implement). */
  JOB_APPROVAL_DETAIL: '/approvals/:jobId',
  /** UC-22/UC-23: Kanban board ứng viên theo Job (kéo-thả đổi Stage). */
  KANBAN_BOARD: '/pipeline',
} as const;

