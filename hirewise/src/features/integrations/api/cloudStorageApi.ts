import { http } from '@/lib/apiClient';
import { toProviderPathSegment } from '../types';
import type { CloudStorageProvider, StorageConnectionStatus } from '../types';

/**
  * trạng thái kết nối Cloud Storage hiện tại.
 * Không bao giờ 404 — "chưa kết nối" là 1 giá trị status bình thường (`connected: false`).
 * Yêu cầu quyền `INTEGRATION_MANAGE` (403 nếu không đủ quyền, đã được `apiClient` tự toast).
 */
export function getCloudStorageStatus(): Promise<StorageConnectionStatus> {
  return http.get<StorageConnectionStatus>('/integrations/cloud-storage');
}

interface AuthorizationUrlDto {
  authorizationUrl: string;
}

/**
 * lấy URL mở popup OAuth cho 1 provider. Gọi bằng `http` bình thường (có Bearer token) — KHÔNG tự
 * điều hướng trình duyệt tới URL này, nơi gọi (page) phải tự `window.open()` URL trả về
 */
export async function getAuthorizationUrl(
  provider: CloudStorageProvider,
): Promise<string> {
  const response = await http.get<AuthorizationUrlDto>(
    `/integrations/cloud-storage/${toProviderPathSegment(provider)}/connect`,
  );
  return response.authorizationUrl;
}

/**
 * (Disconnect). Trả 409 (`INTEGRATION_NOT_CONNECTED`) nếu Cloud
 * Storage chưa từng được kết nối — component gọi hàm này chỉ nên hiển thị
 * nút Disconnect khi `status` đang là `CONNECTED`/`EXPIRED` để tránh rơi vào
 * trường hợp đó (xem `CloudStorageIntegrationPage`).
 */
export function disconnectCloudStorage(): Promise<StorageConnectionStatus> {
  return http.post<StorageConnectionStatus>('/integrations/cloud-storage/disconnect');
}
