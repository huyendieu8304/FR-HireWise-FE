import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal/Modal';
import { TextInput } from '@/components/ui/TextInput/TextInput';
import { Select } from '@/components/ui/Select/Select';
import { NumberInput } from '@/components/ui/NumberInput/NumberInput';
import { Switch } from '@/components/ui/Switch/Switch';
import { Button } from '@/components/ui/Button/Button';
import { useNotification } from '@/hooks/useNotification';
import { AppError } from '@/types/api';
import { createPipelineStage } from '../api/pipelinesApi';
import { createPipelineStageSchema, type CreatePipelineStageFormValues } from '../schema';
import { ALL_STAGE_TYPES, STAGE_TYPE_LABELS } from '../types';

export interface CreatePipelineStageModalProps {
  open: boolean;
  onClose: () => void;
  /** Template đang chọn ở trang cha — Stage mới luôn được thêm vào đây. */
  pipelineTemplateId: number;
}

const STAGE_TYPE_OPTIONS = ALL_STAGE_TYPES.map((type) => ({
  value: type,
  label: STAGE_TYPE_LABELS[type],
}));

/**
 * UC-04 main flow bước 2-5: thêm 1 Stage mới vào Pipeline Template đang
 * chọn. `position` không có trên form — backend luôn tự thêm vào cuối
 * (BR-PIPE-04); "Is Terminal" vẫn để HR Admin tự tick (Screen Description),
 * dù backend sẽ tự ép `true` nếu Loại Stage là 1 trong 2 loại Terminal-*.
 */
export function CreatePipelineStageModal({
  open,
  onClose,
  pipelineTemplateId,
}: CreatePipelineStageModalProps) {
  const notify = useNotification();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreatePipelineStageFormValues>({
    resolver: zodResolver(createPipelineStageSchema),
    defaultValues: { terminal: false, slaHours: null },
  });

  const createMutation = useMutation({
    mutationFn: (values: CreatePipelineStageFormValues) =>
      createPipelineStage(pipelineTemplateId, values),
    onSuccess: (stage) => {
      queryClient.invalidateQueries({
        queryKey: ['pipeline-stages', pipelineTemplateId],
      });
      notify.success(`Đã thêm Stage "${stage.name}".`);
      reset({ terminal: false, slaHours: null });
      onClose();
    },
    onError: (error) => {
      // 409 = BR-PIPE-02 (EX-01: trùng mã Stage trong cùng Template) — hiện
      // inline dưới field Mã Stage. Lỗi khác đã được apiClient tự toast.
      if (error instanceof AppError && error.status === 409) {
        setError('code', { message: error.message });
      }
    },
  });

  function handleClose() {
    reset({ terminal: false, slaHours: null });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Thêm Stage mới"
      description="Stage sẽ được thêm vào cuối danh sách hiện tại của Template này."
      footer={
        <>
          <Button variant="outline" onClick={handleClose}>
            Hủy
          </Button>
          <Button
            type="submit"
            form="create-pipeline-stage-form"
            isLoading={createMutation.isPending}
          >
            Thêm Stage
          </Button>
        </>
      }
    >
      <form
        id="create-pipeline-stage-form"
        className="flex flex-col gap-4"
        noValidate
        onSubmit={handleSubmit((values) => createMutation.mutate(values))}
      >
        <TextInput
          label="Tên Stage"
          placeholder="vd. Phỏng vấn chuyên môn"
          required
          error={errors.name?.message}
          {...register('name')}
        />
        <TextInput
          label="Mã Stage (code)"
          placeholder="vd. TECHNICAL_INTERVIEW"
          helperText="Viết HOA, không dấu — duy nhất trong Template này."
          required
          error={errors.code?.message}
          {...register('code')}
        />
        <Select
          label="Loại Stage"
          placeholder="Chọn loại Stage"
          required
          options={STAGE_TYPE_OPTIONS}
          error={errors.stageType?.message}
          {...register('stageType')}
        />
        <Controller
          name="slaHours"
          control={control}
          render={({ field, fieldState }) => (
            <NumberInput
              label="SLA (giờ)"
              helperText="Bỏ trống nếu không giới hạn thời gian ở Stage này."
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              min={1}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          name="terminal"
          control={control}
          render={({ field }) => (
            <label className="flex items-center justify-between text-sm text-neutral-700">
              Is Terminal (bước kết thúc Pipeline)
              <Switch
                checked={field.value}
                onChange={field.onChange}
                label="Đánh dấu Stage kết thúc Pipeline"
              />
            </label>
          )}
        />
      </form>
    </Modal>
  );
}
