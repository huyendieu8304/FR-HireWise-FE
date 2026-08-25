import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DotsSixVertical, Plus, Stack } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button/Button';
import { Badge } from '@/components/ui/Badge/Badge';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { cn } from '@/utils/cn';
import { useNotification } from '@/hooks/useNotification';
import {
  listPipelineStages,
  listPipelineTemplates,
  reorderPipelineStages,
} from '../api/pipelinesApi';
import { STAGE_TYPE_LABELS, type PipelineStage, type PipelineTemplate } from '../types';
import { CreatePipelineTemplateModal } from '../components/CreatePipelineTemplateModal';
import { CreatePipelineStageModal } from '../components/CreatePipelineStageModal';

const TEMPLATE_STATUS_BADGE_VARIANT = { DRAFT: 'warning', ACTIVE: 'success' } as const;

/** Debounce cho lần gọi API lưu vị trí — SRS UC-05 "Other Information": tránh gửi
 * quá nhiều request nếu HR Admin kéo-thả nhiều Stage liên tiếp thật nhanh. */
const REORDER_SAVE_DEBOUNCE_MS = 400;

/** BR-PIPE-04: di chuyển 1 Stage tới vị trí của `targetId`, tính lại `position`
 * hiển thị (1-based) cho TOÀN BỘ danh sách ngay lập tức — dùng cho optimistic
 * update, giá trị `position` chính thức vẫn do backend trả về sau khi lưu. */
function moveStage(
  stages: PipelineStage[],
  draggedId: number,
  targetId: number,
): PipelineStage[] {
  const fromIndex = stages.findIndex((s) => s.id === draggedId);
  const toIndex = stages.findIndex((s) => s.id === targetId);
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return stages;

  const next = [...stages];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next.map((stage, index) => ({ ...stage, position: index + 1 }));
}

/**
 * UC-04/UC-05: HR Admin chọn (hoặc tạo mới) 1 Pipeline Template, xem danh
 * sách Stage hiện tại, thêm Stage mới, và kéo-thả để sắp xếp lại thứ tự
 * Stage. Xóa Stage (UC-06) là use case khác, chưa có ở màn hình này.
 */
