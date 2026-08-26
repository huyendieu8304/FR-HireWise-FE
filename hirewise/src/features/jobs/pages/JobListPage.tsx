import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Briefcase, Buildings, MagnifyingGlass, Users } from '@phosphor-icons/react';
import { Badge, type BadgeVariant } from '@/components/ui/Badge/Badge';
import { Select } from '@/components/ui/Select/Select';
import { TextInput } from '@/components/ui/TextInput/TextInput';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { listInternalJobs } from '../api/internalJobsApi';
import { EMPLOYMENT_TYPE_LABELS, JOB_STATUS_LABELS, type InternalJobSummary, type JobPositionStatus } from '../types';
import { listDepartments } from '@/features/users/api/usersApi';
import { formatDate } from '@/utils/formatters';
import { ROUTES } from '@/constants/routes';

const STATUS_BADGE_VARIANTS: Record<JobPositionStatus, BadgeVariant> = {
  DRAFT: 'neutral',
  PENDING_APPROVAL: 'warning',
  APPROVED: 'info',
  REJECTED: 'danger',
  PUBLISHED: 'success',
  PAUSED: 'warning',
  CLOSED: 'neutral',
};

const STATUS_FILTER_OPTIONS = (Object.keys(JOB_STATUS_LABELS) as JobPositionStatus[]).map((status) => ({
  value: status,
  label: JOB_STATUS_LABELS[status],
}));

/**
 * "Vị trí tuyển dụng": danh sách mọi Job Position trong phạm vi truy cập của
 * Hiring Manager/Recruiter/Interviewer hiện tại (Access Scope, xem
 * `JobService` backend), có bộ lọc theo Phòng ban, Trạng thái và ô search
 * theo tên vị trí. Click 1 dòng để mở `JobDetailPage` (tab "Mô tả chi tiết"
 * + "Kanban Board").
 */
