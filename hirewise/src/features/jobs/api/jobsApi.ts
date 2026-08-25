import { http } from '@/lib/apiClient';
import type { PagedResponse } from '@/types/api';
import type {
  EmploymentType,
  JobDetail,
  JobFilterOptions,
  JobSummary,
} from '../types';

export interface ListPublicJobsParams {
  page?: number;
  size?: number;
  departmentId?: number;
  employmentType?: EmploymentType;
  keyword?: string;
}

/** UC-16 bước 2-3: danh sách Job đang Published trên trang tuyển dụng công khai — không cần đăng nhập. */
export function listPublicJobs(
  params: ListPublicJobsParams = {},
): Promise<PagedResponse<JobSummary>> {
  return http.get<PagedResponse<JobSummary>>('/public/jobs', {
    params: {
      page: params.page ?? 0,
      size: params.size ?? 10,
      departmentId: params.departmentId,
      employmentType: params.employmentType,
      keyword: params.keyword || undefined,
    },
  });
}

/** UC-16 REF 2: options cho bộ lọc (Phòng ban đang có job Published + danh sách Loại hình). */
export function getJobFilterOptions(): Promise<JobFilterOptions> {
  return http.get<JobFilterOptions>('/public/jobs/filter-options');
}

/** UC-16 bước 4: chi tiết JD đầy đủ của 1 job đang Published (404 nếu không tồn tại/chưa Published). */
export function getPublicJobDetail(jobId: string): Promise<JobDetail> {
  return http.get<JobDetail>(`/public/jobs/${jobId}`);
}

export interface SubmitApplicationPayload {
  fullName: string;
  email: string;
  phone: string;
  cvFile: File;
}

