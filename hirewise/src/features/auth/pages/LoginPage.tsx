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
import { login } from '../api/authApi';
import { loginSchema, type LoginFormValues } from '../schema';

/**
 * Trang đăng nhập nội bộ — ví dụ THAM CHIẾU cho cách ráp nối:
 * react-hook-form + zod (validate) -> TanStack Query mutation (gọi API qua
 * apiClient) -> Zustand (lưu session) -> useNotification (phản hồi UI).
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
      // Lỗi 422 (sai email/password) hiển thị INLINE ngay dưới field, không
      // cần toast chung chung — đúng chuẩn UX form (SKILL.md 4.6).
      if (error instanceof AppError && error.status === 422) {
        setError('password', { message: error.message });
        return;
      }
      notify.error(error);
    },
  });

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-8rem)] w-full max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Đăng nhập</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Dành cho HR Admin, Recruiter, Hiring Manager và Interviewer.
        </p>
      </div>

      <form
        onSubmit={handleSubmit((values) => loginMutation.mutate(values))}
        className="flex flex-col gap-4"
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
    </div>
  );
}
