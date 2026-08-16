/**
 * "Toast bus" — kênh pub/sub imperative để bất kỳ đâu trong code (kể cả code
 * KHÔNG phải React component, ví dụ interceptor của axios trong apiClient.ts)
 * đều có thể bắn ra một toast, mà không cần truy cập React Context trực tiếp
 * (Context chỉ dùng được bên trong cây component).
 *
 * `ToastProvider` là nơi DUY NHẤT subscribe kênh này để render UI thật.
 * Component muốn hiện toast thì dùng hook `useNotification()`
 * (xem `src/hooks/useNotification.ts`) — hook đó cũng chỉ là lớp vỏ mỏng gọi
 * lại các hàm ở đây, giữ API nhất quán dù gọi từ component hay từ ngoài.
 */

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  title?: string;
  message: string;
  /** Thời gian tự đóng (ms). 0 = không tự đóng. */
  duration: number;
}

type ToastListener = (toast: ToastItem) => void;
type DismissListener = (id: string) => void;

const toastListeners = new Set<ToastListener>();
const dismissListeners = new Set<DismissListener>();

export function onToast(listener: ToastListener): () => void {
  toastListeners.add(listener);
  return () => toastListeners.delete(listener);
}

export function onDismissToast(listener: DismissListener): () => void {
  dismissListeners.add(listener);
  return () => dismissListeners.delete(listener);
}

function emit(
  variant: ToastVariant,
  message: string,
  options?: { title?: string; duration?: number },
) {
  const toast: ToastItem = {
    id: crypto.randomUUID(),
    variant,
    title: options?.title,
    message,
    duration: options?.duration ?? (variant === 'error' ? 6000 : 4000),
  };
  toastListeners.forEach((listener) => listener(toast));
  return toast.id;
}

export const showSuccessToast = (
  message: string,
  options?: { title?: string; duration?: number },
) => emit('success', message, options);

export const showErrorToast = (
  message: string,
  options?: { title?: string; duration?: number },
) => emit('error', message, options);

export const showWarningToast = (
  message: string,
  options?: { title?: string; duration?: number },
) => emit('warning', message, options);

export const showInfoToast = (
  message: string,
  options?: { title?: string; duration?: number },
) => emit('info', message, options);

export function dismissToast(id: string) {
  dismissListeners.forEach((listener) => listener(id));
}
