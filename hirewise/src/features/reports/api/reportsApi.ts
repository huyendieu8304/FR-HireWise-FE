import { http } from '@/lib/apiClient';
import type { PipelineVelocityReport, ReportFilterValue, SourceRoiReport } from '../types';

/**
 * Query param chung của cả 4 endpoint báo cáo (BR-RPT-03). Giá trị rỗng được
 * bỏ hẳn khỏi request thay vì gửi chuỗi rỗng, để backend áp mặc định của nó
 * (90 ngày gần nhất, mọi phòng ban trong access scope).
 */
export interface ReportQueryParams {
  fromDate?: string;
  toDate?: string;
  departmentId?: number;
  jobPositionId?: string;
}

/** Chuyển giá trị của bộ lọc trên UI thành query param gửi lên backend. */
export function toReportQueryParams(filter: ReportFilterValue): ReportQueryParams {
  return {
    fromDate: filter.fromDate || undefined,
    toDate: filter.toDate || undefined,
    departmentId: filter.departmentId ? Number(filter.departmentId) : undefined,
    jobPositionId: filter.jobPositionId || undefined,
  };
}

/**
 * UC-42: tỷ trọng ứng viên, tỷ lệ trúng tuyển và lưu lượng theo từng nguồn.
 *
 * Bộ lọc không khớp gì vẫn trả 200 với `rows: []` (EX-01 / ME-37) — đừng bắt
 * như lỗi ở đây, hãy render empty state.
 */
export function getSourceRoiReport(params: ReportQueryParams): Promise<SourceRoiReport> {
  return http.get<SourceRoiReport>('/reports/source-roi', { params });
}

/** UC-43: thời gian trung bình/trung vị/P90 ở từng Stage cùng điểm nghẽn. */
export function getPipelineVelocityReport(
  params: ReportQueryParams,
): Promise<PipelineVelocityReport> {
  return http.get<PipelineVelocityReport>('/reports/pipeline-velocity', { params });
}

/**
 * UC-42 normal flow bước 4 (BR-RPT-03): tải bảng Source ROI dưới dạng .xlsx.
 *
 * Backend có đặt tên file trong header `Content-Disposition`, nhưng response
 * interceptor của `apiClient` trả thẳng `response.data` nên header không đọc
 * được qua `http.*`. Vì vậy nơi gọi tự đặt tên file (xem `ExportXlsxButton`) —
 * đổi chỗ đó dễ hơn nhiều so với việc phá vỡ quy ước "mọi call đi qua http.*".
 */
export function downloadSourceRoiXlsx(params: ReportQueryParams): Promise<Blob> {
  return http.get<Blob>('/reports/source-roi/export', { params, responseType: 'blob' });
}

/** UC-43 (BR-RPT-03): tải bảng Pipeline Velocity dưới dạng .xlsx. */
export function downloadPipelineVelocityXlsx(params: ReportQueryParams): Promise<Blob> {
  return http.get<Blob>('/reports/pipeline-velocity/export', { params, responseType: 'blob' });
}