export function PipelineManagementPage() {
  const notify = useNotification();
  const queryClient = useQueryClient();
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [dragStageId, setDragStageId] = useState<number | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<number | null>(null);
  const reorderDebounceRef = useRef<number | undefined>(undefined);

  const { data: templates, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['pipeline-templates'],
    queryFn: listPipelineTemplates,
  });

  // "Chọn Template đầu tiên" là giá trị SUY RA lúc render (chưa ai bấm chọn
  // gì) — không dùng useEffect+setState để đồng bộ, tránh render thừa 1
  // nhịp mỗi khi danh sách Template thay đổi.
  const effectiveTemplateId = selectedTemplateId ?? templates?.[0]?.id ?? null;
  const selectedTemplate = templates?.find((t) => t.id === effectiveTemplateId) ?? null;

  const stagesQueryKey = ['pipeline-stages', effectiveTemplateId];
  const { data: stages, isLoading: isLoadingStages } = useQuery({
    queryKey: stagesQueryKey,
    queryFn: () => listPipelineStages(effectiveTemplateId!),
    enabled: effectiveTemplateId !== null,
  });

  const reorderMutation = useMutation({
    mutationFn: (stageIds: number[]) =>
      reorderPipelineStages(effectiveTemplateId!, stageIds),
    onSuccess: (updatedStages) => {
      // Đồng bộ lại `position` CHÍNH THỨC từ backend, thay cho giá trị optimistic.
      queryClient.setQueryData(stagesQueryKey, updatedStages);
    },
    onError: (error) => {
      // EX-01: lưu thất bại giữa chừng — backend đã tự rollback transaction
      // (BR-PIPE-04), phía FE chỉ cần bỏ thứ tự optimistic, lấy lại thứ tự
      // thật từ server (đúng "giữ nguyên thứ tự cũ" theo SRS).
      notify.error(error);
      queryClient.invalidateQueries({ queryKey: stagesQueryKey });
    },
  });

  function handleDropOn(targetStageId: number) {
    const draggedId = dragStageId;
    setDragStageId(null);
    setDragOverStageId(null);
    if (draggedId === null || draggedId === targetStageId || !stages) return;

    const reordered = moveStage(stages, draggedId, targetStageId);
    if (reordered === stages) return;
    // Hiện ngay thứ tự mới (optimistic) — không chờ round-trip API mới thấy phản hồi.
    queryClient.setQueryData(stagesQueryKey, reordered);

    window.clearTimeout(reorderDebounceRef.current);
    reorderDebounceRef.current = window.setTimeout(() => {
      reorderMutation.mutate(reordered.map((s) => s.id));
    }, REORDER_SAVE_DEBOUNCE_MS);
  }

  function handleTemplateCreated(template: PipelineTemplate) {
    setIsTemplateModalOpen(false);
    setSelectedTemplateId(template.id);
    // AF-01: "lưu → tiếp tục thêm Stage theo luồng chính" — mở luôn form
    // thêm Stage đầu tiên thay vì bắt HR Admin tự bấm thêm 1 lần nữa.
    setIsStageModalOpen(true);
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Pipeline Management</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Tạo và cấu hình các Stage (bước sàng lọc) trong từng Pipeline Template.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[18rem_1fr]">
        {/* Cột trái: danh sách Pipeline Template */}
        <div className="shadow-elevation-1 bg-neutral-0 flex flex-col gap-2 rounded-lg border border-neutral-200 p-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold tracking-wide text-neutral-400 uppercase">
              Pipeline Template
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsTemplateModalOpen(true)}
            >
              <Plus className="size-4" />
            </Button>
          </div>

          {isLoadingTemplates &&
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}

          {!isLoadingTemplates && templates?.length === 0 && (
            <p className="px-1 py-4 text-center text-sm text-neutral-400">
              Chưa có Template nào. Bấm + để tạo Template đầu tiên.
            </p>
          )}

          {templates?.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => setSelectedTemplateId(template.id)}
              className={cn(
                'flex flex-col gap-1 rounded-md border px-3 py-2 text-left transition-colors',
                template.id === effectiveTemplateId
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-transparent hover:bg-neutral-50',
              )}
            >
              <span className="text-sm font-medium text-neutral-900">
                {template.name}
              </span>
              <div className="flex items-center gap-1.5">
                <Badge variant={TEMPLATE_STATUS_BADGE_VARIANT[template.status]}>
                  {template.status}
                </Badge>
                <span className="text-xs text-neutral-500">
                  {template.departmentName ?? 'Toàn hệ thống'}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Cột phải: danh sách Stage của Template đang chọn */}
        <div className="shadow-elevation-1 bg-neutral-0 rounded-lg border border-neutral-200">
          {selectedTemplate === null ? (
            <div className="flex flex-col items-center gap-2 px-4 py-16 text-neutral-400">
              <Stack className="size-8" />
              <p className="text-sm">
                {isLoadingTemplates
                  ? 'Đang tải...'
                  : 'Chọn 1 Pipeline Template để xem Stage.'}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">
                    {selectedTemplate.name}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {selectedTemplate.departmentName ?? 'Áp dụng toàn hệ thống'}
                  </p>
                </div>
                <Button size="sm" onClick={() => setIsStageModalOpen(true)}>
                  <Plus className="size-4" />
                  Thêm Stage
                </Button>
              </div>

              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50">
                    <th className="w-8 px-2 py-2.5" aria-hidden="true" />
                    <th className="w-12 px-4 py-2.5 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                      #
                    </th>
                    <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                      Tên Stage
                    </th>
                    <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                      Mã
                    </th>
                    <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                      Loại
                    </th>
                    <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                      SLA
                    </th>
                    <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                      Kết thúc
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingStages &&
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr
                        key={i}
                        className="border-b border-neutral-100 last:border-none"
                      >
                        <td className="px-4 py-3" colSpan={7}>
                          <Skeleton className="h-6 w-full" />
                        </td>
                      </tr>
                    ))}

                  {!isLoadingStages && stages?.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-10 text-center text-sm text-neutral-400"
                      >
                        Chưa có Stage nào. Bấm "Thêm Stage" để tạo Stage đầu tiên (vd.
                        "New").
                      </td>
                    </tr>
                  )}

                  {stages?.map((stage) => (
                    <tr
                      key={stage.id}
                      draggable
                      onDragStart={() => setDragStageId(stage.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDragEnter={() => setDragOverStageId(stage.id)}
                      onDragLeave={() =>
                        setDragOverStageId((current) =>
                          current === stage.id ? null : current,
                        )
                      }
                      onDrop={(e) => {
                        e.preventDefault();
                        handleDropOn(stage.id);
                      }}
                      onDragEnd={() => {
                        setDragStageId(null);
                        setDragOverStageId(null);
                      }}
                      className={cn(
                        'border-b border-neutral-100 last:border-none',
                        // UC-05 Normal Flow bước 3: "highlight vị trí thả tạm thời trong lúc kéo".
                        dragOverStageId === stage.id &&
                          dragStageId !== stage.id &&
                          'bg-primary-50',
                        dragStageId === stage.id && 'opacity-50',
                      )}
                    >
                      <td className="cursor-grab px-2 py-3 text-neutral-300 active:cursor-grabbing">
                        <DotsSixVertical className="size-4" />
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-500">
                        {stage.position}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-neutral-900">
                        {stage.name}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="neutral">{stage.code}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700">
                        {STAGE_TYPE_LABELS[stage.stageType]}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-500">
                        {stage.slaHours ? `${stage.slaHours}h` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {stage.terminal && <Badge variant="info">Terminal</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>

      <CreatePipelineTemplateModal
        open={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onCreated={handleTemplateCreated}
      />
      {effectiveTemplateId !== null && (
        <CreatePipelineStageModal
          open={isStageModalOpen}
          onClose={() => setIsStageModalOpen(false)}
          pipelineTemplateId={effectiveTemplateId}
        />
      )}
    </div>
  );
}
