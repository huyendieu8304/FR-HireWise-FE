import { http } from '@/lib/apiClient';
import type { JobShareStats, JobShareTargets, PublishingChannelCode } from '../types';

/**
 * UC-31 bước 1-2: preview thẻ Open Graph + danh sách kênh đang bật, mỗi kênh
 * kèm sẵn `shareUrl` và `intentUrl` do backend dựng.
 *
 * Cần permission `JOB_PUBLISH` và người gọi phải là Recruiter phụ trách Job.
 * Lỗi có thể gặp: 409 `JOB_NOT_SHAREABLE` (BR-POST-01 — Job chưa Published).
 */
export function getShareTargets(jobId: string): Promise<JobShareTargets> {
  return http.get<JobShareTargets>(`/jobs/${jobId}/share-channels`);
}

/**
 * UC-31 bước 3: ghi nhận Recruiter đã bấm [Chia sẻ] cho 1 kênh.
 *
 * Popup chia sẻ là của LinkedIn/Facebook nên ta không thể biết họ có đăng
 * thật hay đóng cửa sổ — `shareCount` chỉ có nghĩa "số lần bấm nút". Chỉ số
 * phản ánh độ phủ thật là `clickCount` trong UC-32.
 *
 * Trả 204 No Content.
 */
export function recordShare(jobId: string, code: PublishingChannelCode): Promise<void> {
  return http.post<void>(`/jobs/${jobId}/share-channels/${code}/record`);
}

/**
 * UC-32: thống kê lượt chia sẻ, lượt click và số ứng viên đến từ từng kênh.
 * Chỉ cần `JOB_VIEW` (không cần là chủ Job) để Hiring Manager và HR Admin
 * cũng xem được.
 */
export function getShareStats(jobId: string): Promise<JobShareStats> {
  return http.get<JobShareStats>(`/jobs/${jobId}/share-stats`);
}

/**
 * UC-32 bước 4: yêu cầu backend gửi email tổng hợp EM-10 cho Recruiter, gọi
 * khi đóng modal chia sẻ nếu đã chia sẻ ít nhất 1 kênh.
 *
 * Backend tự bỏ qua nếu Job chưa từng được chia sẻ hoặc Recruiter không có
 * email, nên nơi gọi không cần kiểm tra trước. Trả 204 No Content.
 */
export function notifyShareSummary(jobId: string): Promise<void> {
  return http.post<void>(`/jobs/${jobId}/share-channels/notify`);
}
