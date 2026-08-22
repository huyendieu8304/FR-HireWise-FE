import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from '@phosphor-icons/react';
import { cn } from '@/utils/cn';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: 'sm' | 'md' | 'lg';
  dismissible?: boolean;
}

const WIDTH_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-xl',
};

/**
 * Drawer trượt từ cạnh phải màn hình — dùng cho chi tiết/form theo ngữ cảnh
 * (phân quyền user, chi tiết ứng viên...) mà không muốn che hết màn hình
 * như Modal trung tâm. Cùng hành vi a11y với Modal (Esc, focus, scroll-lock).
 */
export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 'md',
  dismissible = true,
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    lastFocusedElement.current = document.activeElement as HTMLElement;
    panelRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && dismissible) {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      lastFocusedElement.current?.focus();
    };
  }, [open, dismissible, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-(--z-index-modal-backdrop) flex justify-end">
      <div
        className="fixed inset-0 bg-neutral-950/50 backdrop-blur-[2px]"
        onClick={dismissible ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'drawer-title' : undefined}
        tabIndex={-1}
        className={cn(
          'shadow-elevation-4 bg-neutral-0 relative z-(--z-index-modal) flex h-full w-full flex-col outline-none',
          WIDTH_CLASSES[width],
        )}
      >
        {(title || dismissible) && (
          <div className="flex items-start justify-between gap-4 border-b border-neutral-200 px-6 py-4">
            <div>
              {title && (
                <h2 id="drawer-title" className="text-lg font-semibold text-neutral-900">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-neutral-500">{description}</p>
              )}
            </div>
            {dismissible && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng"
                className="shrink-0 rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
              >
                <X className="size-5" />
              </button>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <div className="flex justify-end gap-3 border-t border-neutral-200 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
