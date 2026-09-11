import { useEffect } from 'react';
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
import { createPipelineStage, updatePipelineStage } from '../api/pipelinesApi';
import { createPipelineStageSchema, type CreatePipelineStageFormValues } from '../schema';
import { ALL_STAGE_TYPES, STAGE_TYPE_LABELS, type PipelineStage } from '../types';

export interface PipelineStageFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Template đang chọn ở trang cha — Stage (mới hoặc đang sửa) luôn thuộc đây. */
  pipelineTemplateId: number;
  /**
   * `null`/`undefined` = chế độ Thêm mới (Stage luôn được thêm vào cuối,
   * BR-PIPE-04). Có giá trị = chế độ Sửa, form pre-fill từ Stage này, gọi
   * `updatePipelineStage` thay vì `createPipelineStage`.
   */
  stage?: PipelineStage | null;
}

const STAGE_TYPE_OPTIONS = ALL_STAGE_TYPES.map((type) => ({
  value: type,
  label: STAGE_TYPE_LABELS[type],
}));

/**
 * UC-04 main flow bước 2-5 (Thêm Stage) + sửa lại 1 Stage đã có (chỉ khi
 * Template cha còn DRAFT — nút sửa tự ẩn khi ACTIVE, xem
 * `PipelineManagementPage`). Dùng chung 1 form cho cả 2 chế độ vì cùng 1
 * bộ field/validation (khớp `CreatePipelineStageRequestDto` /
 * `UpdateStageRequestDto` phía backend, cùng shape) — chỉ khác API gọi và
 * giá trị mặc định. `position` không có trên form — backend luôn tự thêm
 * vào cuối khi tạo mới (BR-PIPE-04); sửa lại không đổi vị trí (UC-05 riêng).
 */
export function PipelineStageFormModal({
  open,
  onClose,
  pipelineTemplateId,
  stage,
}: PipelineStageFormModalProps) {
  const notify = useNotification();
  const queryClient = useQueryClient();
  const isEditMode = stage != null;

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreatePipelineStageFormValues>({
    resolver: zodResolver(createPipelineStageSchema),
    defaultValues: { terminal: false, slaHours: null },
  });

  // Mở modal ở chế độ Sửa (hoặc đổi sang Stage khác) -> nạp lại giá trị hiện có.
  useEffect(() => {
    if (open && stage) {
      reset({
        name: stage.name,
        code: stage.code,
        stageType: stage.stageType,
        terminal: stage.terminal,
        slaHours: stage.slaHours,
      });
    } else if (open && !stage) {
      reset({ terminal: false, slaHours: null });
    }
  }, [open, stage, reset]);

  // UC-40: SLA không áp dụng cho Stage Terminal (backend tự ép `terminal=true`
  // nếu stageType là 1 trong 2 loại Terminal-*, xem PipelineService#createStage/
  // updateStage) - tính TRÙNG logic đó ở đây để ẩn field trước khi submit, thay
  // vì để user nhập xong rồi mới ăn lỗi 400.
  const stageType = watch('stageType');
  const isTerminalChecked = watch('terminal');
  const isTerminal =
    isTerminalChecked || stageType === 'TERMINAL_SUCCESS' || stageType === 'TERMINAL_REJECTED';

  useEffect(() => {
    if (isTerminal) {
      setValue('slaHours', null);
    }
  }, [isTerminal, setValue]);

  const saveMutation = useMutation({
    mutationFn: (values: CreatePipelineStageFormValues) =>
      isEditMode
        ? updatePipelineStage(pipelineTemplateId, stage!.id, values)
        : createPipelineStage(pipelineTemplateId, values),
    onSuccess: (savedStage) => {
      queryClient.invalidateQueries({
        queryKey: ['pipeline-stages', pipelineTemplateId],
      });
      notify.success(
        isEditMode ? `Đã lưu thay đổi Stage "${savedStage.name}".` : `Đã thêm Stage "${savedStage.name}".`,
      );
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
      title={isEditMode ? 'Sửa Stage' : 'Thêm Stage mới'}
      description={
        isEditMode
          ? 'Chỉ sửa được khi Template chưa kích hoạt.'
          : 'Stage sẽ được thêm vào cuối danh sách hiện tại của Template này.'
      }
      footer={
        <>
          <Button variant="outline" onClick={handleClose}>
            Hủy
          </Button>
          <Button
            type="submit"
            form="pipeline-stage-form"
            isLoading={saveMutation.isPending}
          >
            {isEditMode ? 'Lưu thay đổi' : 'Thêm Stage'}
          </Button>
        </>
      }
    >
      <form
        id="pipeline-stage-form"
        className="flex flex-col gap-4"
        noValidate
        onSubmit={handleSubmit((values) => saveMutation.mutate(values))}
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
        {!isTerminal && (
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
        )}
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
