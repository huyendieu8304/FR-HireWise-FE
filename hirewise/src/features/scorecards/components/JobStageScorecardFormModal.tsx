import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal/Modal';
import { TextInput } from '@/components/ui/TextInput/TextInput';
import { Select } from '@/components/ui/Select/Select';
import { Button } from '@/components/ui/Button/Button';
import { useNotification } from '@/hooks/useNotification';
import { listScorecardTemplates, saveJobStageScorecard } from '../api/scorecardsApi';
import {
  ScorecardCriteriaTableEditor,
  emptyScorecardCriterion,
  validateScorecardForm,
} from './ScorecardCriteriaTableEditor';
import type { JobStageScorecard, ScorecardCriterionInput } from '../types';

export interface JobStageScorecardFormModalProps {
  open: boolean;
  onClose: () => void;
  jobId: string;
  pipelineStageId: number;
  stageName: string;
  /** Có giá trị = Stage này đã có Scorecard, đang sửa lại; `undefined` = cấu hình lần đầu. */
  existing?: JobStageScorecard;
  /** Gọi lại sau khi lưu thành công, để trang cha (Approval detail) refetch checklist. */
  onSaved?: () => void;
}

function criteriaFrom(source: { criteria: { name: string; description: string | null; weight: number; maxScore: number; required: boolean }[] }): ScorecardCriterionInput[] {
  return source.criteria.map((c) => ({
    name: c.name,
    description: c.description ?? '',
    weight: c.weight,
    maxScore: c.maxScore,
    required: c.required,
  }));
}

/**
 * UC-27 step 3: Hiring Manager cấu hình Scorecard THẬT cho 1 cặp (Job,
 * Stage phỏng vấn) — bắt buộc phải có cho MỌI Stage loại Interview trước
 * khi Job được Approve (UC-14/15 hard gate, xem `ApprovalDetailPage`), và
 * vẫn sửa lại được bất cứ lúc nào sau đó. 2 điểm khởi đầu: chọn 1 Master
 * Template có sẵn để nhân bản rồi tùy chỉnh, hoặc tạo hoàn toàn từ đầu.
 */
export function JobStageScorecardFormModal({
  open,
  onClose,
  jobId,
  pipelineStageId,
  stageName,
  existing,
  onSaved,
}: JobStageScorecardFormModalProps) {
  if (!open) return null;
  return (
    <JobStageScorecardFormModalInner
      key={existing?.id ?? `${jobId}-${pipelineStageId}`}
      onClose={onClose}
      jobId={jobId}
      pipelineStageId={pipelineStageId}
      stageName={stageName}
      existing={existing}
      onSaved={onSaved}
    />
  );
}

type Props = Omit<JobStageScorecardFormModalProps, 'open'>;

function JobStageScorecardFormModalInner({ onClose, jobId, pipelineStageId, stageName, existing, onSaved }: Props) {
  const notify = useNotification();
  const queryClient = useQueryClient();
  const isEditing = !!existing;

  const [name, setName] = useState(existing?.name ?? `Scorecard - ${stageName}`);
  const [sourceMasterTemplateId, setSourceMasterTemplateId] = useState(existing?.sourceMasterTemplateId ?? '');
  const [criteria, setCriteria] = useState<ScorecardCriterionInput[]>(() =>
    existing ? criteriaFrom(existing) : [emptyScorecardCriterion()],
  );
  const [formError, setFormError] = useState<string | null>(null);

  const { data: masterTemplates } = useQuery({
    queryKey: ['scorecard-templates'],
    queryFn: listScorecardTemplates,
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      saveJobStageScorecard(jobId, pipelineStageId, {
        name,
        sourceMasterTemplateId: sourceMasterTemplateId || null,
        criteria,
      }),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['job-approvals', 'detail', jobId] });
      notify.success(
        isEditing && saved.version > (existing?.version ?? 1)
          ? `Đã lưu — vì Scorecard này đã có người chấm điểm, hệ thống tạo phiên bản mới (v${saved.version}).`
          : `Đã lưu Scorecard cho Stage "${stageName}".`,
      );
      onSaved?.();
      onClose();
    },
    onError: (error) => notify.error(error),
  });

  function handlePickMasterTemplate(templateId: string) {
    setSourceMasterTemplateId(templateId);
    const master = masterTemplates?.find((t) => t.id === templateId);
    if (master) {
      setName(`${master.name} - ${stageName}`);
      setCriteria(criteriaFrom(master));
    }
  }

  function handleSubmit() {
    const error = validateScorecardForm(name, criteria);
    setFormError(error);
    if (error) return;
    saveMutation.mutate();
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEditing ? `Sửa Scorecard — ${stageName}` : `Cấu hình Scorecard — ${stageName}`}
      description="Scorecard này chỉ áp dụng cho đúng Stage phỏng vấn này của Job hiện tại."
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button isLoading={saveMutation.isPending} onClick={handleSubmit}>
            Lưu Scorecard
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {!isEditing && (
          <Select
            label="Bắt đầu từ Master Template (tùy chọn)"
            placeholder="Tạo hoàn toàn từ đầu"
            options={(masterTemplates ?? []).map((t) => ({ value: t.id, label: t.name }))}
            value={sourceMasterTemplateId}
            onChange={(e) => handlePickMasterTemplate(e.target.value)}
          />
        )}

        <TextInput
          label="Tên Scorecard"
          placeholder="vd. Technical Interview - Backend Engineer"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <ScorecardCriteriaTableEditor criteria={criteria} onChange={setCriteria} />

        {formError && <p className="text-sm text-danger-600">{formError}</p>}
      </div>
    </Modal>
  );
}
