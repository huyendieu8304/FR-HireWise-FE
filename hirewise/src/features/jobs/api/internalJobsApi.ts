import { http } from '@/lib/apiClient';
import type { PagedResponse } from '@/types/api';
import type { InternalJobDetail, InternalJobSummary, JobPositionStatus } from '../types';

export interface ListInternalJobsParams {
  page?: number;
  size?: number;
  departmentId?: number;
  status?: JobPositionStatus;
}

/**
 * "Vị trí tuyển dụng": danh sách mọi Job Position trong phạm vi truy cập
 * (Access Scope) của Recruiter/Hiring Manager hiện tại, có thể lọc
 * theo phòng ban và trạng thái — khác `listPublicJobs` (chỉ Job đã Published,
 * không cần đăng nhập) và `listPendingApprovals` (chỉ dành cho Hiring
 * Manager với quyền JOB_APPROVE).
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
    },
  });
}

/** Chi tiết đầy đủ 1 Job Position — dùng cho tab "Mô tả chi tiết". */
export function getInternalJobDetail(jobId: string): Promise<InternalJobDetail> {
  return http.get<InternalJobDetail>(`/jobs/${jobId}`);
}
