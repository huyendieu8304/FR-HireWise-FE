import { http } from '@/lib/apiClient';
import type { PagedResponse } from '@/types/api';
import type {
  HiringManagerOption,
  InternalJobDetail,
  InternalJobSummary,
  JobPositionFormPayload,
  JobPositionStatus,
  SubmitJobPayload,
} from '../types';

export interface ListInternalJobsParams {
  page?: number;
  size?: number;
  departmentId?: number;
  status?: JobPositionStatus;
  /** Ô search box — tìm theo tên vị trí (case-insensitive, khớp 1 phần). */
  keyword?: string;
}

/**
 * "Vị trí tuyển dụng": danh sách mọi Job Position trong phạm vi truy cập
 * (Access Scope) của Recruiter/Hiring Manager/Interviewer hiện tại, có thể
 * lọc theo phòng ban, trạng thái và tìm theo tên (search box) — khác
 * `listPublicJobs` (chỉ Job đã Published, không cần đăng nhập) và
 * `listPendingApprovals` (chỉ dành cho Hiring Manager với quyền JOB_APPROVE).
 */
export function listInternalJobs(
  params: ListInternalJobsParams = {},
): Promise<PagedResponse<InternalJobSummary>> {
  return http.get<PagedResponse<InternalJobSummary>>('/jobs', {
    params: {
      page: params.page ?? 0,
      size: params.size ?? 20,
      departmentId: params.departmentId,
      status: params.status,
      keyword: params.keyword || undefined,
    },
  });
}

/** Chi tiết đầy đủ 1 Job Position — dùng cho tab "Mô tả chi tiết". */
export function getInternalJobDetail(jobId: string): Promise<InternalJobDetail> {
  return http.get<InternalJobDetail>(`/jobs/${jobId}`);
}

/**
 * UC-12: mọi Hiring Manager đang hoạt động, cho dropdown "Chọn Hiring
 * Manager" trên form tạo/sửa Job — Recruiter tự chọn Job này mở ra cho ai.
 */
export function getAvailableHiringManagers(): Promise<HiringManagerOption[]> {
  return http.get<HiringManagerOption[]>('/jobs/hiring-managers');
}

/** UC-12 normal flow: tạo Job Position mới (luôn ở trạng thái Draft, tự gán Recruiter = người gọi). */
export function createInternalJob(payload: JobPositionFormPayload): Promise<InternalJobDetail> {
  return http.post<InternalJobDetail>('/jobs', payload);
}

/**
 * UC-12 AF-01: "Lưu nháp" lại 1 Job đang Draft/Rejected — gửi lại NGUYÊN
 * form (không phải patch từng phần), khớp cách backend xử lý.
 */
export function updateInternalJob(
  jobId: string,
  payload: JobPositionFormPayload,
): Promise<InternalJobDetail> {
  return http.patch<InternalJobDetail>(`/jobs/${jobId}`, payload);
}

/**
 * UC-13 main flow: gán Pipeline Template (phải đang ACTIVE) cho 1 Job
 * Position đang Draft/Rejected và gửi lên chờ Hiring Manager phê duyệt —
 * backend tự chuyển job sang PENDING_APPROVAL và gửi email thông báo (EM-02).
 */
export function submitJobForApproval(
  jobId: string,
  payload: SubmitJobPayload,
): Promise<InternalJobDetail> {
  return http.post<InternalJobDetail>(`/jobs/${jobId}/submit`, payload);
}

/**
 * UC-45: đăng 1 Job đã được Hiring Manager phê duyệt (`APPROVED`) lên Public
 * Job Board — backend chuyển status sang `PUBLISHED`, từ đó job mới hiện ở
 * `/careers` và mới nhận được hồ sơ. Cần permission `JOB_PUBLISH` và người
 * gọi phải là Recruiter phụ trách chính Job đó.
 *
 * Lỗi có thể gặp: 409 `JOB_POSITION_NOT_PUBLISHABLE` (job không ở trạng thái
 * Đã phê duyệt), 403 nếu không phải chủ Job.
 */
export function publishJob(jobId: string): Promise<InternalJobDetail> {
  return http.post<InternalJobDetail>(`/jobs/${jobId}/publish`);
}

/**
 * UC-44 normal flow: tạm dừng 1 Job đang `PUBLISHED` — job bị ẩn khỏi Job
 * Board và ngừng nhận hồ sơ mới, nhưng ứng viên/hồ sơ hiện có giữ nguyên và
 * có thể Mở lại bất kỳ lúc nào. Cần permission `JOB_CLOSE_PAUSE`.
 *
 * @param reason lý do tuỳ chọn, chỉ lưu vào audit log để tra cứu về sau
 */
export function pauseJob(jobId: string, reason?: string): Promise<InternalJobDetail> {
  return http.post<InternalJobDetail>(`/jobs/${jobId}/pause`, { reason: reason || undefined });
}

/**
 * UC-44 normal flow: đóng hẳn 1 Job đang `PUBLISHED` hoặc `PAUSED`.
 * `CLOSED` là trạng thái chấm dứt (BR-JOB-05) — KHÔNG có API mở lại, muốn
 * tuyển tiếp phải tạo Job Position mới (UC-12).
 *
 * @param reason lý do tuỳ chọn, chỉ lưu vào audit log để tra cứu về sau
 */
export function closeJob(jobId: string, reason?: string): Promise<InternalJobDetail> {
  return http.post<InternalJobDetail>(`/jobs/${jobId}/close`, { reason: reason || undefined });
}

/**
 * UC-44 AF-01: mở lại 1 Job đang `PAUSED` → quay thẳng về `PUBLISHED` và hiện
 * lại trên Job Board ngay. BR-JOB-05: KHÔNG cần Hiring Manager duyệt lại.
 */
export function resumeJob(jobId: string): Promise<InternalJobDetail> {
  return http.post<InternalJobDetail>(`/jobs/${jobId}/resume`);
}