export function JobListPage() {
  const navigate = useNavigate();
  const [departmentId, setDepartmentId] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [keyword, setKeyword] = useState<string>('');
  const [debouncedKeyword, setDebouncedKeyword] = useState<string>('');

  // Debounce 400ms trước khi gọi API — tránh gọi liên tục mỗi lần gõ phím
  // (cùng pattern với `JobBoardPage`, xem `features/jobs/pages/JobBoardPage.tsx`).
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword.trim()), 400);
    return () => clearTimeout(timer);
  }, [keyword]);

  const { data: departments } = useQuery({
    queryKey: ['departments', 'list'],
    queryFn: () => listDepartments(),
  });

  const {
    data: page,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['jobs', 'internal-list', departmentId, status, debouncedKeyword],
    queryFn: () =>
      listInternalJobs({
        size: 50,
        departmentId: departmentId ? Number(departmentId) : undefined,
        status: status ? (status as JobPositionStatus) : undefined,
        keyword: debouncedKeyword || undefined,
      }),
  });

  const jobs = page?.content ?? [];

  const departmentOptions = (departments ?? []).map((dept) => ({
    value: String(dept.id),
    label: dept.name,
  }));

  function handleRowClick(job: InternalJobSummary) {
    navigate(ROUTES.JOB_DETAIL.replace(':jobId', job.id));
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-neutral-900">Vị trí tuyển dụng</h1>
        <p className="text-sm text-neutral-500">
          Toàn bộ vị trí tuyển dụng trong phạm vi quản lý của bạn — xem mô tả chi tiết và theo dõi ứng viên trên Kanban board.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-white p-4">
        <div className="w-full max-w-[280px]">
          <TextInput
            label="Tìm kiếm"
            placeholder="Tìm theo tên vị trí..."
            prefixIcon={<MagnifyingGlass />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <div className="w-full max-w-[220px]">
          <Select
            label="Phòng ban"
            placeholder="Tất cả phòng ban"
            options={departmentOptions}
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
          />
        </div>
        <div className="w-full max-w-[200px]">
          <Select
            label="Trạng thái"
            placeholder="Tất cả trạng thái"
            options={STATUS_FILTER_OPTIONS}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        {/* Table Header */}
        <div className="hidden grid-cols-[2.5fr_1.5fr_80px_1.5fr_120px_130px_36px] gap-4 border-b border-neutral-200 bg-neutral-50 px-5 py-3 md:grid">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Chức danh
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Phòng ban
          </span>
          <span className="text-center text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Chỉ tiêu
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Recruiter phụ trách
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Trạng thái
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Ngày tạo
          </span>
          <span />
        </div>

        {/* Loading skeletons */}
        {isLoading && (
          <div className="divide-y divide-neutral-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-[2.5fr_1.5fr_80px_1.5fr_120px_130px_36px] gap-4 px-5 py-4"
              >
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="mx-auto h-4 w-8" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-4" />
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {isError && !isLoading && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <span className="text-sm text-danger-600">
              Không thể tải danh sách vị trí tuyển dụng. Vui lòng thử lại sau.
            </span>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && jobs.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Briefcase className="size-10 text-neutral-300" weight="thin" />
            <div>
              <p className="text-sm font-medium text-neutral-700">
                Không tìm thấy vị trí tuyển dụng nào
              </p>
              <p className="mt-1 text-xs text-neutral-400">
                {debouncedKeyword
                  ? `Không có vị trí nào khớp với "${debouncedKeyword}". Thử từ khóa khác hoặc bỏ bớt bộ lọc.`
                  : 'Thử bỏ bớt bộ lọc phòng ban/trạng thái đang áp dụng.'}
              </p>
            </div>
          </div>
        )}

        {/* Data rows */}
        {!isLoading && !isError && jobs.length > 0 && (
          <div className="divide-y divide-neutral-100">
            {jobs.map((job) => (
              <JobRow key={job.id} job={job} onClick={() => handleRowClick(job)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface JobRowProps {
  job: InternalJobSummary;
  onClick: () => void;
}

function JobRow({ job, onClick }: JobRowProps) {
  const statusVariant = STATUS_BADGE_VARIANTS[job.status] ?? 'neutral';
  const statusLabel = JOB_STATUS_LABELS[job.status] ?? job.status;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left transition-colors hover:bg-primary-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset"
      aria-label={`Xem chi tiết vị trí: ${job.title}`}
    >
      {/* Mobile Layout */}
      <div className="flex flex-col gap-2 px-5 py-4 md:hidden">
        <div className="flex items-start justify-between gap-2">
          <span className="font-semibold text-neutral-900 group-hover:text-primary-700">
            {job.title}
          </span>
          <Badge variant={statusVariant}>{statusLabel}</Badge>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
          {job.departmentName && (
            <span className="inline-flex items-center gap-1">
              <Buildings className="size-3.5" />
              {job.departmentName}
            </span>
          )}
          {job.recruiterName && (
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5" />
              {job.recruiterName}
            </span>
          )}
          <span>{job.openings} chỉ tiêu</span>
          {job.employmentType && (
            <Badge variant="primary">{EMPLOYMENT_TYPE_LABELS[job.employmentType]}</Badge>
          )}
        </div>
        <p className="text-xs text-neutral-400">{formatDate(job.createdAt)}</p>
      </div>

      {/* Desktop Table Row */}
      <div className="hidden grid-cols-[2.5fr_1.5fr_80px_1.5fr_120px_130px_36px] items-center gap-4 px-5 py-4 md:grid">
        {/* Chức danh */}
        <div className="flex items-center gap-2 min-w-0 pr-2">
          <span className="truncate font-semibold text-neutral-900 group-hover:text-primary-700">
            {job.title}
          </span>
          {job.employmentType && (
            <Badge variant="primary" className="shrink-0 text-[10px] px-1.5 py-0">
              {EMPLOYMENT_TYPE_LABELS[job.employmentType]}
            </Badge>
          )}
        </div>

        {/* Phòng ban */}
        <span className="text-sm text-neutral-600 truncate">
          {job.departmentName ?? <span className="italic text-neutral-400">—</span>}
        </span>

        {/* Chỉ tiêu */}
        <span className="text-center text-sm font-semibold text-neutral-800">{job.openings}</span>

        {/* Recruiter phụ trách */}
        <span className="text-sm text-neutral-600 truncate">
          {job.recruiterName ?? <span className="italic text-neutral-400">Chưa gán</span>}
        </span>

        {/* Trạng thái */}
        <div>
          <Badge variant={statusVariant}>{statusLabel}</Badge>
        </div>

        {/* Ngày tạo */}
        <span className="text-sm text-neutral-700">{formatDate(job.createdAt)}</span>

        {/* Arrow icon */}
        <div className="flex justify-end">
          <ArrowRight className="size-4 text-neutral-400 transition-transform group-hover:translate-x-0.5 group-hover:text-primary-600" />
        </div>
      </div>
    </button>
  );
}
