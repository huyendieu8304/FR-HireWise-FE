import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Stack } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button/Button';
import { Badge } from '@/components/ui/Badge/Badge';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { cn } from '@/utils/cn';
import { listPipelineStages, listPipelineTemplates } from '../api/pipelinesApi';
import { STAGE_TYPE_LABELS, type PipelineTemplate } from '../types';
import { CreatePipelineTemplateModal } from '../components/CreatePipelineTemplateModal';
import { CreatePipelineStageModal } from '../components/CreatePipelineStageModal';

const TEMPLATE_STATUS_BADGE_VARIANT = { DRAFT: 'warning', ACTIVE: 'success' } as const;

/**
 * UC-04: HR Admin chọn (hoặc tạo mới) 1 Pipeline Template, xem danh sách
 * Stage hiện tại, và thêm Stage mới. Sắp xếp lại thứ tự Stage (UC-05,
 * kéo-thả) và xóa Stage (UC-06) là 2 use case khác, chưa có ở màn hình
 * này — danh sách Stage bên phải hiển thị READ-ONLY theo đúng `position`
 * backend trả về.
 */
export function PipelineManagementPage() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);

  const { data: templates, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['pipeline-templates'],
    queryFn: listPipelineTemplates,
  });

  // "Chọn Template đầu tiên" là giá trị SUY RA lúc render (chưa ai bấm chọn
  // gì) — không dùng useEffect+setState để đồng bộ, tránh render thừa 1
  // nhịp mỗi khi danh sách Template thay đổi.
  const effectiveTemplateId = selectedTemplateId ?? templates?.[0]?.id ?? null;
  const selectedTemplate = templates?.find((t) => t.id === effectiveTemplateId) ?? null;

  const { data: stages, isLoading: isLoadingStages } = useQuery({
    queryKey: ['pipeline-stages', effectiveTemplateId],
    queryFn: () => listPipelineStages(effectiveTemplateId!),
    enabled: effectiveTemplateId !== null,
  });

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
                        <td className="px-4 py-3" colSpan={6}>
                          <Skeleton className="h-6 w-full" />
                        </td>
                      </tr>
                    ))}

                  {!isLoadingStages && stages?.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
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
                      className="border-b border-neutral-100 last:border-none"
                    >
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
