import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Kanban as KanbanIcon } from '@phosphor-icons/react';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotification } from '@/hooks/useNotification';
import { ROUTES } from '@/constants/routes';
import { RejectApplicationModal } from '@/features/applications/components/RejectApplicationModal';
import { CreateOfferModal } from '@/features/offers/components/CreateOfferModal';
import { getKanbanBoard, moveApplicationStage, runAiScreeningBatch } from '../api/kanbanApi';
import { KanbanColumn } from './KanbanColumn';
import { ScheduleInterviewModal } from './ScheduleInterviewModal';

interface KanbanBoardViewProps {
  jobId: string;
}

/**
 * UC-23: thao tác bắt buộc phải hoàn tất trước khi việc chuyển Stage được ghi
 * nhận, khi thẻ được thả vào 1 cột "quan trọng". Mỗi nhánh mở đúng dialog mà
 * Applicant Card dùng cho hành động đó, nên hai lối vào cho cùng 1 nghiệp vụ
 * không bao giờ lệch nhau.
 */
type PendingStageAction = {
  kind: 'INTERVIEW' | 'OFFER' | 'REJECT';
  applicationId: string;
  candidateName: string;
  targetStageId: number;
  targetStageName: string;
};

/**
 * UC-22/UC-23/UC-24: bảng Kanban ứng viên của 1 Job cụ thể (kéo-thả để chuyển Stage).
 * UC-21: cột "Mới" (INTAKE) có thêm nút "Quét cả cột" để enqueue AI Screening hàng
 * loạt (xem `KanbanColumn`).
 *
 * Thả vào 1 cột "quan trọng" không chuyển Stage ngay mà mở dialog tương ứng —
 * đúng dialog của nút trong Applicant Card — và chỉ khi hành động hoàn tất thì
 * Stage mới đổi (xem `PendingStageAction`, `handleDrop`):
 *
 * - `INTERVIEW` -> lên lịch phỏng vấn (`ScheduleInterviewModal`)
 * - `OFFER` -> tạo Offer nháp (`CreateOfferModal`, UC-36)
 * - `TERMINAL_REJECTED` -> chọn lý do từ chối (`RejectApplicationModal`, UC-29/30)
 * - `TERMINAL_SUCCESS` -> chặn hẳn: `HIRED` chỉ đến từ việc ứng viên ký Offer (UC-39)
 *
 * Bấm Hủy trong mọi dialog là board đứng yên: không có optimistic update nào ở
 * đây, thẻ chỉ dịch chuyển sau khi `invalidateQueries` nạp lại board.
 */
