import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ClockCountdown, Buildings, Users, ArrowRight } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/Badge/Badge';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { listPendingApprovals } from '../api/approvalApi';
import { EMPLOYMENT_TYPE_LABELS, type PendingApprovalJobSummary } from '../types';
import { formatDate, formatRelativeTime } from '@/utils/formatters';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/utils/cn';

/**
 * UC-14: Danh sách Job Position đang chờ Hiring Manager phê duyệt.
 *
 * Normal flow:
 *  1. Hệ thống truy vấn status = PENDING_APPROVAL trong access scope (BE lo).
 *  2. Hiển thị bảng: Chức danh | Phòng ban | Chỉ tiêu | Người tạo | Ngày gửi.
 *  3. Bấm vào dòng → navigate sang UC-15 (chi tiết phê duyệt).
 *
 * EX-01: content rỗng → hiển thị empty state.
 */
export function ApprovalListPage() {
  const navigate = useNavigate();

  const { data: page, isLoading, isError } = useQuery({
    queryKey: ['job-approvals', 'pending'],
    queryFn: () => listPendingApprovals({ size: 50 }),
  });

  const jobs = page?.content ?? [];

  function handleRowClick(job: PendingApprovalJobSummary) {
    // UC-15 chưa implement — navigate tạm sang detail route với jobId
    navigate(ROUTES.JOB_APPROVAL_DETAIL.replace(':jobId', job.id));
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-neutral-900">Phê duyệt tuyển dụng</h1>
        <p className="text-sm text-neutral-500">
          Danh sách yêu cầu tuyển dụng đang chờ bạn xem xét và phê duyệt.
        </p>
      </div>

      {/* Stats badge */}
      {!isLoading && (
        <div className="flex items-center gap-2">
          <ClockCountdown className="size-4 text-warning-600" weight="fill" />
          <span className="text-sm text-neutral-600">
            {jobs.length > 0 ? (
              <>
                <span className="font-semibold text-warning-700">{page?.totalElements ?? 0}</span>
                {' '}yêu cầu đang chờ duyệt
              </>
            ) : (
              'Không có yêu cầu nào đang chờ duyệt'
            )}
          </span>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
        {/* Table header */}
        <div className="hidden grid-cols-[2fr_1.5fr_80px_1.5fr_140px_40px] gap-4 border-b border-neutral-200 bg-neutral-50 px-5 py-3 md:grid">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Chức danh</span>
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Phòng ban</span>
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500 text-center">Chỉ tiêu</span>
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Người tạo</span>
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Ngày gửi</span>
          <span />
        </div>

        {/* Loading skeletons */}
        {isLoading && (
          <div className="divide-y divide-neutral-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[2fr_1.5fr_80px_1.5fr_140px_40px] gap-4 px-5 py-4">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-4 w-8 mx-auto" />
                <Skeleton className="h-4 w-4/5" />
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
              Không thể tải danh sách. Vui lòng thử lại.
            </span>
          </div>
        )}

        {/* EX-01: Empty state */}
        {!isLoading && !isError && jobs.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <ClockCountdown className="size-10 text-neutral-300" weight="thin" />
            <div>
              <p className="text-sm font-medium text-neutral-700">
                Không có yêu cầu nào đang chờ duyệt
              </p>
              <p className="mt-1 text-xs text-neutral-400">
                Khi Recruiter submit Job mới, chúng sẽ xuất hiện tại đây.
              </p>
            </div>
          </div>
        )}

        {/* Data rows */}
        {!isLoading && !isError && jobs.length > 0 && (
          <div className="divide-y divide-neutral-100">
            {jobs.map((job) => (
              <ApprovalRow key={job.id} job={job} onClick={() => handleRowClick(job)} />
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

interface ApprovalRowProps {
  job: PendingApprovalJobSummary;
  onClick: () => void;
}

function ApprovalRow({ job, onClick }: ApprovalRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group w-full text-left transition-colors hover:bg-primary-50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset',
      )}
      aria-label={`Xem chi tiết yêu cầu: ${job.title}`}
    >
      {/* Mobile layout */}
      <div className="flex flex-col gap-1.5 px-5 py-4 md:hidden">
        <div className="flex items-start justify-between gap-2">
          <span className="font-semibold text-neutral-900 group-hover:text-primary-700">
            {job.title}
          </span>
          <ArrowRight className="mt-0.5 size-4 shrink-0 text-neutral-400 transition-transform group-hover:translate-x-0.5 group-hover:text-primary-600" />
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
          {job.departmentName && (
            <span className="inline-flex items-center gap-1">
              <Buildings className="size-3.5" />
              {job.departmentName}
            </span>
          )}
          {job.createdByUserName && (
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5" />
              {job.createdByUserName}
            </span>
          )}
          <span>{job.openings} chỉ tiêu</span>
          {job.employmentType && (
            <Badge variant="primary">{EMPLOYMENT_TYPE_LABELS[job.employmentType]}</Badge>
          )}
        </div>
        <p className="text-xs text-neutral-400">
          Gửi {formatRelativeTime(job.submittedAt)} · {formatDate(job.submittedAt)}
        </p>
      </div>

      {/* Desktop table row */}
      <div className="hidden grid-cols-[2fr_1.5fr_80px_1.5fr_140px_40px] items-center gap-4 px-5 py-4 md:grid">
        {/* Chức danh */}
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-neutral-900 group-hover:text-primary-700">
            {job.title}
          </span>
          {job.employmentType && (
            <Badge variant="primary" className="w-fit">
              {EMPLOYMENT_TYPE_LABELS[job.employmentType]}
            </Badge>
          )}
        </div>

        {/* Phòng ban */}
        <span className="text-sm text-neutral-600">
          {job.departmentName ?? <span className="italic text-neutral-400">—</span>}
        </span>

        {/* Chỉ tiêu */}
        <span className="text-center text-sm font-medium text-neutral-700">
          {job.openings}
        </span>

        {/* Người tạo */}
        <span className="text-sm text-neutral-600">
          {job.createdByUserName ?? <span className="italic text-neutral-400">—</span>}
        </span>

        {/* Ngày gửi */}
        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-neutral-700">{formatDate(job.submittedAt)}</span>
          <span className="text-xs text-neutral-400">{formatRelativeTime(job.submittedAt)}</span>
        </div>

        {/* Arrow icon */}
        <div className="flex justify-end">
          <ArrowRight className="size-4 text-neutral-400 transition-transform group-hover:translate-x-0.5 group-hover:text-primary-600" />
        </div>
      </div>
    </button>
  );
}
