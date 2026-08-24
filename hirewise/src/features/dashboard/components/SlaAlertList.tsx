import { Button } from '@/components/ui/Button/Button';
import { getInitials } from '@/utils/formatters';

export interface SlaAlertDatum {
  id: string;
  candidateName: string;
  jobTitle: string;
  stageName: string;
  daysOverdue: number;
}

export interface SlaAlertListProps {
  items: SlaAlertDatum[];
  onRemind?: (id: string) => void;
}

/** Danh sách ứng viên vi phạm SLA (BR-SLA-02) — cảnh báo đỏ, nút nhắc Recruiter. */
export function SlaAlertList({ items, onRemind }: SlaAlertListProps) {
  if (items.length === 0) {
    return <p className="text-sm text-neutral-400">Không có hồ sơ nào vi phạm SLA. 🎉</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="border-danger-100 bg-danger-50 flex items-center gap-3 rounded-md border px-3 py-2.5"
        >
          <span className="border-danger-100 bg-neutral-0 text-danger-700 flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold">
            {getInitials(item.candidateName)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-neutral-900">
              {item.candidateName} — {item.jobTitle}
            </p>
            <p className="text-danger-700 mt-0.5 text-xs">
              Quá SLA {item.daysOverdue} ngày tại {item.stageName}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => onRemind?.(item.id)}>
            Nhắc Recruiter
          </Button>
        </div>
      ))}
    </div>
  );
}
