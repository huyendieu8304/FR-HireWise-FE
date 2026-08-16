import { http } from '@/lib/apiClient';
import type { AuthUser } from '@/store/useAuthStore';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

/**
 * Ví dụ mẫu 1 API call thực tế đi qua `apiClient`. `skipAuthRedirect: true`
 * vì đây chính là API login — nếu backend trả 401 (sai mật khẩu) thì KHÔNG
 * được tự động clear session / redirect (vốn dành cho trường hợp token hết
 * hạn ở các API khác).
 */
export function login(payload: LoginPayload) {
  return http.post<LoginResponse>('/auth/login', payload, {
    skipAuthRedirect: true,
  });
}
