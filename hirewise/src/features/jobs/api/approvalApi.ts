import { http } from '@/lib/apiClient';
import type { PagedResponse } from '@/types/api';
import type { JobApprovalDetail, PendingApprovalJobSummary, RejectJobPayload } from '../types';

export interface ListPendingApprovalsParams {
  status?: string;
  page?: number;
  size?: number;
}

/**
 * UC-14: Lấy danh sách Job Position trong phạm vi phòng ban (access scope)
 * của Hiring Manager đang đăng nhập, có thể lọc theo trạng thái (PENDING_APPROVAL, APPROVED, REJECTED...).
 *
 * @param params tham số phân trang & lọc trạng thái
 */
export function listPendingApprovals(
  params: ListPendingApprovalsParams = {},
): Promise<PagedResponse<PendingApprovalJobSummary>> {
  return http.get<PagedResponse<PendingApprovalJobSummary>>('/job-approvals/pending', {
    params: {
      status: params.status || undefined,
      page: params.page ?? 0,
      size: params.size ?? 20,
    },
  });
}


/**
 * UC-15 (Normal Flow - Bước 1): Lấy chi tiết đầy đủ của một Job Position đang chờ duyệt.
 *
 * @param jobId UUID của Job Position
 */
export function getJobApprovalDetail(jobId: string): Promise<JobApprovalDetail> {
  return http.get<JobApprovalDetail>(`/job-approvals/${jobId}`);
}

/**
 * UC-15 (Normal Flow - Bước 2 & 3): Phê duyệt Job Position (status -> APPROVED).
 * Gửi email EM-03 thông báo tới Recruiter.
 *
 * @param jobId UUID của Job Position
 */
export function approveJob(jobId: string): Promise<void> {
  return http.post<void>(`/job-approvals/${jobId}/approve`);
}

/**
 * UC-15 (AF-01): Từ chối Job Position kèm lý do (status -> REJECTED).
 * Gửi email EM-03 kèm lý do tới Recruiter.
 *
 * @param jobId UUID của Job Position
 * @param payload Lý do từ chối (bắt buộc, >= 10 ký tự)
 */
export function rejectJob(jobId: string, payload: RejectJobPayload): Promise<void> {
  return http.post<void>(`/job-approvals/${jobId}/reject`, payload);
}

