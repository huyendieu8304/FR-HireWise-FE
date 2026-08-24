import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, LockKey, WarningCircle } from '@phosphor-icons/react';
import { TextInput } from '@/components/ui/TextInput/TextInput';
import { Button } from '@/components/ui/Button/Button';
import { ROUTES } from '@/constants/routes';
import { AppError } from '@/types/api';
import { activateAccount } from '../api/authApi';
import { activateAccountSchema, type ActivateAccountFormValues } from '../schema';
import { AuthBrandRail } from '../components/AuthBrandRail';

/**
 * UC-02 EM-01 — trang người dùng mở từ link trong email kích hoạt để đặt
 * mật khẩu lần đầu, chuyển tài khoản từ `INVITED` sang `ACTIVE`
 * (`POST /api/auth/activate`, xem `AuthService.activate`). Route PUBLIC —
 * không yêu cầu đăng nhập, vì tài khoản chưa có mật khẩu để đăng nhập.
 *
 * Token nằm trong query string `?token=...` do backend sinh và nhúng vào
 * link email khi HR Admin tạo user (`UserAdminService.create()` ->
 * `activationLinkBaseUrl + "?token=" + rawToken`) — KHÔNG đọc token từ
 * đâu khác.
 *
 * 3 trạng thái hiển thị, tách rõ vì khác hẳn ý nghĩa:
 * - Thiếu token trên URL, hoặc backend trả 400 INVALID_OR_EXPIRED_TOKEN
 *   (token sai/hết hạn/đã dùng) -> lỗi này nằm ở TOKEN, thử lại mật khẩu
 *   khác không giải quyết được gì, nên thay hẳn form bằng thông báo lỗi
 *   + hướng dẫn liên hệ HR Admin, thay vì hiện lỗi inline dưới field.
 * - Thành công (204) -> thông báo + nút sang thẳng trang đăng nhập.
 * - Còn lại -> hiện form đặt mật khẩu (mặc định).
 */
export function ActivatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ActivateAccountFormValues>({ resolver: zodResolver(activateAccountSchema) });

  const activateMutation = useMutation({
    mutationFn: (values: ActivateAccountFormValues) =>
      activateAccount({ token: token ?? '', password: values.password }),
  });

  const isInvalidTokenError =
    activateMutation.error instanceof AppError &&
    activateMutation.error.code === 'INVALID_OR_EXPIRED_TOKEN';

  // --- Trạng thái 1: không có token / token sai-hết hạn-đã dùng ---
  if (!token || isInvalidTokenError) {
    return (
      <AuthPageShell>
        <div className="w-full max-w-sm text-center">
          <span className="bg-danger-100 text-danger-600 mx-auto flex size-12 items-center justify-center rounded-full">
            <WarningCircle weight="bold" className="size-6" />
          </span>
          <h2 className="mt-4 text-2xl font-semibold text-neutral-900">
            Liên kết không hợp lệ
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500">
            {!token
              ? 'Đường link kích hoạt bị thiếu token. Vui lòng mở lại đúng đường link trong email được gửi cho bạn.'
              : 'Link kích hoạt đã hết hạn hoặc đã được sử dụng trước đó. Vui lòng liên hệ HR Admin để được cấp lại email kích hoạt.'}
          </p>
          <Button
            variant="outline"
            fullWidth
            className="mt-6"
            onClick={() => navigate(ROUTES.LOGIN)}
          >
            Về trang đăng nhập
          </Button>
        </div>
      </AuthPageShell>
    );
  }

  // --- Trạng thái 2: kích hoạt thành công ---
  if (activateMutation.isSuccess) {
    return (
      <AuthPageShell>
        <div className="w-full max-w-sm text-center">
          <span className="bg-success-100 text-success-600 mx-auto flex size-12 items-center justify-center rounded-full">
            <CheckCircle weight="bold" className="size-6" />
          </span>
          <h2 className="mt-4 text-2xl font-semibold text-neutral-900">
            Kích hoạt thành công
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500">
            Tài khoản của bạn đã sẵn sàng sử dụng. Đăng nhập bằng email và mật khẩu vừa
            đặt để bắt đầu.
          </p>
          <Button fullWidth className="mt-6" onClick={() => navigate(ROUTES.LOGIN)}>
            Đăng nhập ngay
          </Button>
        </div>
      </AuthPageShell>
    );
  }

  // --- Trạng thái mặc định: form đặt mật khẩu ---
  return (
    <AuthPageShell>
      <div className="w-full max-w-sm">
        <h2 className="text-2xl font-semibold text-neutral-900">Kích hoạt tài khoản</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Đặt mật khẩu cho tài khoản HireWise của bạn để hoàn tất kích hoạt.
        </p>

        <form
          onSubmit={handleSubmit((values) => activateMutation.mutate(values))}
          className="mt-6 flex flex-col gap-4"
          noValidate
        >
          <TextInput
            label="Mật khẩu mới"
            type="password"
            placeholder="••••••••"
            prefixIcon={<LockKey />}
            helperText="Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và số."
            error={errors.password?.message}
            required
            {...register('password')}
          />
          <TextInput
            label="Nhập lại mật khẩu"
            type="password"
            placeholder="••••••••"
            prefixIcon={<LockKey />}
            error={errors.confirmPassword?.message}
            required
            {...register('confirmPassword')}
          />
          <Button
            type="submit"
            fullWidth
            isLoading={activateMutation.isPending}
            className="mt-2"
          >
            Kích hoạt tài khoản
          </Button>
        </form>
      </div>
    </AuthPageShell>
  );
}

/** Bố cục split-screen dùng chung cho mọi trạng thái của trang — khớp LoginPage. */
function AuthPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-[calc(100dvh-8rem)] grid-cols-1 lg:grid-cols-2">
      <AuthBrandRail />
      <div className="flex items-center justify-center px-4 py-10">{children}</div>
    </div>
  );
}
