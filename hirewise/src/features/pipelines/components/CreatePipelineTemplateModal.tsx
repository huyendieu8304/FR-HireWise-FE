import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal/Modal';
import { TextInput } from '@/components/ui/TextInput/TextInput';
import { Select } from '@/components/ui/Select/Select';
import { Button } from '@/components/ui/Button/Button';
import { useNotification } from '@/hooks/useNotification';
import { listDepartments } from '@/features/users/api/usersApi';
import { createPipelineTemplate } from '../api/pipelinesApi';
import {
  createPipelineTemplateSchema,
  type CreatePipelineTemplateFormValues,
} from '../schema';
import type { PipelineTemplate } from '../types';

export interface CreatePipelineTemplateModalProps {
  open: boolean;
  onClose: () => void;
  /** Gọi ngay sau khi tạo xong — UC-04 AF-01: "lưu → tiếp tục thêm Stage theo luồng chính". */
  onCreated: (template: PipelineTemplate) => void;
}

/**
 * UC-04 AF-01: tạo Pipeline Template mới (tên + phòng ban áp dụng, để
 * trống = dùng chung toàn hệ thống). Luôn tạo ở trạng thái DRAFT, chưa có
 * Stage nào — bước tiếp theo trong luồng chính là thêm Stage đầu tiên.
 */
export function CreatePipelineTemplateModal({
  open,
  onClose,
  onCreated,
}: CreatePipelineTemplateModalProps) {
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
    formState: { errors },
  } = useForm<CreatePipelineTemplateFormValues>({
    resolver: zodResolver(createPipelineTemplateSchema),
  });

  const createMutation = useMutation({
    // Select trả string; departmentId thật ở backend là Long — convert ở
    // đúng ranh giới gọi API (giống AddUserModal), '' = company-wide (undefined).
    mutationFn: (values: CreatePipelineTemplateFormValues) =>
      createPipelineTemplate({
        name: values.name,
        departmentId: values.departmentId ? Number(values.departmentId) : undefined,
      }),
    onSuccess: (template) => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-templates'] });
      notify.success(`Đã tạo Pipeline Template "${template.name}".`);
      reset();
      onCreated(template);
    },
    onError: (error) => notify.error(error),
  });

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Tạo Pipeline Template mới"
      description="Để trống Phòng ban nếu Template này dùng chung cho toàn công ty."
      footer={
        <>
          <Button variant="outline" onClick={handleClose}>
            Hủy
          </Button>
          <Button
            type="submit"
            form="create-pipeline-template-form"
            isLoading={createMutation.isPending}
          >
            Tạo Template
          </Button>
        </>
      }
    >
      <form
        id="create-pipeline-template-form"
        className="flex flex-col gap-4"
        noValidate
        onSubmit={handleSubmit((values) => createMutation.mutate(values))}
      >
        <TextInput
          label="Tên Template"
          placeholder="vd. Quy trình tuyển dụng IT"
          required
          error={errors.name?.message}
          {...register('name')}
        />
        <Select
          label="Phòng ban áp dụng"
          placeholder="Dùng chung toàn hệ thống"
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
