import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Kanban as KanbanIcon } from '@phosphor-icons/react';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { useNotification } from '@/hooks/useNotification';
import { ROUTES } from '@/constants/routes';
import { getKanbanBoard, moveApplicationStage } from '../api/kanbanApi';
import { KanbanColumn } from './KanbanColumn';
import { ScheduleInterviewModal } from './ScheduleInterviewModal';

interface KanbanBoardViewProps {
  jobId: string;
}

/**
 * UC-22/UC-23/UC-24: bảng Kanban ứng viên của 1 Job cụ thể (kéo-thả để chuyển Stage,
 * popup lên lịch phỏng vấn khi kéo sang stage INTERVIEW)
 */
export function KanbanBoardView({ jobId }: KanbanBoardViewProps) {
  const notify = useNotification();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [dragState, setDragState] = useState<{
    applicationId: string;
    fromStageId: number;
  } | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<number | null>(null);
  const [movingApplicationId, setMovingApplicationId] = useState<string | null>(null);
  const [interviewModalState, setInterviewModalState] = useState<{
    applicationId: string;
    candidateName: string;
    targetStageId: number;
    targetStageName: string;
  } | null>(null);

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

  // UC-20: mở Applicant Card chi tiết — điểm vào duy nhất của UC-29 (Từ chối ứng viên).
  function handleCardClick(applicationId: string) {
    navigate(ROUTES.APPLICATION_DETAIL.replace(':applicationId', applicationId));
  }

  function handleDrop(targetStageId: number) {
    setDragOverStageId(null);
    if (!dragState || dragState.fromStageId === targetStageId) {
      setDragState(null);
      return;
    }

    const targetColumn = board?.columns.find((c) => c.stageId === targetStageId);
    if (targetColumn && targetColumn.stageType === 'INTERVIEW') {
      const sourceColumn = board?.columns.find((c) => c.stageId === dragState.fromStageId);
      const app = sourceColumn?.applications.find((a) => a.applicationId === dragState.applicationId);
      const candidateName = app?.candidateName || 'Ứng viên';

      setInterviewModalState({
        applicationId: dragState.applicationId,
        candidateName,
        targetStageId,
        targetStageName: targetColumn.name,
      });
      setDragState(null);
      return;
    }

    setMovingApplicationId(dragState.applicationId);
    moveMutation.mutate({ applicationId: dragState.applicationId, targetStageId });
    setDragState(null);
  }

  function handleInterviewScheduled() {
    setInterviewModalState(null);
    queryClient.invalidateQueries({ queryKey: boardQueryKey });
  }

  function handleInterviewSkip() {
    if (interviewModalState) {
      setMovingApplicationId(interviewModalState.applicationId);
      moveMutation.mutate({
        applicationId: interviewModalState.applicationId,
        targetStageId: interviewModalState.targetStageId,
      });
      setInterviewModalState(null);
    }
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
    <>
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
            onCardClick={handleCardClick}
          />
        ))}
      </div>

      {interviewModalState && (
        <ScheduleInterviewModal
          open={Boolean(interviewModalState)}
          applicationId={interviewModalState.applicationId}
          candidateName={interviewModalState.candidateName}
          targetStageId={interviewModalState.targetStageId}
          targetStageName={interviewModalState.targetStageName}
          onClose={() => setInterviewModalState(null)}
          onSkip={handleInterviewSkip}
          onScheduled={handleInterviewScheduled}
        />
      )}
    </>
  );
}
