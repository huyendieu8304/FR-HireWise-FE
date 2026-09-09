import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClipboardText, PencilSimple, Plus } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/Badge/Badge';
import { Button } from '@/components/ui/Button/Button';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { cn } from '@/utils/cn';
import { listScorecardTemplates } from '../api/scorecardsApi';
import { ScorecardTemplateFormModal } from '../components/ScorecardTemplateFormModal';
import type { ScorecardTemplate } from '../types';

/**
 * UC-27: "Thư viện Master Scorecard Template" — trang Settings cho HR Admin
 * (và Hiring Manager, cùng giữ quyền `SCORECARD_TEMPLATE_MANAGE`) quản lý
 * thư viện Template MẪU, LUÔN dùng chung toàn hệ thống (không gắn Job/Stage
 * nào) — chỉ để tham khảo/nhân bản, KHÔNG dùng trực tiếp để chấm điểm.
 * Scorecard THẬT (gắn với từng cặp Job + Stage phỏng vấn) được cấu hình
 * riêng tại trang Phê duyệt Job, xem `JobStageScorecardFormModal`. Bố cục 2
 * cột giống `PipelineManagementPage` — danh sách bên trái, chi tiết bên
 * phải — để nhất quán với trang cấu hình tương tự khác.
 */
export function ScorecardTemplatesPage() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ScorecardTemplate | undefined>(undefined);

  const { data: templates, isLoading } = useQuery({
    queryKey: ['scorecard-templates'],
    queryFn: listScorecardTemplates,
  });

  // Giống PipelineManagementPage: "chọn Template đầu tiên" suy ra lúc render,
  // không đồng bộ qua useEffect+setState để tránh render thừa 1 nhịp.
  const effectiveTemplateId = selectedTemplateId ?? templates?.[0]?.id ?? null;
  const selectedTemplate = templates?.find((t) => t.id === effectiveTemplateId) ?? null;

  function openCreateModal() {
    setEditingTemplate(undefined);
    setIsFormOpen(true);
  }

  function openEditModal(template: ScorecardTemplate) {
    setEditingTemplate(template);
    setIsFormOpen(true);
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Scorecard Template</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Cấu hình tiêu chí đánh giá dùng để chấm điểm ứng viên khi phỏng vấn (UC-27), đóng góp vào Match Score
          tổng hợp, giảm thiên vị chủ quan.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[20rem_1fr]">
        {/* Cột trái: danh sách Template */}
        <div className="shadow-elevation-1 bg-neutral-0 flex flex-col gap-2 rounded-lg border border-neutral-200 p-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold tracking-wide text-neutral-400 uppercase">
              Scorecard Template
            </span>
            <Button variant="ghost" size="sm" onClick={openCreateModal}>
              <Plus className="size-4" />
            </Button>
          </div>

          {isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}

          {!isLoading && templates?.length === 0 && (
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
              <span className="text-sm font-medium text-neutral-900">{template.name}</span>
              <Badge variant={template.status === 'ACTIVE' ? 'success' : 'neutral'}>
                {template.status === 'ACTIVE' ? 'Đang dùng' : 'Đã lưu trữ'}
              </Badge>
            </button>
          ))}
        </div>

        {/* Cột phải: bảng tiêu chí của Template đang chọn */}
        <div className="shadow-elevation-1 bg-neutral-0 rounded-lg border border-neutral-200">
          {selectedTemplate === null ? (
            <div className="flex flex-col items-center gap-2 px-4 py-16 text-neutral-400">
              <ClipboardText className="size-8" />
              <p className="text-sm">{isLoading ? 'Đang tải...' : 'Chọn 1 Template để xem tiêu chí.'}</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{selectedTemplate.name}</p>
                  <p className="text-xs text-neutral-500">Dùng chung toàn hệ thống — bản mẫu để tham khảo/nhân bản</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => openEditModal(selectedTemplate)}>
                  <PencilSimple className="mr-1.5 size-4" />
                  Sửa
                </Button>
              </div>

              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50">
                    <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                      Tên tiêu chí
                    </th>
                    <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                      Trọng số
                    </th>
                    <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                      Thang điểm
                    </th>
                    <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                      Bắt buộc
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTemplate.criteria.map((criterion) => (
                    <tr key={criterion.id} className="border-b border-neutral-100 last:border-none">
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-neutral-900">{criterion.name}</span>
                        {criterion.description && (
                          <p className="mt-0.5 text-xs text-neutral-500">{criterion.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700">{criterion.weight}</td>
                      <td className="px-4 py-3 text-sm text-neutral-700">{criterion.maxScore}</td>
                      <td className="px-4 py-3">
                        {criterion.required && <Badge variant="info">Bắt buộc</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>

      <ScorecardTemplateFormModal open={isFormOpen} onClose={() => setIsFormOpen(false)} template={editingTemplate} />
    </div>
  );
}
