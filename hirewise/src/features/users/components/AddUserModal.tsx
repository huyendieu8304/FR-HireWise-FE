import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal/Modal';
import { TextInput } from '@/components/ui/TextInput/TextInput';
import { Select } from '@/components/ui/Select/Select';
import { Button } from '@/components/ui/Button/Button';
import { useNotification } from '@/hooks/useNotification';
import { AppError } from '@/types/api';
import { createUser, listDepartments } from '../api/usersApi';
import { addUserSchema, type AddUserFormValues } from '../schema';

export interface AddUserModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * UC-02 normal flow bước 1-6: HR Admin tạo tài khoản nội bộ mới (status
 * Invited, hệ thống "gửi" email kích hoạt). Xem `usersApi.createUser`.
 */
export function AddUserModal({ open, onClose }: AddUserModalProps) {
  const notify = useNotification();
  const queryClient = useQueryClient();

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: listDepartments,
  });

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<AddUserFormValues>({ resolver: zodResolver(addUserSchema) });

  const createUserMutation = useMutation({
    // Select trả value dạng string (chuẩn HTML) — departmentId thật ở
    // backend là Long, convert ở đúng ranh giới API thay vì đổi kiểu cả form.
    mutationFn: (values: AddUserFormValues) =>
      createUser({ ...values, departmentId: Number(values.departmentId) }),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      notify.success(
        `Đã tạo tài khoản cho ${user.fullName}, email kích hoạt đã được gửi.`,
      );
      reset();
      onClose();
    },
    onError: (error) => {
      // 409 Conflict = USER_ALREADY_EXISTS (BR-AUTH-05: email unique) — hiện
      // inline dưới field. Lỗi khác (400 validate, network...) đã được
      // apiClient/queryClient tự toast, không cần xử lý thêm ở đây.
      if (error instanceof AppError && error.status === 409) {
        setError('email', { message: error.message });
      }
    },
  });

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Thêm User mới"
      description="Tài khoản sẽ ở trạng thái Invited cho tới khi kích hoạt qua email."
      footer={
        <>
          <Button variant="outline" onClick={handleClose}>
            Hủy
          </Button>
          <Button
            type="submit"
            form="add-user-form"
            isLoading={createUserMutation.isPending}
          >
            Lưu & Gửi mail kích hoạt
          </Button>
        </>
      }
    >
      <form
        id="add-user-form"
        className="flex flex-col gap-4"
        noValidate
        onSubmit={handleSubmit((values) => createUserMutation.mutate(values))}
      >
        <TextInput
          label="Email"
          type="email"
          placeholder="nhanvien@congty.com"
          required
          error={errors.email?.message}
          {...register('email')}
        />
        <TextInput
          label="Họ tên"
          placeholder="Nguyễn Văn A"
          required
          error={errors.fullName?.message}
          {...register('fullName')}
        />
        <Select
          label="Phòng ban"
          placeholder="Chọn phòng ban"
          required
          options={(departments ?? []).map((d) => ({
            value: String(d.id),
            label: d.name,
          }))}
          error={errors.departmentId?.message}
          {...register('departmentId')}
        />
      </form>
    </Modal>
  );
}
