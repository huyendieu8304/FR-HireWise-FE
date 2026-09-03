/**
 * Hằng số đường dẫn route — import từ đây thay vì gõ tay chuỗi path, để đổi
 * URL chỉ cần sửa một chỗ và tránh lỗi gõ nhầm khi dùng `<Link>`/`navigate()`.
 */
export const ROUTES = {
  LOGIN: '/login',
  ACTIVATE: '/activate',
  DASHBOARD: '/dashboard',
  JOBS: '/jobs',
  /** UC-12: tạo mới Job Position. */
  JOB_NEW: '/jobs/new',
  JOB_DETAIL: '/jobs/:jobId',
  /** UC-12 AF-01: "Lưu nháp" lại 1 Job đang Draft/Rejected. */
  JOB_EDIT: '/jobs/:jobId/edit',
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
  /** UC-20: Applicant Card — chi tiết 1 hồ sơ ứng tuyển, cũng là điểm vào của UC-29 (Từ chối). */
  APPLICATION_DETAIL: '/applications/:applicationId',
  /** UC-18: HR Admin cấu hình và đồng bộ Google Calendar / Outlook Calendar. */
  SETTINGS_CALENDAR: '/settings/integrations/calendar',
  /** UC-24: Calendar view toàn bộ lịch phỏng vấn đã xếp. */
  INTERVIEW_CALENDAR: '/interviews/calendar',
  /** UC-38/UC-39: trang ứng viên mở từ liên kết bảo mật trong email EM-11 — xác thực OTP rồi ký điện tử. */
  OFFER_PUBLIC: '/offer/:token',
} as const;

