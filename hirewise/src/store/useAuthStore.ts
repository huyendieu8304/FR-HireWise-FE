import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Global client-state cho phiên đăng nhập. Đây là ví dụ mẫu cho việc dùng
 * Zustand — chỉ nên chứa state KHÔNG phải server-data (server-data thuộc về
 * TanStack Query, xem `src/lib/queryClient.ts`).
 */

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  /** Khớp `CurrentUserResponseDto.roles` (Set<String>) — 1 user có thể có nhiều role cùng lúc. */
  roles: string[];
}

interface AuthState {
  accessToken: string | null;
  /** Dùng cho `POST /auth/refresh` khi access token hết hạn — TODO: chưa nối interceptor tự refresh. */
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  setSession: (params: {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
  }) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      setSession: ({ accessToken, refreshToken, user }) =>
        set({ accessToken, refreshToken, user, isAuthenticated: true }),
      clearSession: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'hirewise-auth',
      // Chỉ nên persist token + user cơ bản, không persist toàn bộ state nhạy cảm khác.
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
