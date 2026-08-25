import { http } from '@/lib/apiClient';
import type { PagedResponse } from '@/types/api';
import type { PendingApprovalJobSummary } from '../types';

export interface ListPendingApprovalsParams {
  page?: number;
  size?: number;
}

/**
 * UC-14: Lấy danh sách Job Position đang ở trạng thái `PENDING_APPROVAL`
 * trong phạm vi phòng ban (access scope) của Hiring Manager đang đăng nhập.
 *
 * - Yêu cầu quyền `JOB_APPROVE` (Bearer token của Hiring Manager).
 * - Trả `PagedResponse<PendingApprovalJobSummary>` — khi rỗng thì
 *   `content: []` và `totalElements: 0` (EX-01 theo đặc tả).
 *
 * @param params tham số phân trang (mặc định page 0, size 20)
 */
export function listPendingApprovals(
  params: ListPendingApprovalsParams = {},
): Promise<PagedResponse<PendingApprovalJobSummary>> {
  return http.get<PagedResponse<PendingApprovalJobSummary>>('/job-approvals/pending', {
    params: {
      page: params.page ?? 0,
      size: params.size ?? 20,
    },
  });
}
