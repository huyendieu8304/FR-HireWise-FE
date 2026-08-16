import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Global client-state cho phiên đăng nhập. Đây là ví dụ mẫu cho việc dùng
 * Zustand — chỉ nên chứa state KHÔNG phải server-data (server-data thuộc về
 * TanStack Query, xem `src/lib/queryClient.ts`).
 */

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'HR_ADMIN' | 'RECRUITER' | 'HIRING_MANAGER' | 'INTERVIEWER';
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  setSession: (params: { accessToken: string; user: AuthUser }) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      setSession: ({ accessToken, user }) =>
        set({ accessToken, user, isAuthenticated: true }),
      clearSession: () => set({ accessToken: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'hirewise-auth',
      // Chỉ nên persist token + user cơ bản, không persist toàn bộ state nhạy cảm khác.
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
