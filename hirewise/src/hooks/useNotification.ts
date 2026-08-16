import { useCallback } from 'react';
import {
  showErrorToast,
  showInfoToast,
  showSuccessToast,
  showWarningToast,
} from '@/components/ui/Toast/toastBus';
import { AppError } from '@/types/api';

export interface NotifyOptions {
  title?: string;
  duration?: number;
}

/**
 * Hook chuẩn để component chủ động bắn thông báo hệ thống.
 *
 * @example
 * const notify = useNotification();
 * notify.success('Đã lưu tin tuyển dụng thành công');
 * notify.error(err); // nhận thẳng AppError, tự lấy message
 */
export function useNotification() {
  const success = useCallback(
    (message: string, options?: NotifyOptions) => showSuccessToast(message, options),
    [],
  );

  const error = useCallback(
    (messageOrError: string | AppError | unknown, options?: NotifyOptions) => {
      const message =
        messageOrError instanceof AppError
          ? messageOrError.message
          : typeof messageOrError === 'string'
            ? messageOrError
            : 'Đã xảy ra lỗi không xác định.';
      return showErrorToast(message, options);
    },
    [],
  );

  const warning = useCallback(
    (message: string, options?: NotifyOptions) => showWarningToast(message, options),
    [],
  );

  const info = useCallback(
    (message: string, options?: NotifyOptions) => showInfoToast(message, options),
    [],
  );

  return { success, error, warning, info };
}
