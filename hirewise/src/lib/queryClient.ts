import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { AppError } from '@/types/api';
import { showErrorToast } from '@/components/ui/Toast/toastBus';

/**
 * TanStack Query quản lý toàn bộ SERVER-STATE (dữ liệu fetch từ API): cache,
 * refetch, trạng thái loading/error tự động theo từng query key. State không
 * liên quan tới server (theme, sidebar mở/đóng, session...) thuộc về Zustand
 * (`src/store`), không đưa vào đây.
 *
 * Lỗi từ mọi query/mutation đều là `AppError` (đã chuẩn hóa ở apiClient).
 * `apiClient` đã tự hiện toast cho các nhóm lỗi "tự động" (network, 403, 429,
 * 5xx...). Ở đây ta chỉ toast bổ sung cho lỗi MUTATION chưa được toast — vì
 * mutation luôn cần phản hồi rõ ràng cho hành động của user (vd: submit form
 * thất bại vì lỗi 422 mà không có UI inline nào bắt riêng).
 */

function isSilencedByInterceptor(error: unknown) {
  if (!(error instanceof AppError)) return false;
  // Các status đã được apiClient tự toast — tránh hiện toast trùng lặp.
  return (
    error.isNetworkError ||
    error.status === 403 ||
    error.status === 429 ||
    (error.status !== null && error.status >= 500)
  );
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30s — dữ liệu được coi là "tươi" trong 30s trước khi refetch nền
      gcTime: 5 * 60 * 1000, // 5 phút giữ cache sau khi không còn component nào dùng
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Không retry lỗi phía client (400-499) — retry chỉ có ý nghĩa với lỗi tạm thời (network/5xx)
        if (error instanceof AppError && error.status && error.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      // Query lỗi mà không component nào tự xử lý UI (vd không destructure `error`
      // để hiển thị) vẫn nên có phản hồi tối thiểu, trừ các lỗi đã bị interceptor toast.
      if (error instanceof AppError && !isSilencedByInterceptor(error)) {
        showErrorToast(error.message);
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      if (error instanceof AppError && !isSilencedByInterceptor(error)) {
        showErrorToast(error.message);
      }
    },
  }),
});
