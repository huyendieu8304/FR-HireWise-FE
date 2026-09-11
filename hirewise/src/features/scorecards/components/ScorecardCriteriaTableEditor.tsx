import { Plus, Trash } from '@phosphor-icons/react';
import { TextInput } from '@/components/ui/TextInput/TextInput';
import { NumberInput } from '@/components/ui/NumberInput/NumberInput';
import { Button } from '@/components/ui/Button/Button';
import type { ScorecardCriterionInput } from '../types';

export interface ScorecardCriteriaTableEditorProps {
  criteria: ScorecardCriterionInput[];
  onChange: (criteria: ScorecardCriterionInput[]) => void;
}

export function emptyScorecardCriterion(): ScorecardCriterionInput {
  return { name: '', description: '', weight: 1, maxScore: 5, required: true };
}

/**
 * Bảng tiêu chí động (thêm/xoá/sửa dòng) dùng chung cho cả form Master
 * Template (HR Admin, UC-27) lẫn form Job-Stage Scorecard (Hiring Manager,
 * UC-27 step 3) — cùng 1 shape `ScorecardCriterionInput[]` cho cả 2. State
 * cục bộ đơn giản (không `useFieldArray`) — xem `08-...Cach-code.md` mục 10
 * cho lý do.
 */
export function ScorecardCriteriaTableEditor({ criteria, onChange }: ScorecardCriteriaTableEditorProps) {
  function updateCriterion(index: number, patch: Partial<ScorecardCriterionInput>) {
    onChange(criteria.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }

  function removeCriterion(index: number) {
    onChange(criteria.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-800">Tiêu chí đánh giá</span>
        <Button variant="ghost" size="sm" onClick={() => onChange([...criteria, emptyScorecardCriterion()])}>
          <Plus className="mr-1 size-4" />
          Thêm tiêu chí
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {criteria.map((criterion, index) => (
          <div key={index} className="rounded-lg border border-neutral-200 p-3">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <TextInput
                  label="Tên tiêu chí"
                  placeholder="vd. Kỹ năng chuyên môn"
                  required
                  value={criterion.name}
                  onChange={(e) => updateCriterion(index, { name: e.target.value })}
                />
              </div>
              <button
                type="button"
                aria-label="Xóa tiêu chí"
                onClick={() => removeCriterion(index)}
                disabled={criteria.length === 1}
                className="mt-7 shrink-0 rounded-md p-2 text-neutral-300 transition-colors hover:bg-danger-50 hover:text-danger-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash className="size-4" />
              </button>
            </div>

            <TextInput
              label="Mô tả (không bắt buộc)"
              containerClassName="mt-3"
              placeholder="Gợi ý những gì evaluator nên đánh giá ở tiêu chí này"
              value={criterion.description}
              onChange={(e) => updateCriterion(index, { description: e.target.value })}
            />

            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <NumberInput
                label="Trọng số"
                value={criterion.weight}
                onChange={(value) => updateCriterion(index, { weight: value ?? 0 })}
                decimalPlaces={2}
                min={0}
              />
              <NumberInput
                label="Thang điểm tối đa"
                value={criterion.maxScore}
                onChange={(value) => updateCriterion(index, { maxScore: value ?? 0 })}
                min={1}
              />
              <label className="mt-6 flex items-center gap-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={criterion.required}
                  onChange={(e) => updateCriterion(index, { required: e.target.checked })}
                  className="size-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500/30"
                />
                Bắt buộc chấm điểm
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Validate dùng chung trước khi lưu — tên Template/Scorecard + criteria hợp lệ (BE vẫn validate lại). */
export function validateScorecardForm(name: string, criteria: ScorecardCriterionInput[]): string | null {
  if (!name.trim()) {
    return 'Vui lòng nhập tên.';
  }
  if (criteria.length === 0) {
    return 'Cần ít nhất 1 tiêu chí.';
  }
  const invalid = criteria.some((c) => !c.name.trim() || c.weight <= 0 || c.maxScore <= 0);
  if (invalid) {
    return 'Mỗi tiêu chí cần có tên, trọng số và thang điểm tối đa lớn hơn 0.';
  }
  return null;
}
