import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Kanban as KanbanIcon } from '@phosphor-icons/react';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { useNotification } from '@/hooks/useNotification';
import { getKanbanBoard, moveApplicationStage } from '../api/kanbanApi';
import { KanbanColumn } from './KanbanColumn';

interface KanbanBoardViewProps {
  jobId: string;
}

/**
 * UC-22/UC-23: bảng Kanban ứng viên của 1 Job cụ thể (kéo-thả để chuyển Stage)
 */
export function KanbanBoardView({ jobId }: KanbanBoardViewProps) {
  const notify = useNotification();
  const queryClient = useQueryClient();
  const [dragState, setDragState] = useState<{
    applicationId: string;
    fromStageId: number;
  } | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<number | null>(null);
  const [movingApplicationId, setMovingApplicationId] = useState<string | null>(null);

  const boardQueryKey = ['kanban', 'board', jobId];
  const {
    data: board,
    isLoading: isLoadingBoard,
    isError: isBoardError,
  } = useQuery({
    queryKey: boardQueryKey,
    queryFn: () => getKanbanBoard(jobId),
  });

  const moveMutation = useMutation({
    mutationFn: ({ applicationId, targetStageId }: { applicationId: string; targetStageId: number }) =>
      moveApplicationStage(applicationId, targetStageId),
    onSuccess: () => {
      notify.success('Đã chuyển Stage ứng viên.');
      queryClient.invalidateQueries({ queryKey: boardQueryKey });
    },
    // EX (BR-KANBAN-03): Stage terminal/inactive, hoặc không đúng quyền sở hữu Job
    // (RBAC Layer 4) — server từ chối, board giữ nguyên trạng thái trước đó.
    onError: (error) => {
      notify.error(error);
    },
    onSettled: () => {
      setMovingApplicationId(null);
    },
  });

  function handleDragStartCard(applicationId: string, fromStageId: number) {
    setDragState({ applicationId, fromStageId });
  }

  function handleDragEndCard() {
    setDragState(null);
    setDragOverStageId(null);
  }

  function handleDrop(targetStageId: number) {
    setDragOverStageId(null);
    if (!dragState || dragState.fromStageId === targetStageId) {
      setDragState(null);
      return;
    }
    setMovingApplicationId(dragState.applicationId);
    moveMutation.mutate({ applicationId: dragState.applicationId, targetStageId });
    setDragState(null);
  }

  if (isLoadingBoard) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-72 shrink-0 rounded-lg" />
        ))}
      </div>
    );
  }

  if (isBoardError || !board) {
    return (
      <div className="shadow-elevation-1 flex flex-col items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-16 text-center">
        <span className="text-sm text-danger-600">
          Không thể tải Kanban board cho vị trí này. Vui lòng thử lại sau.
        </span>
      </div>
    );
  }

  if (board.columns.length === 0) {
    return (
      <div className="shadow-elevation-1 flex flex-col items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-16 text-center">
        <KanbanIcon className="size-8 text-neutral-300" />
        <p className="text-sm text-neutral-500">
          Vị trí này chưa gán quy trình tuyển dụng (Pipeline Template) nên chưa có Stage nào để hiển thị.
        </p>
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {board.columns.map((column) => (
        <KanbanColumn
          key={column.stageId}
          column={column}
          draggedApplicationId={dragState?.applicationId ?? null}
          isDragOver={dragOverStageId === column.stageId}
          isMoving={movingApplicationId !== null}
          onDragStartCard={handleDragStartCard}
          onDragEndCard={handleDragEndCard}
          onDragOver={() => setDragOverStageId(column.stageId)}
          onDragLeave={() =>
            setDragOverStageId((current) => (current === column.stageId ? null : current))
          }
          onDrop={() => handleDrop(column.stageId)}
        />
      ))}
    </div>
  );
}
