/** Khớp `IntegrationProvider.java` — 2 provider Cloud Storage hỗ trợ (UC-07/UC-08). */
export type CloudStorageProvider = 'GOOGLE_DRIVE' | 'DROPBOX';

export const CLOUD_STORAGE_PROVIDERS: CloudStorageProvider[] = [
  'GOOGLE_DRIVE',
  'DROPBOX',
];

export const PROVIDER_LABELS: Record<CloudStorageProvider, string> = {
  GOOGLE_DRIVE: 'Google Drive',
  DROPBOX: 'Dropbox',
};

/**
 * Sinh path segment kebab-case dùng trong URL
 * `/api/integrations/cloud-storage/{provider}/...` — PHẢI khớp
 * `IntegrationProvider.toPathSegment()` phía backend (vd `GOOGLE_DRIVE` ->
 * `"google-drive"`).
 */
export function toProviderPathSegment(provider: CloudStorageProvider): string {
  return provider.toLowerCase().replace(/_/g, '-');
}

/**
 * Chiều ngược lại — parse path segment nhận được từ query param `provider`
 * khi backend redirect callback về frontend (xem
 * `CloudStorageIntegrationController.callback`, dùng lại đúng path segment
 * gốc chứ KHÔNG convert qua enum). Trả `null` nếu không khớp provider nào
 * (không nên xảy ra trong luồng bình thường).
 */
export function fromProviderPathSegment(
  pathSegment: string | null,
): CloudStorageProvider | null {
  if (!pathSegment) return null;
  return (
    CLOUD_STORAGE_PROVIDERS.find(
      (provider) => toProviderPathSegment(provider) === pathSegment,
    ) ?? null
  );
}

/**
 * Khớp `ConnectionStatus.java`. `null` (ở `StorageConnectionStatusResponseDto.status`)
 * nghĩa là chưa từng kết nối lần nào — FE coi như tương đương "chưa kết nối".
 */
export type ConnectionStatus = 'CONNECTED' | 'EXPIRED' | 'REVOKED';

/**
 * Khớp `StorageConnectionStatusResponseDto` — trả về từ
 * `GET /api/integrations/cloud-storage` (không bao giờ 404, "chưa kết nối"
 * là 1 giá trị status bình thường: `connected=false`, các field còn lại `null`).
 *
 * ⚠️ `accountLabel` hiện LUÔN `null`. UI vẫn render field
 * này đúng chuẩn, chỉ chưa có dữ liệu để hiển thị cho tới khi BE bổ sung.
 */
export interface StorageConnectionStatus {
  connected: boolean;
  provider: CloudStorageProvider | null;
  status: ConnectionStatus | null;
  accountLabel: string | null;
  rootFolderId: string | null;
  connectedAt: string | null;
  tokenExpiresAt: string | null;
}

// ============================================================
// UC-18: Calendar Integration types
// ============================================================

/** Khớp `IntegrationProvider.java` — 2 provider Calendar hỗ trợ (UC-18). */
export type CalendarProvider = 'GOOGLE_CALENDAR' | 'OUTLOOK_CALENDAR';

export const CALENDAR_PROVIDERS: CalendarProvider[] = [
  'GOOGLE_CALENDAR',
  'OUTLOOK_CALENDAR',
];

export const CALENDAR_PROVIDER_LABELS: Record<CalendarProvider, string> = {
  GOOGLE_CALENDAR: 'Google Calendar',
  OUTLOOK_CALENDAR: 'Outlook Calendar',
};

/** Description shown on each Calendar provider card. */
export const CALENDAR_PROVIDER_DESCRIPTIONS: Record<CalendarProvider, string> = {
  GOOGLE_CALENDAR: 'Đồng bộ lịch phỏng vấn với Google Calendar của tổ chức.',
  OUTLOOK_CALENDAR: 'Đồng bộ lịch phỏng vấn với Outlook Calendar qua Microsoft 365.',
};

/**
 * Sinh path segment kebab-case dùng trong URL
 * `/api/integrations/calendar/{provider}/...` — PHẢI khớp
 * `IntegrationProvider.toPathSegment()` phía backend.
 */
export function toCalendarProviderPathSegment(provider: CalendarProvider): string {
  return provider.toLowerCase().replace(/_/g, '-');
}

/**
 * Parse path segment từ query param `provider` khi backend redirect về.
 * Trả `null` nếu không khớp provider Calendar nào.
 */
export function fromCalendarProviderPathSegment(
  pathSegment: string | null,
): CalendarProvider | null {
  if (!pathSegment) return null;
  return (
    CALENDAR_PROVIDERS.find(
      (p) => toCalendarProviderPathSegment(p) === pathSegment,
    ) ?? null
  );
}

/**
 * Khớp `CalendarConnectionStatusResponseDto` — trả về từ
 * `GET /api/integrations/calendar`. Không bao giờ 404; "chưa kết nối"
 * là 1 giá trị status bình thường: `connected=false`, các field còn lại `null`.
 */
export interface CalendarConnectionStatus {
  connected: boolean;
  provider: CalendarProvider | null;
  status: ConnectionStatus | null;
  connectedAt: string | null;
  tokenExpiresAt: string | null;
}

