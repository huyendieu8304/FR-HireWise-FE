import { Badge } from '@/components/ui/Badge/Badge';
import { cn } from '@/utils/cn';
import { ApplicationCard } from './ApplicationCard';
import type { KanbanStageColumn } from '../types';

interface KanbanColumnProps {
  column: KanbanStageColumn;
  draggedApplicationId: string | null;
  isDragOver: boolean;
  isMoving: boolean;
  onDragStartCard: (applicationId: string, fromStageId: number) => void;
  onDragEndCard: () => void;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDrop: () => void;
}

/**
 * UC-22: 1 cột Kanban (1 Pipeline Stage đang active) cùng toàn bộ
 * Application hiện tại của Stage đó. UC-23: là vùng thả (drop target) —
 * `PipelineManagementPage` chỉ kéo-thả TRONG 1 danh sách (sắp xếp), ở đây
 * card kéo được SANG CỘT KHÁC, nên logic thả nằm ở cấp cột thay vì cấp
 * dòng/thẻ.
 * <p>
 * BR-KANBAN-03: 1 Application đã ở Stage terminal (Hired/Refused) không
 * kéo đi tiếp được nữa (chưa có thao tác "Khôi phục") — card trong cột
 * terminal luôn hiển thị `draggable=false`.
 */
export function KanbanColumn({
  column,
  draggedApplicationId,
  isDragOver,
  isMoving,
  onDragStartCard,
  onDragEndCard,
  onDragOver,
  onDragLeave,
  onDrop,
}: KanbanColumnProps) {
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver();
      }}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
      className={cn(
        'flex w-72 shrink-0 flex-col gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 transition-colors',
        isDragOver && 'border-primary-400 bg-primary-50',
      )}
    >
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-neutral-900">{column.name}</span>
          {column.terminal && (
            <Badge variant="info" className="text-[10px] px-1.5 py-0">
              Terminal
            </Badge>
          )}
        </div>
        <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-semibold text-neutral-600">
          {column.applications.length}
        </span>
      </div>

      <div className="flex min-h-24 flex-col gap-2">
        {column.applications.length === 0 && (
          <p className="px-1 py-6 text-center text-xs text-neutral-400">
            Chưa có ứng viên ở Stage này.
          </p>
        )}
        {column.applications.map((application) => (
          <ApplicationCard
            key={application.applicationId}
            application={application}
            isDragging={draggedApplicationId === application.applicationId}
            draggable={!column.terminal && !isMoving}
            onDragStart={() => onDragStartCard(application.applicationId, column.stageId)}
            onDragEnd={onDragEndCard}
          />
        ))}
      </div>
    </div>
  );
}
