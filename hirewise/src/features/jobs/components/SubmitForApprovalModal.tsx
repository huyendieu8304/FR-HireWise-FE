import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { GitBranch, WarningCircle } from '@phosphor-icons/react';
import { Modal } from '@/components/ui/Modal/Modal';
import { Select } from '@/components/ui/Select/Select';
import { Badge } from '@/components/ui/Badge/Badge';
import { Button } from '@/components/ui/Button/Button';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { useNotification } from '@/hooks/useNotification';
import { listPipelineStages, listPipelineTemplates } from '@/features/pipelines/api/pipelinesApi';
import { STAGE_TYPE_LABELS } from '@/features/pipelines/types';
import { submitJobForApproval } from '../api/internalJobsApi';
import type { InternalJobDetail } from '../types';

export interface SubmitForApprovalModalProps {
  open: boolean;
  onClose: () => void;
  job: InternalJobDetail;
}

/**
 * UC-13 main flow: chọn 1 Pipeline Template đang ACTIVE để gán cho Job
 * Position (EX-01/ME-18: bắt buộc chọn), xem trước các Stage của Template
 * đó, rồi "Gửi duyệt" — backend chuyển job sang PENDING_APPROVAL và báo
 * cho Hiring Manager (EM-02).
 */
export function SubmitForApprovalModal({ open, onClose, job }: SubmitForApprovalModalProps) {
  const notify = useNotification();
  const queryClient = useQueryClient();
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | ''>('');

  const { data: templates, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['pipeline-templates'],
    queryFn: listPipelineTemplates,
    enabled: open,
  });

  // EX-02: chỉ Template đã ACTIVE mới được phép gán (BR-PIPE-01 — Template
  // DRAFT chưa chắc đủ Stage/Terminal hợp lệ để chạy Kanban thật).
  const activeTemplates = templates?.filter((t) => t.status === 'ACTIVE') ?? [];

  const { data: stages, isLoading: isLoadingStages } = useQuery({
    queryKey: ['pipeline-stages', selectedTemplateId],
    queryFn: () => listPipelineStages(selectedTemplateId as number),
    enabled: open && selectedTemplateId !== '',
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      submitJobForApproval(job.id, { pipelineTemplateId: selectedTemplateId as number }),
    onSuccess: () => {
      notify.success('Đã gửi vị trí tuyển dụng để chờ phê duyệt.');
      queryClient.invalidateQueries({ queryKey: ['jobs', 'internal-detail', job.id] });
      queryClient.invalidateQueries({ queryKey: ['jobs', 'internal-list'] });
      handleClose();
    },
    onError: (error) => {
      // BR-JOB-01/EX-01 (400), job không còn Draft/Rejected (409), Template
      // không ACTIVE (400) — apiClient đã tự toast message backend trả về.
      notify.error(error);
    },
  });

  function handleClose() {
    setSelectedTemplateId('');
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={() => !submitMutation.isPending && handleClose()}
      title="Gửi duyệt vị trí tuyển dụng"
      description={`Chọn quy trình tuyển dụng (Pipeline Template) áp dụng cho "${job.title}" trước khi gửi cho Hiring Manager phê duyệt.`}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={submitMutation.isPending}>
            Hủy
          </Button>
          <Button
            isLoading={submitMutation.isPending}
            disabled={selectedTemplateId === ''}
            onClick={() => submitMutation.mutate()}
          >
            Gửi duyệt
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Select
          label="Pipeline Template"
          placeholder={
            isLoadingTemplates ? 'Đang tải...' : 'Chọn quy trình tuyển dụng (Pipeline Template)'
          }
          required
          disabled={isLoadingTemplates}
          options={activeTemplates.map((t) => ({
            value: String(t.id),
            label: `${t.name}${t.departmentName ? ` (${t.departmentName})` : ' (Toàn hệ thống)'}`,
          }))}
          value={selectedTemplateId === '' ? '' : String(selectedTemplateId)}
          onChange={(e) => setSelectedTemplateId(e.target.value ? Number(e.target.value) : '')}
        />

        {!isLoadingTemplates && activeTemplates.length === 0 && (
          <div className="flex items-start gap-2 rounded-md border border-warning-200 bg-warning-50 p-3 text-xs text-warning-800">
            <WarningCircle className="mt-0.5 size-4 shrink-0" />
            <span>
              Chưa có Pipeline Template nào đang ACTIVE. Vào mục "Quản lý Pipeline" để kích hoạt
              một Template trước khi gửi duyệt.
            </span>
          </div>
        )}

        {selectedTemplateId !== '' && (
          <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              <GitBranch className="size-3.5" />
              Xem trước các Stage
            </div>
            {isLoadingStages && (
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
              </div>
            )}
            {!isLoadingStages && stages && stages.length === 0 && (
              <p className="text-xs text-neutral-400">Template này chưa có Stage nào.</p>
            )}
            {!isLoadingStages && stages && stages.length > 0 && (
              <ol className="flex flex-wrap items-center gap-1.5">
                {stages.map((stage, index) => (
                  <li key={stage.id} className="flex items-center gap-1.5">
                    <Badge variant={stage.terminal ? 'info' : 'neutral'}>
                      {index + 1}. {stage.name}
                    </Badge>
                    {index < stages.length - 1 && (
                      <span className="text-neutral-300" aria-hidden="true">
                        →
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            )}
            {!isLoadingStages && stages && stages.length > 0 && (
              <p className="mt-2 text-[11px] text-neutral-400">
                {STAGE_TYPE_LABELS[stages[0].stageType]} → ... →{' '}
                {STAGE_TYPE_LABELS[stages[stages.length - 1].stageType]}
              </p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
