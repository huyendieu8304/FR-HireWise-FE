import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { AppError, type ApiErrorResponse, type ApiSuccessResponse } from '@/types/api';
import { useAuthStore } from '@/store/useAuthStore';
import { emitUnauthorized } from '@/lib/authEvents';
import { showErrorToast } from '@/components/ui/Toast/toastBus';

/**
 * =============================================================================
 * API CLIENT — instance Axios dùng chung cho toàn bộ ứng dụng.
 * =============================================================================
 * - Mọi lệnh gọi API PHẢI đi qua instance này (không tạo `axios.create` rải rác).
 * - baseURL đọc từ biến môi trường `VITE_API_BASE_URL` (xem .env.example).
 * - Request interceptor: tự gắn Bearer token nếu đã đăng nhập.
 * - Response interceptor: bóc `data` khỏi envelope chuẩn, và quy đổi MỌI lỗi
 *   (network, 4xx, 5xx) về một kiểu `AppError` duy nhất — nơi gọi API không
 *   cần biết lỗi tới từ đâu, chỉ cần `catch (err) { if (err instanceof AppError) }`.
 */

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/** Config mở rộng: set `skipAuthRedirect: true` cho các call không muốn tự văng ra trang login khi 401 (vd: chính API login/refresh). */
export interface RequestConfig extends AxiosRequestConfig {
  skipAuthRedirect?: boolean;
  /** Tắt toast lỗi tự động cho request này (khi component tự xử lý UI lỗi, vd inline form error) */
  silent?: boolean;
}

// ---------------------------------------------------------------------------
// REQUEST INTERCEPTOR — đính kèm Bearer token
// ---------------------------------------------------------------------------
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

// ---------------------------------------------------------------------------
// RESPONSE INTERCEPTOR — bóc data + chuẩn hóa lỗi + xử lý status code chung
// ---------------------------------------------------------------------------
apiClient.interceptors.response.use(
  (response) => {
    // Bóc `data` khỏi envelope { data, message, meta } để nơi gọi API dùng
    // thẳng payload, không phải viết `res.data.data` ở mọi nơi.
    const body = response.data as ApiSuccessResponse<unknown>;
    if (body && typeof body === 'object' && 'data' in body) {
      return { ...response, data: body.data };
    }
    return response;
  },
  (error: AxiosError<ApiErrorResponse>) => {
    const config = error.config as RequestConfig | undefined;

    // 1. Lỗi network / timeout — không có response từ server
    if (!error.response) {
      const appError = new AppError({
        message:
          error.code === 'ECONNABORTED'
            ? 'Yêu cầu quá thời gian chờ. Vui lòng thử lại.'
            : 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng.',
        isNetworkError: true,
      });
      if (!config?.silent) showErrorToast(appError.message);
      return Promise.reject(appError);
    }

    const { status, data } = error.response;
    const serverMessage = data?.message;

    // 2. Xử lý theo từng nhóm status code phổ biến
    switch (status) {
      case 401: {
        const appError = new AppError({
          message: serverMessage ?? 'Phiên đăng nhập đã hết hạn.',
          status,
          code: data?.code,
        });
        // Không tự đăng xuất nếu chính request là login/refresh (tránh vòng lặp)
        if (!config?.skipAuthRedirect) {
          useAuthStore.getState().clearSession();
          emitUnauthorized();
        }
        return Promise.reject(appError);
      }

      case 403: {
        const appError = new AppError({
          message: serverMessage ?? 'Bạn không có quyền thực hiện thao tác này.',
          status,
          code: data?.code,
        });
        if (!config?.silent) showErrorToast(appError.message);
        return Promise.reject(appError);
      }

      case 404: {
        const appError = new AppError({
          message: serverMessage ?? 'Không tìm thấy dữ liệu yêu cầu.',
          status,
          code: data?.code,
        });
        return Promise.reject(appError);
      }

      case 422: {
        // Lỗi validate — trả kèm `errors` theo field để form tự map, KHÔNG toast
        // chung chung (form sẽ hiển thị lỗi inline dưới từng input).
        const appError = new AppError({
          message: serverMessage ?? 'Dữ liệu không hợp lệ.',
          status,
          code: data?.code,
          errors: data?.errors,
        });
        return Promise.reject(appError);
      }

      case 429: {
        const appError = new AppError({
          message: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.',
          status,
          code: data?.code,
        });
        if (!config?.silent) showErrorToast(appError.message);
        return Promise.reject(appError);
      }

      default: {
        if (status >= 500) {
          const appError = new AppError({
            message: 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.',
            status,
            code: data?.code,
          });
          if (!config?.silent) showErrorToast(appError.message);
          return Promise.reject(appError);
        }

        const appError = new AppError({
          message: serverMessage ?? 'Đã xảy ra lỗi không xác định.',
          status,
          code: data?.code,
        });
        if (!config?.silent) showErrorToast(appError.message);
        return Promise.reject(appError);
      }
    }
  },
);

/**
 * Helper gọi API với generic type sẵn, tránh phải ép kiểu `as T` lặp lại.
 *
 * @example
 * const jobs = await http.get<Job[]>('/jobs');
 * const job = await http.post<Job>('/jobs', payload);
 */
export const http = {
  get: <T>(url: string, config?: RequestConfig) => apiClient.get<T, T>(url, config),
  post: <T>(url: string, data?: unknown, config?: RequestConfig) =>
    apiClient.post<T, T>(url, data, config),
  put: <T>(url: string, data?: unknown, config?: RequestConfig) =>
    apiClient.put<T, T>(url, data, config),
  patch: <T>(url: string, data?: unknown, config?: RequestConfig) =>
    apiClient.patch<T, T>(url, data, config),
  delete: <T>(url: string, config?: RequestConfig) => apiClient.delete<T, T>(url, config),
};
