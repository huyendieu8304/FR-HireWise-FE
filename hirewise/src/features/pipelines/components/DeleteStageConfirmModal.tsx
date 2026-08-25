import { useMutation, useQueryClient } from '@tanstack/react-query';
import { WarningCircle } from '@phosphor-icons/react';
import { Modal } from '@/components/ui/Modal/Modal';
import { Button } from '@/components/ui/Button/Button';
import { useNotification } from '@/hooks/useNotification';
import { deletePipelineStage } from '../api/pipelinesApi';
import type { PipelineStage } from '../types';

export interface DeleteStageConfirmModalProps {
  /** `null` = đóng modal. */
  stage: PipelineStage | null;
  pipelineTemplateId: number;
  onClose: () => void;
}

/**
 * UC-06: xác nhận xóa 1 Stage. `stage.applicationCount` đã có sẵn từ
 * response `listPipelineStages` (xem `PipelineStageResponseDto.applicationCount`
 * ở backend) — biết trước ngay khi mở modal, KHÔNG cần gọi thêm API để
 * quyết định có cho xóa hay không, khớp đúng Screen Description UC-06:
 * *"Nút [Xác nhận xóa] (màu đỏ); disable nếu đang có ứng viên."*
 */
export function DeleteStageConfirmModal({
  stage,
  pipelineTemplateId,
  onClose,
}: DeleteStageConfirmModalProps) {
  const notify = useNotification();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => deletePipelineStage(pipelineTemplateId, stage!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['pipeline-stages', pipelineTemplateId],
      });
      notify.success(`Đã xóa Stage "${stage!.name}".`);
      onClose();
    },
    // 409 PIPELINE_STAGE_HAS_APPLICATIONS gần như không thể xảy ra ở đây vì nút xác nhận
    // đã bị disable trước theo applicationCount đã biết — nhưng vẫn giữ nhánh xử lý cho
    // trường hợp có Application phát sinh ĐÚNG lúc đang mở modal (race condition thật).
    onError: (error) => notify.error(error),
  });

  const hasApplications = (stage?.applicationCount ?? 0) > 0;

  return (
    <Modal
      open={stage !== null}
      onClose={onClose}
      title={`Xóa Stage "${stage?.name}"?`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            variant="danger"
            disabled={hasApplications}
            isLoading={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
          >
            Xác nhận xóa
          </Button>
        </>
      }
    >
      {hasApplications ? (
        <div className="bg-danger-50 flex items-start gap-2 rounded-md p-3">
          <WarningCircle
            weight="fill"
            className="text-danger-600 mt-0.5 size-5 shrink-0"
          />
          <p className="text-danger-700 text-sm">
            Không thể xóa Stage này vì đang có {stage?.applicationCount} ứng viên. Vui
            lòng di chuyển ứng viên sang Stage khác trước.
          </p>
        </div>
      ) : (
        <p className="text-sm text-neutral-600">
          Bạn có chắc muốn xóa Stage này? Hành động này không thể hoàn tác.
        </p>
      )}
    </Modal>
  );
}
