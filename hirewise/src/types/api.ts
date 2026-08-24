/**
 * Kiểu dữ liệu chuẩn cho toàn bộ giao tiếp API với backend Spring Boot
 * (`FR-HireWise-BE`). Khớp chính xác theo `ErrorResponse`/`PagedResponseDto`
 * thật của backend — xem `hirewise-be/src/main/java/.../dto/`.
 *
 * Lưu ý: backend KHÔNG bọc response thành công trong envelope `{ data, ... }`
 * — body trả về chính là DTO thật (vd `POST /auth/login` trả thẳng
 * `{ accessToken, refreshToken, ... }`, không phải `{ data: { accessToken, ... } } }`).
 * `apiClient.ts` xử lý được cả 2 kiểu (có/không có field `data`) nên không
 * cần đổi gì ở đây nếu sau này backend đổi ý bọc envelope.
 */

/** Envelope lỗi chuẩn — khớp `ErrorResponse.java` (GlobalExceptionHandler). */
export interface ApiErrorResponse {
  timestamp?: string;
  status?: number;
  /** Mã lỗi nghiệp vụ, vd "USER_ALREADY_EXISTS", "INVALID_CREDENTIALS" (xem ErrorCode.java). */
  code?: string;
  message: string;
  path?: string;
  /** Lỗi validate theo từng field (1 message/field) — Bean Validation trả 400. */
  fieldErrors?: Record<string, string>;
}

/**
 * Lỗi đã được chuẩn hóa mà interceptor luôn ném ra — mọi nơi bắt lỗi (catch,
 * onError của TanStack Query, ErrorBoundary) chỉ cần xử lý MỘT shape này,
 * bất kể lỗi gốc là network error, 4xx, 5xx hay lỗi JS runtime.
 */
export class AppError extends Error {
  readonly status: number | null;
  readonly code?: string;
  readonly fieldErrors?: Record<string, string>;
  /** true nếu lỗi do mất mạng / server không phản hồi (không có response) */
  readonly isNetworkError: boolean;

  constructor(params: {
    message: string;
    status?: number | null;
    code?: string;
    fieldErrors?: Record<string, string>;
    isNetworkError?: boolean;
  }) {
    super(params.message);
    this.name = 'AppError';
    this.status = params.status ?? null;
    this.code = params.code;
    this.fieldErrors = params.fieldErrors;
    this.isNetworkError = params.isNetworkError ?? false;
  }
}

/** Khớp `PagedResponseDto<T>` — trả về bởi các endpoint list có phân trang. */
export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}
