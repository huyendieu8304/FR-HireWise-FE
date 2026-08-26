import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Kanban as KanbanIcon } from '@phosphor-icons/react';
import { Select } from '@/components/ui/Select/Select';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { useNotification } from '@/hooks/useNotification';
import { listPublicJobs } from '@/features/jobs/api/jobsApi';
import { getKanbanBoard, moveApplicationStage } from '../api/kanbanApi';
import { KanbanColumn } from '../components/KanbanColumn';

/**
 * UC-22/UC-23: Kanban board ứng viên theo Job — chọn 1 Job đang tuyển
 * (đã Published, xem `listPublicJobs` — mọi Job có thể nhận hồ sơ UC-17 đều
 * đã Published nên tái dùng đúng API này làm bộ chọn), xem danh sách ứng
 * viên theo từng Stage (UC-22), và kéo-thả để chuyển Stage (UC-23).
 *
 * Mục "Pipeline" trên sidebar (`AppShell`) trỏ vào trang này — phân biệt với
 * "Pipeline tuyển dụng" (`PipelineManagementPage`, cấu hình Stage của
 * Template, không phải Kanban ứng viên).
 */
export function KanbanBoardPage() {
  const notify = useNotification();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [dragState, setDragState] = useState<{
    applicationId: string;
    fromStageId: number;
  } | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<number | null>(null);
  const [movingApplicationId, setMovingApplicationId] = useState<string | null>(null);

  const { data: jobsPage, isLoading: isLoadingJobs } = useQuery({
    queryKey: ['kanban', 'job-options'],
    queryFn: () => listPublicJobs({ size: 100 }),
  });

  const jobs = jobsPage?.content ?? [];
  // "Job đầu tiên" là giá trị SUY RA lúc render khi chưa ai chọn gì (giống
  // effectiveTemplateId ở PipelineManagementPage) — không đồng bộ qua
  // useEffect+setState để tránh render thừa 1 nhịp.
  const jobIdFromUrl = searchParams.get('jobId');
  const effectiveJobId = jobIdFromUrl ?? jobs[0]?.id ?? null;

  const jobOptions = jobs.map((job) => ({ value: job.id, label: job.title }));

  const boardQueryKey = ['kanban', 'board', effectiveJobId];
  const {
    data: board,
    isLoading: isLoadingBoard,
    isError: isBoardError,
  } = useQuery({
    queryKey: boardQueryKey,
    queryFn: () => getKanbanBoard(effectiveJobId!),
    enabled: effectiveJobId !== null,
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

  function handleJobChange(jobId: string) {
    setSearchParams(jobId ? { jobId } : {});
  }

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

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-neutral-900">Pipeline ứng viên</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Theo dõi và kéo-thả ứng viên qua từng Stage tuyển dụng của 1 vị trí.
        </p>
      </div>

      <div className="max-w-sm">
        <Select
          label="Vị trí tuyển dụng"
          placeholder={isLoadingJobs ? 'Đang tải...' : 'Chọn vị trí tuyển dụng'}
          options={jobOptions}
          value={effectiveJobId ?? ''}
          onChange={(e) => handleJobChange(e.target.value)}
          disabled={isLoadingJobs || jobOptions.length === 0}
        />
      </div>

      {!isLoadingJobs && jobOptions.length === 0 && (
        <div className="shadow-elevation-1 flex flex-col items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-16 text-center">
          <KanbanIcon className="size-8 text-neutral-300" />
          <p className="text-sm text-neutral-500">
            Chưa có vị trí tuyển dụng nào đã đăng công khai để xem Pipeline.
          </p>
        </div>
      )}

      {effectiveJobId !== null && (
        <>
          {isLoadingBoard && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-72 shrink-0 rounded-lg" />
              ))}
            </div>
          )}

          {isBoardError && !isLoadingBoard && (
            <div className="shadow-elevation-1 flex flex-col items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-16 text-center">
              <span className="text-sm text-danger-600">
                Không thể tải Pipeline cho vị trí này. Vui lòng thử lại sau.
              </span>
            </div>
          )}

          {board && !isLoadingBoard && !isBoardError && (
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
          )}
        </>
      )}
    </div>
  );
}