export function KanbanBoardView({ jobId }: KanbanBoardViewProps) {
  const notify = useNotification();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  // UI-only gate — quyền thật (AI_VIEW) luôn được backend kiểm tra lại; đây
  // chỉ để ẩn nút với ai chắc chắn không có quyền (cùng pattern ApplicantCardPage).
  const canRunAi = currentUser?.permissions.includes('AI_VIEW') ?? false;
  const canCreateOffer = currentUser?.permissions.includes('OFFER_CREATE') ?? false;
  const canReject = currentUser?.permissions.includes('APPLICATION_REJECT') ?? false;
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
  const [pendingAction, setPendingAction] = useState<PendingStageAction | null>(null);

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

  // UC-20: mở Applicant Card chi tiết (tạo Offer, từ chối, xem điểm AI...).
  function handleCardClick(applicationId: string) {
    navigate(ROUTES.APPLICATION_DETAIL.replace(':applicationId', applicationId));
  }

  function handleDrop(targetStageId: number) {
    setDragOverStageId(null);
    if (!dragState || dragState.fromStageId === targetStageId) {
      setDragState(null);
      return;
    }

    const { applicationId, fromStageId } = dragState;
    setDragState(null);

    const targetColumn = board?.columns.find((c) => c.stageId === targetStageId);
    if (!targetColumn) {
      return;
    }

    const sourceColumn = board?.columns.find((c) => c.stageId === fromStageId);
    const candidateName =
      sourceColumn?.applications.find((a) => a.applicationId === applicationId)?.candidateName ||
      'Ứng viên';
    const pending = (kind: PendingStageAction['kind']) =>
      setPendingAction({
        kind,
        applicationId,
        candidateName,
        targetStageId,
        targetStageName: targetColumn.name,
      });

    // UC-23: 4 Stage type "quan trọng" không bao giờ chuyển bằng 1 cú thả trần.
    // Ba cái đầu mở dialog và chỉ ghi nhận Stage khi hành động xong; cái cuối
    // không có lối vào thủ công nào cả.
    switch (targetColumn.stageType) {
      case 'INTERVIEW':
        pending('INTERVIEW');
        return;

      case 'OFFER':
        // Gate UI (quyền thật luôn được backend kiểm tra lại): mở form Offer
        // cho người không có quyền tạo chỉ để họ ăn 403 lúc bấm là vô ích.
        if (!canCreateOffer) {
          notify.error('Bạn không có quyền tạo Offer nên không thể chuyển hồ sơ sang Stage này.');
          return;
        }
        pending('OFFER');
        return;

      case 'TERMINAL_REJECTED':
        // BR-REJ-01/02: từ chối luôn phải có lý do chuẩn hóa và email gửi ứng
        // viên. Thả trần trước đây bỏ qua cả hai.
        if (!canReject) {
          notify.error('Bạn không có quyền từ chối ứng viên nên không thể chuyển hồ sơ sang Stage này.');
          return;
        }
        pending('REJECT');
        return;

      case 'TERMINAL_SUCCESS':
        // UC-39: hồ sơ chỉ thành "Trúng tuyển" khi ứng viên ký Offer điện tử
        // (OfferSigningService ghi nhận là transition SYSTEM). Kéo tay vào đây
        // sẽ tạo ra một hồ sơ trúng tuyển chưa từng ký gì, mà BR-KANBAN-03 lại
        // không cho kéo ra nữa.
        notify.error(
          `Không thể kéo hồ sơ sang "${targetColumn.name}". Ứng viên chỉ vào Stage này khi đã ký Offer điện tử — hãy tạo và gửi Offer từ Applicant Card.`,
        );
        return;

      default:
        setMovingApplicationId(applicationId);
        moveMutation.mutate({ applicationId, targetStageId });
    }
  }

  /**
   * Hành động trong dialog đã hoàn tất — backend cũng đã chuyển Stage trong
   * cùng transaction, nên ở đây chỉ cần nạp lại board.
   */
  function handleActionCompleted() {
    setPendingAction(null);
    queryClient.invalidateQueries({ queryKey: boardQueryKey });
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

      {/* Hủy = `setPendingAction(null)`: chưa có request nào được gửi nên board
          không cần hoàn tác gì, thẻ vẫn nằm ở cột cũ. */}
      {pendingAction?.kind === 'INTERVIEW' && (
        <ScheduleInterviewModal
          open
          applicationId={pendingAction.applicationId}
          candidateName={pendingAction.candidateName}
          targetStageId={pendingAction.targetStageId}
          targetStageName={pendingAction.targetStageName}
          onClose={() => setPendingAction(null)}
          onScheduled={handleActionCompleted}
        />
      )}

      {pendingAction?.kind === 'OFFER' && (
        <CreateOfferModal
          open
          applicationId={pendingAction.applicationId}
          candidateName={pendingAction.candidateName}
          targetStageId={pendingAction.targetStageId}
          targetStageName={pendingAction.targetStageName}
          onClose={() => setPendingAction(null)}
          onCreated={handleActionCompleted}
          onStageMoved={handleActionCompleted}
        />
      )}

      {pendingAction?.kind === 'REJECT' && (
        <RejectApplicationModal
          open
          applicationId={pendingAction.applicationId}
          candidateName={pendingAction.candidateName}
          targetStageName={pendingAction.targetStageName}
          onClose={() => setPendingAction(null)}
          onRejected={handleActionCompleted}
        />
      )}
    </>
  );
}
