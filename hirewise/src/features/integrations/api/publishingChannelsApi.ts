import { http } from '@/lib/apiClient';
import type { PublishingChannel, PublishingChannelCode } from '../types';

/**
 * UC-19 bước 1: toàn bộ kênh chia sẻ, KỂ CẢ kênh đã tắt — màn hình cài đặt
 * cần một công tắc cho từng kênh. Yêu cầu quyền `INTEGRATION_MANAGE`.
 *
 * Không bao giờ 404: 4 kênh được seed sẵn ở migration `V39`.
 */
export function listPublishingChannels(): Promise<PublishingChannel[]> {
  return http.get<PublishingChannel[]>('/settings/publishing-channels');
}

export interface UpdatePublishingChannelPayload {
  enabled: boolean;
  /** Chỉ nhận `[a-z0-9_-]`, backend validate bằng `@Pattern`. */
  utmSource: string;
}

/**
 * UC-19 bước 2: bật/tắt kênh và sửa `utm_source`.
 *
 * Lưu ý: đổi `utm_source` KHÔNG viết lại lịch sử — hồ sơ đã nộp dưới giá trị
 * cũ giữ nguyên giá trị đó, nên sẽ không còn được tính vào kênh này trong
 * thống kê UC-32. Đây là cố ý, để không làm sai nguồn thật của ứng viên.
 */
export function updatePublishingChannel(
  code: PublishingChannelCode,
  payload: UpdatePublishingChannelPayload,
): Promise<PublishingChannel> {
  return http.patch<PublishingChannel>(`/settings/publishing-channels/${code}`, payload);
}
