import { CloudCheck, CloudSlash, CloudWarning } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/Badge/Badge';
import type { BadgeVariant } from '@/components/ui/Badge/Badge';
import { Button } from '@/components/ui/Button/Button';
import { formatDateTime } from '@/utils/formatters';
import { PROVIDER_LABELS } from '../types';
import type { CloudStorageProvider, ConnectionStatus } from '../types';

const STATUS_BADGE_VARIANT: Record<ConnectionStatus, BadgeVariant> = {
  CONNECTED: 'success',
  EXPIRED: 'danger',
  REVOKED: 'neutral',
};

const STATUS_LABELS: Record<ConnectionStatus, string> = {
  CONNECTED: 'Đã kết nối',
  EXPIRED: 'Token hết hạn',
  REVOKED: 'Đã ngắt kết nối',
};

const STATUS_ICONS: Record<ConnectionStatus, typeof CloudCheck> = {
  CONNECTED: CloudCheck,
  EXPIRED: CloudWarning,
  REVOKED: CloudSlash,
};

export interface ConnectionStatusCardProps {
  provider: CloudStorageProvider;
  status: ConnectionStatus;
  accountLabel: string | null;
  connectedAt: string | null;
  tokenExpiresAt: string | null;
  isReconnecting: boolean;
  isDisconnecting: boolean;
  onReconnect: () => void;
  onDisconnect: () => void;
}

/**
 * card hiển thị kết nối Cloud Storage hiện tại (provider + trạng thái + thời điểm kết nối/hết hạn)
 * và 2 hành động Reconnect (chỉ khi `EXPIRED`)/Disconnect.
 */
export function ConnectionStatusCard({
  provider,
  status,
  accountLabel,
  connectedAt,
  tokenExpiresAt,
  isReconnecting,
  isDisconnecting,
  onReconnect,
  onDisconnect,
}: ConnectionStatusCardProps) {
  const StatusIcon = STATUS_ICONS[status];

  return (
    <div className="shadow-elevation-1 bg-neutral-0 flex flex-col gap-4 rounded-lg border border-neutral-200 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="bg-primary-50 text-primary-700 flex size-10 shrink-0 items-center justify-center rounded-lg">
            <StatusIcon className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-neutral-900">
              {PROVIDER_LABELS[provider]}
            </p>
            {/* accountLabel hiện luôn null (BE chưa set) — xem ghi chú trong types.ts */}
            <p className="text-xs text-neutral-500">
              {accountLabel ?? 'Kết nối cấp công ty (dùng chung cho toàn hệ thống)'}
            </p>
          </div>
        </div>
        <Badge variant={STATUS_BADGE_VARIANT[status]}>{STATUS_LABELS[status]}</Badge>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs text-neutral-400">Kết nối lúc</dt>
          <dd className="text-neutral-700">
            {connectedAt ? formatDateTime(connectedAt) : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-400">Token hết hạn</dt>
          <dd className="text-neutral-700">
            {tokenExpiresAt ? formatDateTime(tokenExpiresAt) : '—'}
          </dd>
        </div>
      </dl>

      {status === 'EXPIRED' && (
        <p className="bg-danger-50 text-danger-700 rounded-md px-3 py-2 text-sm">
          Token đã hết hạn — hệ thống tạm dừng lưu file mới cho tới khi kết nối lại. Bấm
          "Kết nối lại" để thực hiện lại luồng OAuth 2.0.
        </p>
      )}

      <div className="flex gap-3">
        {status === 'EXPIRED' && (
          <Button isLoading={isReconnecting} onClick={onReconnect}>
            Kết nối lại
          </Button>
        )}
        <Button variant="danger" isLoading={isDisconnecting} onClick={onDisconnect}>
          Ngắt kết nối
        </Button>
      </div>
    </div>
  );
}
