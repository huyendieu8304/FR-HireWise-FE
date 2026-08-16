import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { onDismissToast, onToast, type ToastItem } from './toastBus';
import { Toast } from './Toast';

/**
 * Đặt DUY NHẤT MỘT LẦN ở gốc app (xem `src/app/AppProviders.tsx`).
 * Subscribe kênh `toastBus` và render toàn bộ toast đang active vào một
 * portal cố định góc màn hình.
 */
export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsubscribeShow = onToast((toast) => {
      setToasts((prev) => [...prev, toast]);
    });
    const unsubscribeDismiss = onDismissToast((id) => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    });
    return () => {
      unsubscribeShow();
      unsubscribeDismiss();
    };
  }, []);

  function handleDismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return createPortal(
    <div
      className="pointer-events-none fixed top-4 right-4 z-(--z-index-toast) flex w-full max-w-sm flex-col gap-2"
      aria-label="Thông báo hệ thống"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={handleDismiss} />
      ))}
    </div>,
    document.body,
  );
}
