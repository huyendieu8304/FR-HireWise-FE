import { http } from '@/lib/apiClient';

/** Khớp `SlaAlertResponseDto` (backend). */
export interface SlaAlert {
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  stageName: string;
  /** Số giờ đã vượt quá ngưỡng SLA của Stage — số nguyên giờ, không phải ngày. */
  hoursOverdue: number;
}

/**
 * US-MGR-05 (UC-41, SLA Monitoring): mọi hồ sơ đang vi phạm SLA mà người
 * dùng hiện tại được phép xem (BR-RPT-02, dùng chung access scope với
 * Reports UC-42/43) — luôn phản ánh trạng thái HIỆN TẠI, kể cả những hồ sơ
 * đã có email cảnh báo gửi rồi (email chỉ gửi 1 lần/lượt ở Stage, danh sách
 * này thì không tự ẩn đi sau đó).
 */
export function getSlaAlerts(): Promise<SlaAlert[]> {
  return http.get<SlaAlert[]>('/sla-alerts');
}
