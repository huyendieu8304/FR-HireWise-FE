import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import type { Location } from 'react-router-dom';
import { EnvelopeSimple, LockKey } from '@phosphor-icons/react';
import { TextInput } from '@/components/ui/TextInput/TextInput';
import { Button } from '@/components/ui/Button/Button';
import { useNotification } from '@/hooks/useNotification';
import { useAuthStore } from '@/store/useAuthStore';
import { ROUTES } from '@/constants/routes';
import { AppError } from '@/types/api';
import { login, type LoginPayload } from '../api/authApi';
import { loginSchema, type LoginFormValues } from '../schema';
import { AuthBrandRail } from '../components/AuthBrandRail';

/**
 * Trang đăng nhập nội bộ (UC-01) — ví dụ THAM CHIẾU cho cách ráp nối:
 * react-hook-form + zod (validate) -> TanStack Query mutation (gọi API qua
 * apiClient) -> Zustand (lưu session) -> useNotification (phản hồi UI).
 *
 * Bố cục split-screen (brand rail bên trái, form bên phải) theo đúng mockup
 * đã duyệt trong figma-mockups/UC-01. Rail chỉ hiện ở màn hình >= lg — ẩn
 * trên mobile để form không bị bóp nhỏ.
 */
export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation() as Location & { state?: { from?: Location } };
  const notify = useNotification();
  const setSession = useAuthStore((state) => state.setSession);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setSession(data);
      notify.success(`Chào mừng trở lại, ${data.user.name}!`);
      navigate(location.state?.from?.pathname ?? ROUTES.DASHBOARD, { replace: true });
    },
    onError: (error) => {
      // 401 (InvalidCredentialsException — sai email/password) hiển thị
      // INLINE ngay dưới field, không toast chung chung — đúng chuẩn UX
      // form (SKILL.md 4.6). Các lỗi khác (423 khóa tài khoản, network...)
      // đã được apiClient/queryClient tự toast, không cần xử lý thêm ở đây.
      if (error instanceof AppError && error.status === 401) {
        setError('password', { message: error.message });
      }
    },
  });

  return (
    <div className="grid min-h-[calc(100dvh-8rem)] grid-cols-1 lg:grid-cols-2">
      <AuthBrandRail />

      {/* Form */}
      <div className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 text-base font-bold text-neutral-900 lg:hidden">
            <span className="bg-primary-600 flex size-7 items-center justify-center rounded-md text-sm text-white">
              H
            </span>
            HireWise
          </div>

          <h2 className="text-2xl font-semibold text-neutral-900">Đăng nhập</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Dành cho HR Admin, Recruiter, Hiring Manager và Interviewer.
          </p>

          <form
            onSubmit={handleSubmit((values) => loginMutation.mutate(values as LoginPayload))}
            className="mt-6 flex flex-col gap-4"
            noValidate
          >
            <TextInput
              label="Email"
              type="email"
              placeholder="ban@congty.com"
              prefixIcon={<EnvelopeSimple />}
              error={errors.email?.message}
              required
              {...register('email')}
            />
            <TextInput
              label="Mật khẩu"
              type="password"
              placeholder="••••••••"
              prefixIcon={<LockKey />}
              error={errors.password?.message}
              required
              {...register('password')}
            />
            <Button
              type="submit"
              fullWidth
              isLoading={loginMutation.isPending}
              className="mt-2"
            >
              Đăng nhập
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-neutral-500">
            Chưa có tài khoản? Liên hệ HR Admin để được cấp quyền truy cập.
          </p>
        </div>
      </div>
    </div>
  );
}
