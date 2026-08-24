import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { useDialog } from '@/hooks/useDialog';
import { useNotification } from '@/hooks/useNotification';
import {
  disconnectCloudStorage,
  getAuthorizationUrl,
  getCloudStorageStatus,
} from '../api/cloudStorageApi';
import { ConnectionStatusCard } from '../components/ConnectionStatusCard';
import { ProviderCard } from '../components/ProviderCard';
import {
  useCloudStorageOAuthCallback,
  useCloudStorageOAuthResultListener,
} from '../hooks/useCloudStorageOAuthCallback';
import type { CloudStorageOAuthResult } from '../hooks/useCloudStorageOAuthCallback';
import { CLOUD_STORAGE_PROVIDERS, PROVIDER_LABELS } from '../types';
import type { CloudStorageProvider } from '../types';

const STATUS_QUERY_KEY = ['cloud-storage-status'];

/** Mở popup OAuth căn giữa màn hình hiện tại. Trả `null` nếu bị trình duyệt chặn. */
function openOAuthPopup(url: string): Window | null {
  const width = 520;
  const height = 680;
  const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
  const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);
  return window.open(
    url,
    'hirewise-cloud-storage-oauth',
    `width=${width},height=${height},left=${left},top=${top}`,
  );
}

/**
 * Route này đóng vai trò KÉP: vừa là màn hình chính, vừa là nơi popup OAuth
 * "hạ cánh" sau khi backend 302 redirect về — `INTEGRATION_FRONTEND_REDIRECT_URL`
 * phía backend mặc định trỏ THẲNG vào đúng route này (xem
 * `constants/routes.ts` + `HireWise-BE/.env.example`), KHÔNG có route
 * callback riêng nào khác. Chi tiết xử lý 2 tình huống (cửa sổ chính vs.
 * popup) nằm ở `useCloudStorageOAuthCallback`.
 *
 * ⚠️ Backend chỉ hỗ trợ 1 kết nối Cloud Storage "sống" tại 1 thời điểm cho
 * toàn công ty  — vì vậy UI không cho chọn provider mới khi đang Connected/Expired, phải Disconnect trước.
 */
export function CloudStorageIntegrationPage() {
  const notify = useNotification();
  const { confirm } = useDialog();
  const queryClient = useQueryClient();
  const [pendingProvider, setPendingProvider] = useState<CloudStorageProvider | null>(
    null,
  );

  const handleOAuthResult = useCallback(
    ({ connected, provider }: CloudStorageOAuthResult) => {
      queryClient.invalidateQueries({ queryKey: STATUS_QUERY_KEY });
      const label = provider ? PROVIDER_LABELS[provider] : 'Cloud Storage';
      if (connected) {
        notify.success(`Đã kết nối ${label} thành công.`);
      } else {
        notify.error(`Kết nối ${label} không thành công. Vui lòng thử lại.`);
      }
    },
    [queryClient, notify],
  );

  // Nhánh "cửa sổ này chính là popup OAuth vừa được redirect về" — xem javadoc trên.
  const { isClosingPopup } = useCloudStorageOAuthCallback(handleOAuthResult);
  // Nhánh "cửa sổ chính lắng nghe kết quả do popup con báo về" — cả 2 hook luôn
  // được gọi cùng lúc vì component này đóng vai trò kép, không có gì bất thường
  // khi 1 trong 2 nhánh không có message nào xảy ra.
  useCloudStorageOAuthResultListener(handleOAuthResult);

  const { data, isLoading, isError } = useQuery({
    queryKey: STATUS_QUERY_KEY,
    queryFn: getCloudStorageStatus,
    // Popup sắp tự đóng ngay sau khi mount — không cần fetch trạng thái ở đây.
    enabled: !isClosingPopup,
  });

  const connectMutation = useMutation({
    mutationFn: (provider: CloudStorageProvider) => getAuthorizationUrl(provider),
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

  const disconnectMutation = useMutation({
    mutationFn: disconnectCloudStorage,
    onSuccess: (updated) => {
      queryClient.setQueryData(STATUS_QUERY_KEY, updated);
      notify.success('Đã ngắt kết nối Cloud Storage.');
    },
  });

  async function handleDisconnect() {
    const ok = await confirm({
      title: 'Ngắt kết nối Cloud Storage?',
      description:
        'Hệ thống sẽ tạm dừng mọi thao tác lưu file mới (CV, hợp đồng...) cho tới khi kết nối lại.',
      confirmLabel: 'Ngắt kết nối',
      tone: 'danger',
    });
    if (ok) disconnectMutation.mutate();
  }

  // Popup đang trong lúc báo kết quả cho cửa sổ chính rồi tự đóng — cố tình
  // KHÔNG render UI đầy đủ để tránh nháy giao diện ngay trước khi đóng.
  if (isClosingPopup) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-neutral-50">
        <p className="text-sm text-neutral-500">
          Đang hoàn tất kết nối, cửa sổ sẽ tự đóng…
        </p>
      </div>
    );
  }

  // `data.provider`/`data.status` được gom vào 1 object đã narrow non-null ngay
  // tại đây để truyền xuống `ConnectionStatusCard` (kể cả trong closure của các
  // callback onReconnect/...) mà không cần ép kiểu `!` rải rác.
  const connectedInfo =
    data && data.provider && data.status
      ? {
          provider: data.provider,
          status: data.status,
          accountLabel: data.accountLabel,
          connectedAt: data.connectedAt,
          tokenExpiresAt: data.tokenExpiresAt,
        }
      : null;

  const lastKnownProvider = data?.provider ?? null;
  // Chỉ cho chọn provider khi CHƯA từng kết nối (status null) hoặc đã bị
  // Revoked — Connected/Expired phải Disconnect trước (xem javadoc trên đầu file).
  const canPickProvider = !connectedInfo || connectedInfo.status === 'REVOKED';

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">
          Tích hợp Cloud Storage
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Kết nối OAuth 2.0 tới Google Drive hoặc Dropbox để hệ thống lưu CV/hợp đồng ứng
          viên.
        </p>
      </div>

      {isLoading && (
        <div className="shadow-elevation-1 bg-neutral-0 rounded-lg border border-neutral-200 p-5">
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {!isLoading && isError && (
        <div className="bg-neutral-0 rounded-lg border border-neutral-200 p-8 text-center text-sm text-neutral-500">
          Không thể tải trạng thái kết nối Cloud Storage. Kiểm tra lại quyền truy cập
          (INTEGRATION_MANAGE) hoặc thử tải lại trang.
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {connectedInfo && (
            <ConnectionStatusCard
              provider={connectedInfo.provider}
              status={connectedInfo.status}
              accountLabel={connectedInfo.accountLabel}
              connectedAt={connectedInfo.connectedAt}
              tokenExpiresAt={connectedInfo.tokenExpiresAt}
              isReconnecting={
                connectMutation.isPending && pendingProvider === connectedInfo.provider
              }
              isDisconnecting={disconnectMutation.isPending}
              onReconnect={() => connectMutation.mutate(connectedInfo.provider)}
              onDisconnect={handleDisconnect}
            />
          )}

          {canPickProvider && (
            <div className="flex flex-col gap-3">
              {connectedInfo?.status === 'REVOKED' && lastKnownProvider && (
                <p className="text-sm text-neutral-500">
                  Đã ngắt kết nối {PROVIDER_LABELS[lastKnownProvider]} trước đó. Chọn nhà
                  cung cấp bên dưới để kết nối lại (có thể chọn provider khác).
                </p>
              )}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {CLOUD_STORAGE_PROVIDERS.map((provider) => (
                  <ProviderCard
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
