import { EnvelopeSimple, Phone } from '@phosphor-icons/react';
import { Badge, type BadgeVariant } from '@/components/ui/Badge/Badge';
import { formatRelativeTime } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import { APPLICATION_STATUS_LABELS, type ApplicationCard as ApplicationCardData } from '../types';

const STATUS_BADGE_VARIANT: Record<ApplicationCardData['status'], BadgeVariant> = {
  NEW: 'info',
  IN_PROGRESS: 'primary',
  OFFER_SENT: 'warning',
  HIRED: 'success',
  REFUSED: 'danger',
  WITHDRAWN: 'neutral',
};

interface ApplicationCardProps {
  application: ApplicationCardData;
  isDragging: boolean;
  draggable: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  /** UC-20: mở Applicant Card chi tiết khi click vào thẻ (không phải khi đang kéo-thả). */
  onClick: () => void;
}

/**
 * UC-22: 1 thẻ ứng viên trên Kanban board. UC-23: kéo được (khi cột chưa
 * phải Stage terminal — xem `KanbanColumn`) để đổi Stage bằng thao tác
 * kéo-thả gốc HTML5, cùng 1 pattern với `PipelineManagementPage` (kéo-thả
 * sắp xếp Stage) để nhất quán cảm giác thao tác trong toàn app.
 */
export function ApplicationCard({
  application,
  isDragging,
  draggable,
  onDragStart,
  onDragEnd,
  onClick,
}: ApplicationCardProps) {
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={cn(
        'shadow-elevation-1 flex flex-col gap-2 rounded-lg border border-neutral-200 bg-white p-3 transition-opacity hover:border-primary-300 hover:shadow-elevation-2',
        draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer opacity-90',
        isDragging && 'opacity-40',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold text-neutral-900">
          {application.candidateName}
        </span>
        <Badge variant={STATUS_BADGE_VARIANT[application.status]} className="shrink-0">
          {APPLICATION_STATUS_LABELS[application.status]}
        </Badge>
      </div>

      <div className="flex flex-col gap-1 text-xs text-neutral-500">
        <span className="flex items-center gap-1.5 truncate">
          <EnvelopeSimple className="size-3.5 shrink-0" />
          <span className="truncate">{application.candidateEmail}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Phone className="size-3.5 shrink-0" />
          {application.candidatePhone}
        </span>
      </div>

      <p className="text-[11px] text-neutral-400">
        {application.lastStageChangedAt
          ? `Vào Stage này ${formatRelativeTime(application.lastStageChangedAt)}`
          : `Ứng tuyển ${formatRelativeTime(application.appliedAt)}`}
      </p>
    </div>
  );
}
