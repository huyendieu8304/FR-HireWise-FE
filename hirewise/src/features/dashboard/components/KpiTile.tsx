import type { ReactNode } from 'react';
import { TrendDown, TrendUp } from '@phosphor-icons/react';
import { cn } from '@/utils/cn';

export interface KpiTileProps {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  iconVariant?: 'primary' | 'success' | 'danger' | 'secondary';
  trend?: { direction: 'up' | 'down'; label: string };
  alert?: boolean;
}

const ICON_BG: Record<NonNullable<KpiTileProps['iconVariant']>, string> = {
  primary: 'bg-primary-50 text-primary-600',
  success: 'bg-success-50 text-success-600',
  danger: 'bg-danger-100 text-danger-700',
  secondary: 'bg-secondary-100 text-secondary-700',
};

/** 1 ô số liệu tổng quan trên Dashboard — encode trạng thái bằng màu + icon, không chỉ bằng số. */
export function KpiTile({
  label,
  value,
  icon,
  iconVariant = 'primary',
  trend,
  alert,
}: KpiTileProps) {
  return (
    <div
      className={cn(
        'shadow-elevation-1 flex flex-col gap-2.5 rounded-lg border p-4',
        alert ? 'border-danger-100 bg-danger-50' : 'bg-neutral-0 border-neutral-200',
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'text-xs font-medium',
            alert ? 'text-danger-700' : 'text-neutral-500',
          )}
        >
          {label}
        </span>
        <span
          className={cn(
            'flex size-7 items-center justify-center rounded-md',
            ICON_BG[iconVariant],
          )}
        >
          {icon}
        </span>
      </div>
      <div
        className={cn(
          'text-2xl font-bold tabular-nums',
          alert ? 'text-danger-700' : 'text-neutral-900',
        )}
      >
        {value}
      </div>
      {trend && (
        <div
          className={cn(
            'flex items-center gap-1 text-xs font-medium',
            trend.direction === 'up' ? 'text-success-700' : 'text-danger-600',
          )}
        >
          {trend.direction === 'up' ? (
            <TrendUp className="size-3.5" />
          ) : (
            <TrendDown className="size-3.5" />
          )}
          {trend.label}
        </div>
      )}
    </div>
  );
}
