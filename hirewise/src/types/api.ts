/**
 * Kiểu dữ liệu chuẩn cho toàn bộ giao tiếp API.
 * Backend được kỳ vọng trả về envelope theo đúng shape `ApiSuccessResponse`
 * hoặc `ApiErrorResponse` bên dưới. Nếu backend đổi format, CHỈ cần sửa
 * `src/lib/apiClient.ts` (nơi bóc tách response) — không phải sửa từng nơi gọi API.
 */

/** Envelope thành công chuẩn: { data, message?, meta? } */
export interface ApiSuccessResponse<T> {
  data: T;
  message?: string;
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    [key: string]: unknown;
  };
}

/** Envelope lỗi chuẩn trả về từ backend */
export interface ApiErrorResponse {
  message: string;
  /** Mã lỗi nghiệp vụ, ví dụ "AUTH_INVALID_CREDENTIALS" */
  code?: string;
  /** Lỗi validate theo từng field, dùng để map vào react-hook-form.setError */
  errors?: Record<string, string[]>;
}

/**
 * Lỗi đã được chuẩn hóa mà interceptor luôn ném ra — mọi nơi bắt lỗi (catch,
 * onError của TanStack Query, ErrorBoundary) chỉ cần xử lý MỘT shape này,
 * bất kể lỗi gốc là network error, 4xx, 5xx hay lỗi JS runtime.
 */
export class AppError extends Error {
  readonly status: number | null;
  readonly code?: string;
  readonly errors?: Record<string, string[]>;
  /** true nếu lỗi do mất mạng / server không phản hồi (không có response) */
  readonly isNetworkError: boolean;

  constructor(params: {
    message: string;
    status?: number | null;
    code?: string;
    errors?: Record<string, string[]>;
    isNetworkError?: boolean;
  }) {
    super(params.message);
    this.name = 'AppError';
    this.status = params.status ?? null;
    this.code = params.code;
    this.errors = params.errors;
    this.isNetworkError = params.isNetworkError ?? false;
  }
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
