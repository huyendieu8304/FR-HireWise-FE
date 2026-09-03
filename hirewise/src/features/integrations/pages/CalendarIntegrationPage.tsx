import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { useDialog } from '@/hooks/useDialog';
import { useNotification } from '@/hooks/useNotification';
import {
  disconnectCalendar,
  getCalendarAuthorizationUrl,
  getCalendarStatus,
  testCalendarConnection,
} from '../api/calendarApi';
import { CalendarConnectionStatusCard } from '../components/CalendarConnectionStatusCard';
import { CalendarProviderCard } from '../components/CalendarProviderCard';
import {
  useCalendarOAuthCallback,
  useCalendarOAuthResultListener,
} from '../hooks/useCalendarOAuthCallback';
import type { CalendarOAuthResult } from '../hooks/useCalendarOAuthCallback';
import { CALENDAR_PROVIDER_LABELS, CALENDAR_PROVIDERS } from '../types';
import type { CalendarProvider } from '../types';

const STATUS_QUERY_KEY = ['calendar-status'];

/** Mở popup OAuth căn giữa màn hình hiện tại. Trả `null` nếu bị trình duyệt chặn. */
function openOAuthPopup(url: string): Window | null {
  const width = 520;
  const height = 680;
  const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
  const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);
  return window.open(
    url,
    'hirewise-calendar-oauth',
    `width=${width},height=${height},left=${left},top=${top}`,
  );
}

/**
 * UC-18 — Trang cấu hình Calendar API. Đóng vai trò KÉP: vừa là màn hình
 * chính, vừa là nơi popup OAuth "hạ cánh" sau khi backend 302 redirect về
 * (`CALENDAR_FRONTEND_REDIRECT_URL` phía backend trỏ đúng vào route này).
 *
 * ⚠️ Backend chỉ hỗ trợ 1 kết nối Calendar "sống" tại 1 thời điểm cho
 * toàn công ty — UI không cho chọn provider mới khi đang Connected/Expired,
 * phải Disconnect trước.
 */
export function CalendarIntegrationPage() {
  const notify = useNotification();
  const { confirm } = useDialog();
  const queryClient = useQueryClient();
  const [pendingProvider, setPendingProvider] = useState<CalendarProvider | null>(null);

  const handleOAuthResult = useCallback(
    ({ connected, provider }: CalendarOAuthResult) => {
      queryClient.invalidateQueries({ queryKey: STATUS_QUERY_KEY });
      const label = provider ? CALENDAR_PROVIDER_LABELS[provider] : 'Calendar';
      if (connected) {
        notify.success(`Đã kết nối ${label} thành công.`);
      } else {
        notify.error(`Kết nối ${label} không thành công. Vui lòng thử lại.`);
      }
    },
    [queryClient, notify],
  );

  // Nhánh "cửa sổ này chính là popup OAuth vừa được redirect về".
  const { isClosingPopup } = useCalendarOAuthCallback(handleOAuthResult);
  // Nhánh "cửa sổ chính lắng nghe kết quả do popup con báo về".
  useCalendarOAuthResultListener(handleOAuthResult);

  const { data, isLoading, isError } = useQuery({
    queryKey: STATUS_QUERY_KEY,
    queryFn: getCalendarStatus,
    // Popup sắp tự đóng ngay sau khi mount — không cần fetch trạng thái ở đây.
    enabled: !isClosingPopup,
  });

  const connectMutation = useMutation({
    mutationFn: (provider: CalendarProvider) => getCalendarAuthorizationUrl(provider),
    onMutate: (provider) => setPendingProvider(provider),
    onSuccess: (authorizationUrl) => {
      const popup = openOAuthPopup(authorizationUrl);
      if (!popup) {
        notify.error(
          'Trình duyệt đã chặn cửa sổ popup. Vui lòng cho phép popup cho trang này rồi thử lại.',
        );
      }
    },
    onSettled: () => setPendingProvider(null),
  });

  const testMutation = useMutation({
    mutationFn: testCalendarConnection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STATUS_QUERY_KEY });
      notify.success('Kết nối Calendar API hoạt động tốt.');
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: disconnectCalendar,
    onSuccess: (updated) => {
      queryClient.setQueryData(STATUS_QUERY_KEY, updated);
      notify.success('Đã ngắt kết nối Calendar.');
    },
  });

  async function handleDisconnect() {
    const ok = await confirm({
      title: 'Ngắt kết nối Calendar?',
      description:
        'Hệ thống sẽ tạm dừng đồng bộ lịch phỏng vấn cho tới khi kết nối lại.',
      confirmLabel: 'Ngắt kết nối',
      tone: 'danger',
    });
    if (ok) disconnectMutation.mutate();
  }

  // Popup đang trong lúc báo kết quả rồi tự đóng — không render UI đầy đủ.
  if (isClosingPopup) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-neutral-50">
        <p className="text-sm text-neutral-500">
          Đang hoàn tất kết nối, cửa sổ sẽ tự đóng…
        </p>
      </div>
    );
  }

  // Gom thông tin kết nối hiện tại để tránh ép kiểu `!` rải rác.
  const connectedInfo =
    data && data.provider && data.status
      ? {
          provider: data.provider,
          status: data.status,
          connectedAt: data.connectedAt,
          tokenExpiresAt: data.tokenExpiresAt,
        }
      : null;

  const lastKnownProvider = data?.provider ?? null;
  // Chỉ cho chọn provider khi CHƯA từng kết nối (status null) hoặc đã Revoked.
  const canPickProvider = !connectedInfo || connectedInfo.status === 'REVOKED';

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">
          Tích hợp Calendar API
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Kết nối OAuth 2.0 tới Google Calendar hoặc Outlook Calendar để hệ
          thống tự động đồng bộ lịch phỏng vấn (UC-24/25/26).
        </p>
      </div>

      {isLoading && (
        <div className="shadow-elevation-1 bg-neutral-0 rounded-lg border border-neutral-200 p-5">
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {!isLoading && isError && (
        <div className="bg-neutral-0 rounded-lg border border-neutral-200 p-8 text-center text-sm text-neutral-500">
          Không thể tải trạng thái kết nối Calendar. Kiểm tra lại quyền truy cập
          (INTEGRATION_MANAGE) hoặc thử tải lại trang.
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {connectedInfo && (
            <CalendarConnectionStatusCard
              provider={connectedInfo.provider}
              status={connectedInfo.status}
              connectedAt={connectedInfo.connectedAt}
              tokenExpiresAt={connectedInfo.tokenExpiresAt}
              isTesting={testMutation.isPending}
              isReconnecting={
                connectMutation.isPending && pendingProvider === connectedInfo.provider
              }
              isDisconnecting={disconnectMutation.isPending}
              onTest={() => testMutation.mutate()}
              onReconnect={() => connectMutation.mutate(connectedInfo.provider)}
              onDisconnect={handleDisconnect}
            />
          )}

          {canPickProvider && (
            <div className="flex flex-col gap-3">
              {connectedInfo?.status === 'REVOKED' && lastKnownProvider && (
                <p className="text-sm text-neutral-500">
                  Đã ngắt kết nối {CALENDAR_PROVIDER_LABELS[lastKnownProvider]} trước
                  đó. Chọn provider bên dưới để kết nối lại (có thể chọn provider khác).
                </p>
              )}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {CALENDAR_PROVIDERS.map((provider) => (
                  <CalendarProviderCard
                    key={provider}
                    provider={provider}
                    isLoading={connectMutation.isPending && pendingProvider === provider}
                    onConnect={() => connectMutation.mutate(provider)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
