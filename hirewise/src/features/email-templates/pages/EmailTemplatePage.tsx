import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { EnvelopeSimple, MagnifyingGlass, Pencil, Plus } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button/Button';
import { TextInput } from '@/components/ui/TextInput/TextInput';
import { Badge } from '@/components/ui/Badge/Badge';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { formatDate } from '@/utils/formatters';
import { listEmailTemplates } from '../api/emailTemplatesApi';
import type { EmailTemplate } from '../types';
import { EmailTemplateFormModal } from '../components/EmailTemplateFormModal';

/**
 * UC-09: danh sach + tim kiem + tao/sua Email Template.
 */
export function EmailTemplatePage() {
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EmailTemplate | null>(null);

  const { data: templatePage, isLoading } = useQuery({
    queryKey: ['email-templates'],
    queryFn: () => listEmailTemplates({ size: 100 }),
  });

  const templates = useMemo(() => templatePage?.content ?? [], [templatePage]);

  const filteredTemplates = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return templates;
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(keyword) ||
        t.code.toLowerCase().includes(keyword),
    );
  }, [templates, search]);

  function handleEdit(template: EmailTemplate) {
    setEditTarget(template);
  }

  function handleCloseModal() {
    setIsCreateModalOpen(false);
    setEditTarget(null);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Email Template</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {templatePage ? `${templatePage.totalElements} template · ` : ''}
            Quan ly mau email tu dong cua he thong (BR-EMAILTPL-01/03/04).
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="size-4" />
          Tao Template moi
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <TextInput
          containerClassName="min-w-64 flex-1 max-w-md"
          placeholder="Tim theo ten hoac ma template..."
          prefixIcon={<MagnifyingGlass />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="shadow-elevation-1 bg-neutral-0 overflow-hidden rounded-lg border border-neutral-200">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                Ma
              </th>
              <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                Ten Template
              </th>
              <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                Stage gan kem
              </th>
              <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                Version
              </th>
              <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                Trang thai
              </th>
              <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                Ngay tao
              </th>
              <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                Tac vu
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-neutral-100 last:border-none">
                  <td className="px-4 py-3" colSpan={7}>
                    <Skeleton className="h-8 w-full" />
                  </td>
                </tr>
              ))}

            {!isLoading && filteredTemplates.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center">
                  <div className="flex flex-col items-center gap-2 text-neutral-400">
                    <EnvelopeSimple className="size-8" />
                    <p className="text-sm">
                      {search ? 'Khong tim thay template phu hop.' : 'Chua co email template nao.'}
                    </p>
                  </div>
                </td>
              </tr>
            )}

            {!isLoading &&
              filteredTemplates.map((t) => (
                <tr key={t.id} className="border-b border-neutral-100 last:border-none hover:bg-neutral-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-mono text-neutral-700">
                      {t.code}
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-neutral-900">{t.name}</p>
                    <p className="mt-0.5 text-xs text-neutral-500 truncate max-w-xs" title={t.subjectTemplate}>
                      {t.subjectTemplate}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-600">
                    {t.pipelineStageName ? (
                      <Badge variant="secondary">{t.pipelineStageName}</Badge>
                    ) : (
                      <span className="text-neutral-400 text-xs">Khong gan</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-neutral-600">v{t.version}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={t.status === 'ACTIVE' ? 'success' : 'neutral'}>
                      {t.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-500">
                    {formatDate(t.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(t)}
                        aria-label={`Sua template ${t.name}`}
                      >
                        <Pencil className="size-3.5" />
                        Sua
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <EmailTemplateFormModal
        open={isCreateModalOpen}
        onClose={handleCloseModal}
      />
      <EmailTemplateFormModal
        key={editTarget?.id ?? 'none'}
        open={!!editTarget}
        onClose={handleCloseModal}
        initialValues={editTarget ?? undefined}
      />
    </div>
  );
}