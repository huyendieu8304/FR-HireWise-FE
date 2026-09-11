import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal/Modal';
import { TextInput } from '@/components/ui/TextInput/TextInput';
import { Button } from '@/components/ui/Button/Button';
import { useNotification } from '@/hooks/useNotification';
import { createScorecardTemplate, updateScorecardTemplate } from '../api/scorecardsApi';
import {
  ScorecardCriteriaTableEditor,
  emptyScorecardCriterion,
  validateScorecardForm,
} from './ScorecardCriteriaTableEditor';
import type { ScorecardCriterionInput, ScorecardTemplate } from '../types';

export interface ScorecardTemplateFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Có giá trị = đang sửa 1 Template hiện có; `undefined` = tạo mới. */
  template?: ScorecardTemplate;
}

function criteriaFromTemplate(template: ScorecardTemplate): ScorecardCriterionInput[] {
  return template.criteria.map((c) => ({
    name: c.name,
    description: c.description ?? '',
    weight: c.weight,
    maxScore: c.maxScore,
    required: c.required,
  }));
}

/**
 * UC-27: tạo/sửa 1 Master Scorecard Template — thư viện mẫu dùng chung
 * toàn hệ thống của HR Admin (không gắn Job/Stage nào, không versioning —
 * chỉ là bản gốc để Hiring Manager nhân bản khi cấu hình Scorecard thật cho
 * từng Stage phỏng vấn, xem `JobStageScorecardFormModal`). Luôn sửa TẠI CHỖ.
 * <p>
 * Component ngoài này chỉ quyết định có mount hay không (`open`); phần form
 * thật nằm ở {@link ScorecardTemplateFormModalInner}, được remount mỗi lần
 * mở (`key={template?.id ?? 'new'}`) để state khởi tạo TRỰC TIẾP từ
 * `template` lúc mount, không cần đồng bộ qua `useEffect` + `setState`
 * (tránh cascading render, xem `react-hooks/set-state-in-effect`).
 */
export function ScorecardTemplateFormModal({ open, onClose, template }: ScorecardTemplateFormModalProps) {
  if (!open) return null;
  return <ScorecardTemplateFormModalInner key={template?.id ?? 'new'} onClose={onClose} template={template} />;
}

interface ScorecardTemplateFormModalInnerProps {
  onClose: () => void;
  template?: ScorecardTemplate;
}

function ScorecardTemplateFormModalInner({ onClose, template }: ScorecardTemplateFormModalInnerProps) {
  const notify = useNotification();
  const queryClient = useQueryClient();
  const isEditing = !!template;

  const [name, setName] = useState(template?.name ?? '');
  const [criteria, setCriteria] = useState<ScorecardCriterionInput[]>(() =>
    template ? criteriaFromTemplate(template) : [emptyScorecardCriterion()],
  );
  const [formError, setFormError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: () => {
      const request = { name, criteria };
      return isEditing ? updateScorecardTemplate(template!.id, request) : createScorecardTemplate(request);
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['scorecard-templates'] });
      notify.success(`Đã lưu Template "${saved.name}".`);
      onClose();
    },
    onError: (error) => notify.error(error),
  });

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
      title={isEditing ? `Sửa Template — ${template.name}` : 'Tạo Scorecard Template mới'}
      description="Bản mẫu dùng chung toàn hệ thống — chỉ để tham khảo/nhân bản, không dùng trực tiếp để chấm điểm."
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button isLoading={saveMutation.isPending} onClick={handleSubmit}>
            Lưu Template
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <TextInput
          label="Tên Template"
          placeholder="vd. Technical - Backend"
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
