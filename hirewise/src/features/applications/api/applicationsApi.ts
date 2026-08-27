import { http } from '@/lib/apiClient';
import type {
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
