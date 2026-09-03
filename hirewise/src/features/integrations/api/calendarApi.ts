import { http } from '@/lib/apiClient';
import { toCalendarProviderPathSegment } from '../types';
import type { CalendarConnectionStatus, CalendarProvider } from '../types';

/**
 * Trạng thái kết nối Calendar hiện tại.
 * Không bao giờ 404 — "chưa kết nối" là 1 giá trị status bình thường
 * (`connected: false`). Yêu cầu quyền `INTEGRATION_MANAGE`.
 */
export function getCalendarStatus(): Promise<CalendarConnectionStatus> {
  return http.get<CalendarConnectionStatus>('/integrations/calendar');
}

interface AuthorizationUrlDto {
  authorizationUrl: string;
}

/**
 * Lấy URL mở popup OAuth cho 1 Calendar provider. KHÔNG tự điều hướng —
 * nơi gọi (page) phải tự `window.open()` URL trả về.
 */
export async function getCalendarAuthorizationUrl(
  provider: CalendarProvider,
): Promise<string> {
  const response = await http.get<AuthorizationUrlDto>(
    `/integrations/calendar/${toCalendarProviderPathSegment(provider)}/connect`,
  );
  return response.authorizationUrl;
}

/**
 * UC-18 step 4 — Test Connection: probes Calendar API với access token đang
 * lưu. Trả 409 (`CALENDAR_NOT_CONNECTED`) nếu chưa kết nối hoặc
 * connection không ở trạng thái `CONNECTED`.
 */
export function testCalendarConnection(): Promise<CalendarConnectionStatus> {
  return http.post<CalendarConnectionStatus>('/integrations/calendar/test');
}

/**
 * Disconnect. Trả 409 (`CALENDAR_NOT_CONNECTED`) nếu Calendar chưa từng
 * được kết nối — component gọi hàm này chỉ nên hiển thị nút Disconnect khi
 * `status` đang là `CONNECTED`/`EXPIRED`.
 */
export function disconnectCalendar(): Promise<CalendarConnectionStatus> {
  return http.post<CalendarConnectionStatus>('/integrations/calendar/disconnect');
}
