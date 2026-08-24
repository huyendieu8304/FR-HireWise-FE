import type { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export type BadgeVariant =
  'neutral' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

// Semantic status colors (success/warning/danger/info) tách biệt với accent
// màu thương hiệu (primary/secondary) — dùng đúng nhóm cho đúng ý nghĩa,
// không dùng success/danger để trang trí.
const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral: 'bg-neutral-100 text-neutral-600',
  primary: 'bg-primary-50 text-primary-700',
  secondary: 'bg-secondary-100 text-secondary-700',
  success: 'bg-success-100 text-success-700',
  warning: 'bg-warning-100 text-warning-700',
  danger: 'bg-danger-100 text-danger-700',
  info: 'bg-info-100 text-info-700',
};

/**
 * Badge/pill hiển thị trạng thái hoặc nhãn ngắn (role, status, tag...).
 * Luôn dùng component này thay vì tự viết span màu rải rác, để đảm bảo
 * đúng cặp bg/text token và nhất quán bo góc (radius-full) toàn hệ thống.
 *
 * @example <Badge variant="success">Active</Badge>
 */
export function Badge({
  variant = 'neutral',
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
