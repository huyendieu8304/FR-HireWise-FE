import { http } from '@/lib/apiClient';
import type { AuthUser } from '@/store/useAuthStore';

export interface LoginPayload {
  email: string;
  password: string;
}

/** Khớp `CurrentUserResponseDto` (backend) — KHÔNG dùng trực tiếp ở component, map sang `AuthUser` trước. */
interface CurrentUserDto {
  userId: number;
  email: string;
  fullName: string;
  roles: string[];
}

/** Khớp `LoginResponseDto` (backend) — xem FR-HireWise-BE/.../dto/response/LoginResponseDto.java. */
interface LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  user: CurrentUserDto;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

function toAuthUser(dto: CurrentUserDto): AuthUser {
  return {
    id: dto.userId,
    name: dto.fullName,
    email: dto.email,
    roles: dto.roles,
  };
}

/**
 * `skipAuthRedirect: true` vì đây chính là API login — nếu backend trả 401
 * (sai mật khẩu, `InvalidCredentialsException`) thì KHÔNG được tự động clear
 * session / redirect (vốn dành cho trường hợp token hết hạn ở các API khác).
 */
export async function login(payload: LoginPayload): Promise<LoginResult> {
  const response = await http.post<LoginResponseDto>('/auth/login', payload, {
    skipAuthRedirect: true,
  });
  return {
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    user: toAuthUser(response.user),
  };
}

/** UC-01 luồng chính bước 6-7: revoke session hiện tại phía server. */
export function logout() {
  return http.post<void>('/auth/logout', undefined, { silent: true });
}

export interface ActivateAccountPayload {
  /** Chuỗi token lấy từ query param `?token=` của link kích hoạt (email EM-01). */
  token: string;
  password: string;
}

/**
 * UC-02 EM-01: đặt mật khẩu lần đầu cho tài khoản đang ở trạng thái Invited
 * (kích hoạt tài khoản qua link trong email). `skipAuthRedirect: true` vì
 * đây là API permitAll không liên quan tới phiên đăng nhập hiện tại — nếu
 * trình duyệt tình cờ còn giữ 1 access token cũ hết hạn, không được để nó
 * kích hoạt luồng "văng ra trang login" (giống lý do áp dụng cho `login()`).
 */
export function activateAccount(payload: ActivateAccountPayload): Promise<void> {
  return http.post<void>('/auth/activate', payload, { skipAuthRedirect: true });
}
