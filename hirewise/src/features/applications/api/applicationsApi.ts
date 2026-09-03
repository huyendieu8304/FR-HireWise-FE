import { http } from '@/lib/apiClient';
import type {
  AiScreeningResult,
  ApplicationDetail,
  ApplicationRejection,
  RejectApplicationRequest,
  RejectionReason,
} from '../types';

/** UC-20: chi tiết đầy đủ 1 Application (Applicant Card) — hồ sơ, file đính kèm, dòng thời gian Stage, bản ghi từ chối (nếu có). */
export function getApplicationDetail(applicationId: string): Promise<ApplicationDetail> {
  return http.get<ApplicationDetail>(`/applications/${applicationId}`);
}

/** UC-29 step 1: danh mục lý do từ chối chuẩn hóa (BR-REJ-01) cho dropdown. */
export function listRejectionReasons(): Promise<RejectionReason[]> {
  return http.get<RejectionReason[]>('/rejection-reasons');
}

/**
 * UC-29 main flow: từ chối 1 Application — backend tự chuyển sang Stage
 * Terminal-Rejected, ghi lịch sử (BR-KANBAN-01), lưu bản ghi từ chối
 * (BR-REJ-01/03) và gửi email tự động (UC-30, BR-REJ-02).
 */
export function rejectApplication(
  applicationId: string,
  request: RejectApplicationRequest,
): Promise<ApplicationRejection> {
  return http.post<ApplicationRejection>(`/applications/${applicationId}/reject`, request);
}

/** UC-20 file view: lấy URL để xem/tải file đính kèm của ứng viên từ Cloud Storage. */
export function getApplicationFileViewUrl(applicationId: string, fileId: number): Promise<{ viewUrl: string }> {
  return http.get<{ viewUrl: string }>(`/applications/${applicationId}/files/${fileId}/view-url`);
}

/** UC-20 file download: proxy tải nội dung file từ backend. */
export function downloadApplicationFile(applicationId: string, fileId: number): Promise<Blob> {
  return http.get<Blob>(`/applications/${applicationId}/files/${fileId}/download`, {
    responseType: 'blob',
  });
}

/**
 * UC-21 main flow: AI Screening Run mới nhất của Application — `null` nếu
 * chưa từng có run nào (chưa phải lỗi, chỉ là "chưa có phân tích AI").
 */
export function getAiScreeningResult(applicationId: string): Promise<AiScreeningResult | null> {
  return http.get<AiScreeningResult | null>(`/applications/${applicationId}/ai-screening`);
}

/** UC-21 AF-01: yêu cầu chạy lại AI Screening — queue 1 run mới, không chờ kết quả (202 Accepted). */
export function runAiScreening(applicationId: string): Promise<void> {
  return http.post<void>(`/applications/${applicationId}/ai-screening/run`);
}
