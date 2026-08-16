import { useEffect, useState } from 'react';
import {
  CheckCircle,
  Info,
  WarningCircle,
  WarningOctagon,
  X,
} from '@phosphor-icons/react';
import { cn } from '@/utils/cn';
import type { ToastItem, ToastVariant } from './toastBus';

const VARIANT_STYLES: Record<
  ToastVariant,
  { icon: typeof CheckCircle; iconClass: string; borderClass: string }
> = {
  success: {
    icon: CheckCircle,
    iconClass: 'text-success-600',
    borderClass: 'border-success-500',
  },
  error: {
    icon: WarningOctagon,
    iconClass: 'text-danger-600',
    borderClass: 'border-danger-500',
  },
  warning: {
    icon: WarningCircle,
    iconClass: 'text-warning-600',
    borderClass: 'border-warning-500',
  },
  info: {
    icon: Info,
    iconClass: 'text-info-600',
    borderClass: 'border-info-500',
  },
};

interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const [isLeaving, setIsLeaving] = useState(false);
  const { icon: Icon, iconClass, borderClass } = VARIANT_STYLES[toast.variant];

  useEffect(() => {
    if (toast.duration <= 0) return;
    const timer = setTimeout(() => handleDismiss(), toast.duration);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast.duration]);

  function handleDismiss() {
    setIsLeaving(true);
    // đợi hết animation rồi mới xóa khỏi DOM
    setTimeout(() => onDismiss(toast.id), 150);
  }

  return (
    <div
      role={toast.variant === 'error' ? 'alert' : 'status'}
      aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
      className={cn(
        'shadow-elevation-3 bg-neutral-0 pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border-l-4 p-4 transition-all duration-150',
        borderClass,
        isLeaving ? 'translate-x-2 opacity-0' : 'translate-x-0 opacity-100',
      )}
    >
      <Icon weight="fill" className={cn('mt-0.5 size-5 shrink-0', iconClass)} />
      <div className="min-w-0 flex-1">
        {toast.title && (
          <p className="text-sm font-semibold text-neutral-900">{toast.title}</p>
        )}
        <p className="text-sm text-neutral-700">{toast.message}</p>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Đóng thông báo"
        className="shrink-0 rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
