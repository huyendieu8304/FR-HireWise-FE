import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Kanban as KanbanIcon } from '@phosphor-icons/react';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotification } from '@/hooks/useNotification';
import { ROUTES } from '@/constants/routes';
import { getKanbanBoard, moveApplicationStage, runAiScreeningBatch } from '../api/kanbanApi';
import { KanbanColumn } from './KanbanColumn';
import { ScheduleInterviewModal } from './ScheduleInterviewModal';

interface KanbanBoardViewProps {
  jobId: string;
}

/**
 * UC-22/UC-23/UC-24: bảng Kanban ứng viên của 1 Job cụ thể (kéo-thả để chuyển Stage,
 * popup lên lịch phỏng vấn khi kéo sang stage INTERVIEW). UC-21: cột "Mới" (INTAKE)
 * có thêm nút "Quét cả cột" để enqueue AI Screening hàng loạt (xem `KanbanColumn`).
 */
export function KanbanBoardView({ jobId }: KanbanBoardViewProps) {
  const notify = useNotification();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  // UI-only gate — quyền thật (AI_VIEW) luôn được backend kiểm tra lại; đây
  // chỉ để ẩn nút với ai chắc chắn không có quyền (cùng pattern ApplicantCardPage).
  const canRunAi = currentUser?.permissions.includes('AI_VIEW') ?? false;
  const [dragState, setDragState] = useState<{
    applicationId: string;
    fromStageId: number;
  } | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<number | null>(null);
  const [movingApplicationId, setMovingApplicationId] = useState<string | null>(null);
  const [scanningStageId, setScanningStageId] = useState<number | null>(null);
  // UC-21: mốc thời gian dừng tự động làm mới board sau khi "Quét cả cột" -
  // `null` = không poll. So sánh với `Date.now()` bên trong callback
  // `refetchInterval` (gọi bởi TanStack Query, không phải lúc render) chứ
  // không tính trực tiếp trong thân component — Date.now() là hàm impure,
  // gọi thẳng trong render vi phạm quy tắc render phải thuần khiết.
  const [aiPollingDeadline, setAiPollingDeadline] = useState<number | null>(null);
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
    // UC-21: badge % AI trên card (aiMatchScore) chỉ đổi khi
    // event.AiScreeningDispatcher xử lý xong ở backend (vài chục giây sau,
    // bất đồng bộ) - không tự đẩy dữ liệu về FE. Poll tạm thời (4s/lần,
    // trong 2 phút) ngay sau khi "Quét cả cột" để % tự hiện lên mà không
    // cần F5 trang, thay vì poll vĩnh viễn khi chẳng có gì để chờ.
    refetchInterval: () => (aiPollingDeadline !== null && Date.now() < aiPollingDeadline ? 4000 : false),
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

  // UC-21 "Quét cả cột": AI Screening giờ chạy hoàn toàn thủ công - nút này
  // enqueue 1 lượt cho MỌI ứng viên CHƯA có điểm AI đang ở cột "Mới" thay vì
  // bấm "Phân tích lại" từng thẻ (hồ sơ đã có điểm bị backend tự bỏ qua,
  // không tốn thêm lời gọi Claude nào). Sau khi queue xong, bật poll board
  // tạm thời (đặt `aiPollingDeadline` ở trên) để % tự hiện lên khi
  // `event.AiScreeningDispatcher` xử lý xong, không cần F5 trang.
  const scanColumnMutation = useMutation({
    mutationFn: (stageId: number) => runAiScreeningBatch(jobId, stageId),
    onSuccess: (result) => {
      if (result.totalApplications === 0) {
        notify.info('Cột này chưa có ứng viên nào để quét.');
        return;
      }
      if (result.queuedCount === 0) {
        notify.info(
          result.alreadyAnalyzedCount > 0
            ? `Cả ${result.alreadyAnalyzedCount} hồ sơ trong cột này đều đã có điểm AI từ trước.`
            : 'Không có hồ sơ nào đủ điều kiện để phân tích (thiếu CV hoặc CV không phải .pdf).',
        );
        return;
      }

      const notes: string[] = [];
      if (result.alreadyAnalyzedCount > 0) notes.push(`${result.alreadyAnalyzedCount} đã có điểm từ trước`);
      if (result.skippedCount > 0) notes.push(`${result.skippedCount} bị bỏ qua do thiếu CV/không phải .pdf`);
      notify.success(
        `Đã bắt đầu phân tích AI cho ${result.queuedCount}/${result.totalApplications} hồ sơ` +
          (notes.length > 0 ? ` (${notes.join(', ')}).` : '.'),
      );
      setAiPollingDeadline(Date.now() + 2 * 60 * 1000);
    },
    onError: (error) => notify.error(error),
    onSettled: () => setScanningStageId(null),
  });

  function handleScanColumnAi(stageId: number) {
    setScanningStageId(stageId);
    scanColumnMutation.mutate(stageId);
  }

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
            canRunAi={canRunAi}
            isScanningAi={scanningStageId === column.stageId}
            onScanColumnAi={() => handleScanColumnAi(column.stageId)}
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
