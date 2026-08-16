import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { RouterProvider } from 'react-router-dom';
import { queryClient } from '@/lib/queryClient';
import { ToastProvider } from '@/components/ui/Toast/ToastProvider';
import { DialogProvider } from '@/components/ui/ConfirmDialog/DialogProvider';
import { ErrorBoundary } from '@/app/ErrorBoundary';
import { onUnauthorized } from '@/lib/authEvents';
import { showWarningToast } from '@/components/ui/Toast/toastBus';
import { ROUTES } from '@/constants/routes';
import { router } from '@/app/router';

/**
 * Điểm ráp nối TOÀN BỘ provider của app, theo đúng thứ tự phụ thuộc:
 * ErrorBoundary (ngoài cùng, bắt mọi lỗi render bên trong) > QueryClientProvider
 * (server-state) > ToastProvider + DialogProvider (UI thông báo dùng được ở
 * mọi route) > RouterProvider (routing).
 *
 * Đây là nơi DUY NHẤT nên thêm provider mới (theme, i18n, feature flags...).
 */
export function AppProviders() {
  useEffect(() => {
    return onUnauthorized(() => {
      showWarningToast('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.');
      router.navigate(ROUTES.LOGIN);
    });
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider />
        <DialogProvider>
          <RouterProvider router={router} />
        </DialogProvider>
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
