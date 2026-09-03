import { CalendarCheck, CalendarSlash, CalendarX } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/Badge/Badge';
import type { BadgeVariant } from '@/components/ui/Badge/Badge';
import { Button } from '@/components/ui/Button/Button';
import { formatDateTime } from '@/utils/formatters';
import { CALENDAR_PROVIDER_LABELS } from '../types';
import type { CalendarProvider, ConnectionStatus } from '../types';

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

const STATUS_ICONS: Record<ConnectionStatus, typeof CalendarCheck> = {
  CONNECTED: CalendarCheck,
  EXPIRED: CalendarX,
  REVOKED: CalendarSlash,
};

export interface CalendarConnectionStatusCardProps {
  provider: CalendarProvider;
  status: ConnectionStatus;
  connectedAt: string | null;
  tokenExpiresAt: string | null;
  isTesting: boolean;
  isReconnecting: boolean;
  isDisconnecting: boolean;
  onTest: () => void;
  onReconnect: () => void;
  onDisconnect: () => void;
}

/**
 * Card hiển thị kết nối Calendar hiện tại (provider + trạng thái + thời điểm
 * kết nối/hết hạn) và 3 hành động: Test Connection, Reconnect (EXPIRED), Disconnect.
 */
export function CalendarConnectionStatusCard({
  provider,
  status,
  connectedAt,
  tokenExpiresAt,
  isTesting,
  isReconnecting,
  isDisconnecting,
  onTest,
  onReconnect,
  onDisconnect,
}: CalendarConnectionStatusCardProps) {
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
              {CALENDAR_PROVIDER_LABELS[provider]}
            </p>
            <p className="text-xs text-neutral-500">
              Kết nối cấp công ty (dùng chung cho toàn hệ thống)
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
          Token đã hết hạn — hệ thống tạm dừng đồng bộ lịch phỏng vấn cho tới khi
          kết nối lại. Bấm "Kết nối lại" để thực hiện lại luồng OAuth 2.0.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        {status === 'CONNECTED' && (
          <Button variant="outline" isLoading={isTesting} onClick={onTest}>
            Test Connection
          </Button>
        )}
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
