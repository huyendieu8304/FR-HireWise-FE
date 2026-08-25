import { http } from '@/lib/apiClient';
import type { PagedResponse } from '@/types/api';
import type {
  EmploymentType,
  JobDetail,
  JobFilterOptions,
  JobSummary,
  SubmitApplicationResponse,
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

/**
 * UC-17: nộp hồ sơ ứng tuyển (multipart/form-data — 3 field text + 1 file CV).
 * `onUploadProgress` phục vụ thanh tiến trình khi upload (UC-17 "Other Information").
 *
 *  ghi đè header `Content-Type` thành `multipart/form-data` ở đây.
 * Axios (bản 1.x) sẽ tự động sinh thêm `boundary=...` chuẩn xác khi nhận diện body là FormData.
 */
export function submitApplication(
  jobId: string,
  payload: SubmitApplicationPayload,
  onUploadProgress?: (percent: number) => void,
): Promise<SubmitApplicationResponse> {
  const formData = new FormData();
  formData.append('fullName', payload.fullName);
  formData.append('email', payload.email);
  formData.append('phone', payload.phone);
  formData.append('cvFile', payload.cvFile);

  return http.post<SubmitApplicationResponse>(
    `/public/jobs/${jobId}/applications`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      // Không set `silent` — lỗi 400/404/409 (định dạng CV, job không còn
      // Published...) vốn đã KHÔNG bị apiClient tự toast (xem apiClient.ts),
      // form tự hiển thị inline; lỗi 5xx/network vẫn cần toast mặc định.
      onUploadProgress: (event) => {
        if (onUploadProgress && event.total) {
          onUploadProgress(Math.round((event.loaded * 100) / event.total));
        }
      },
    },
  );
}
