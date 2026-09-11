import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal/Modal';
import { NumberInput } from '@/components/ui/NumberInput/NumberInput';
import { Button } from '@/components/ui/Button/Button';
import { useNotification } from '@/hooks/useNotification';
import { updateStageSla } from '../api/pipelinesApi';
import { updateStageSlaSchema, type UpdateStageSlaFormValues } from '../schema';
import type { PipelineStage } from '../types';

export interface EditStageSlaModalProps {
  /** `null` = đóng modal. */
  stage: PipelineStage | null;
  pipelineTemplateId: number;
  onClose: () => void;
}

/**
 * US-MGR-04 (UC-40, SLA Monitoring): HR Admin cấu hình nhanh ngưỡng SLA của
 * 1 Stage, ngay tại cột SLA của bảng — tách riêng khỏi `PipelineStageFormModal`
 * (form sửa Stage đầy đủ: tên/mã/loại/is-terminal/SLA) để không phải mở cả
 * form chỉ để đổi 1 con số. Cả 2 đều yêu cầu `PIPELINE_MANAGE` và đều bị khoá
 * khi Template đã ACTIVE.
 */
export function EditStageSlaModal({ stage, pipelineTemplateId, onClose }: EditStageSlaModalProps) {
  const notify = useNotification();
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateStageSlaFormValues>({
    resolver: zodResolver(updateStageSlaSchema),
    values: { slaHours: stage?.slaHours ?? null },
  });

  const updateMutation = useMutation({
    mutationFn: (values: UpdateStageSlaFormValues) =>
      updateStageSla(pipelineTemplateId, stage!.id, values.slaHours),
    onSuccess: (updatedStage) => {
      queryClient.setQueryData<PipelineStage[]>(
        ['pipeline-stages', pipelineTemplateId],
        (current) => current?.map((s) => (s.id === updatedStage.id ? updatedStage : s)),
      );
      notify.success(`Đã cập nhật SLA cho Stage "${updatedStage.name}".`);
      onClose();
    },
    onError: (error) => notify.error(error),
  });

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Modal
      open={stage !== null}
      onClose={handleClose}
      title={`Cấu hình SLA — "${stage?.name}"`}
      description="Thời gian tối đa 1 ứng viên được ở Stage này trước khi bị tính là vi phạm SLA."
      footer={
        <>
          <Button variant="outline" onClick={handleClose}>
            Hủy
          </Button>
          <Button
            type="submit"
            form="edit-stage-sla-form"
            isLoading={updateMutation.isPending}
          >
            Lưu
          </Button>
        </>
      }
    >
      <form
        id="edit-stage-sla-form"
        noValidate
        onSubmit={handleSubmit((values) => updateMutation.mutate(values))}
      >
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
              error={fieldState.error?.message ?? errors.slaHours?.message}
            />
          )}
        />
      </form>
    </Modal>
  );
}
