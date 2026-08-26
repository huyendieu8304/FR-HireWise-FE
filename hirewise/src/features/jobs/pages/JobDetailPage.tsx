import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Briefcase,
  Buildings,
  CalendarBlank,
  CurrencyCircleDollar,
  FileText,
  GitBranch,
  Kanban as KanbanIcon,
  MapPin,
  PencilSimple,
  Users,
  WarningCircle,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button/Button';
import { Badge, type BadgeVariant } from '@/components/ui/Badge/Badge';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { getInternalJobDetail } from '../api/internalJobsApi';
import { EMPLOYMENT_TYPE_LABELS, JOB_STATUS_LABELS, type JobPositionStatus } from '../types';
import { formatSalaryRange } from '../utils';
import { formatDate } from '@/utils/formatters';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/utils/cn';
import { KanbanBoardView } from '@/features/kanban/components/KanbanBoardView';
import { useAuthStore } from '@/store/useAuthStore';

const STATUS_BADGE_VARIANTS: Record<JobPositionStatus, BadgeVariant> = {
  DRAFT: 'neutral',
  PENDING_APPROVAL: 'warning',
  APPROVED: 'info',
  REJECTED: 'danger',
  PUBLISHED: 'success',
  PAUSED: 'warning',
  CLOSED: 'neutral',
};

type DetailTab = 'description' | 'kanban';

/**
 * Trang chi tiết 1 Vị trí tuyển dụng, mở từ `JobListPage` — gồm 2 tab:
 * "Mô tả chi tiết" (JD, tương tự `ApprovalDetailPage` nhưng không có action
 * Approve/Reject) và "Kanban Board" (UC-22/UC-23, `KanbanBoardView`).
 * Tab hiện tại lưu trong query param `?tab=` để có thể chia sẻ link trực
 * tiếp tới 1 tab cụ thể.
 */
export function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const canEditJob = useAuthStore((state) => state.user?.permissions.includes('JOB_EDIT') ?? false);

  const tabParam = searchParams.get('tab');
  const activeTab: DetailTab = tabParam === 'kanban' ? 'kanban' : 'description';

  const {
    data: job,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['jobs', 'internal-detail', jobId],
    queryFn: () => getInternalJobDetail(jobId!),
    enabled: !!jobId,
  });

  function handleTabChange(tab: DetailTab) {
    setSearchParams(tab === 'description' ? {} : { tab });
  }

  if (isLoading) {
    return <JobDetailSkeleton />;
  }

  if (isError || !job) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <WarningCircle className="size-12 text-danger-500" />
        <div>
          <h2 className="text-lg font-semibold text-neutral-800">Không tìm thấy vị trí tuyển dụng</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Vị trí không tồn tại hoặc bạn không có quyền truy cập.
          </p>
        </div>
        <Link to={ROUTES.JOBS}>
          <Button variant="outline" className="mt-2">
            <ArrowLeft className="mr-1.5 size-4" />
            Quay lại danh sách
          </Button>
        </Link>
      </div>
    );
  }

  const statusVariant = STATUS_BADGE_VARIANTS[job.status] ?? 'neutral';
  const statusLabel = JOB_STATUS_LABELS[job.status] ?? job.status;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Navigation & Header */}
      <div className="flex flex-col gap-3">
        <Link
          to={ROUTES.JOBS}
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <ArrowLeft className="size-4" />
          <span>Quay lại danh sách vị trí tuyển dụng</span>
        </Link>

        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold text-neutral-900">{job.title}</h1>
              <Badge variant={statusVariant}>{statusLabel}</Badge>
              {job.employmentType && (
                <Badge variant="primary">{EMPLOYMENT_TYPE_LABELS[job.employmentType]}</Badge>
              )}
            </div>
            {/* BR-JOB-04: chỉ Draft/Rejected còn sửa được — Published chỉ Đóng/Tạm dừng (chưa làm). */}
            {canEditJob && (job.status === 'DRAFT' || job.status === 'REJECTED') && (
              <Link to={ROUTES.JOB_EDIT.replace(':jobId', job.id)}>
                <Button variant="outline" size="sm">
                  <PencilSimple className="size-4" />
                  Chỉnh sửa
                </Button>
              </Link>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-500">
            {job.departmentName && (
              <span className="inline-flex items-center gap-1">
                <Buildings className="size-4 text-neutral-400" />
                {job.departmentName}
              </span>
            )}
            {job.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-4 text-neutral-400" />
                {job.location}
              </span>
            )}
            {job.pipelineTemplateName && (
              <span className="inline-flex items-center gap-1 text-primary-700">
                <GitBranch className="size-4 text-primary-500" />
                Quy trình: {job.pipelineTemplateName}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Key Metric Highlights Card */}
      <div className="grid grid-cols-2 gap-4 rounded-lg border border-neutral-200 bg-white p-5 sm:grid-cols-4">
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1 text-xs font-medium text-neutral-500">
            <Users className="size-3.5" /> Chỉ tiêu tuyển
          </span>
          <span className="text-base font-semibold text-neutral-900">{job.openings} người</span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1 text-xs font-medium text-neutral-500">
            <CurrencyCircleDollar className="size-3.5" /> Mức lương
          </span>
          <span className="text-base font-semibold text-neutral-900">
            {formatSalaryRange(job.salaryMin, job.salaryMax)}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1 text-xs font-medium text-neutral-500">
            <Briefcase className="size-3.5" /> Hình thức làm việc
          </span>
          <span className="text-base font-semibold text-neutral-900">
            {job.employmentType ? EMPLOYMENT_TYPE_LABELS[job.employmentType] : '—'}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1 text-xs font-medium text-neutral-500">
            <CalendarBlank className="size-3.5" /> Hạn nộp hồ sơ
          </span>
          <span className="text-base font-semibold text-neutral-900">
            {job.applicationDeadline ? formatDate(job.applicationDeadline) : 'Không giới hạn'}
          </span>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 pb-3">
        <button
          type="button"
          onClick={() => handleTabChange('description')}
          className={cn(
            'inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-colors',
            activeTab === 'description'
              ? 'bg-primary-50 text-primary-700 shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
          )}
        >
          <FileText
            className={cn('size-4', activeTab === 'description' ? 'text-primary-600' : 'text-neutral-400')}
          />
          <span>Mô tả chi tiết</span>
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('kanban')}
          className={cn(
            'inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-colors',
            activeTab === 'kanban'
              ? 'bg-primary-50 text-primary-700 shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
          )}
        >
          <KanbanIcon
            className={cn('size-4', activeTab === 'kanban' ? 'text-primary-600' : 'text-neutral-400')}
          />
          <span>Kanban Board</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'description' ? (
        <div className="flex flex-col gap-6">
          {/* JD Block 1: Mô tả công việc */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <h2 className="text-base font-bold text-neutral-900">1. Mô tả công việc</h2>
            <div className="mt-3 whitespace-pre-line text-sm leading-relaxed text-neutral-700">
              {job.description || <span className="italic text-neutral-400">Không có mô tả</span>}
            </div>
          </div>

          {/* JD Block 2: Yêu cầu ứng viên */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <h2 className="text-base font-bold text-neutral-900">2. Yêu cầu ứng viên</h2>
            <div className="mt-3 whitespace-pre-line text-sm leading-relaxed text-neutral-700">
              {job.requirements || <span className="italic text-neutral-400">Không có yêu cầu cụ thể</span>}
            </div>
          </div>

          {/* JD Block 3: Quyền lợi & Đãi ngộ */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <h2 className="text-base font-bold text-neutral-900">3. Quyền lợi & Đãi ngộ</h2>
            <div className="mt-3 whitespace-pre-line text-sm leading-relaxed text-neutral-700">
              {job.benefits || <span className="italic text-neutral-400">Không có thông tin quyền lợi</span>}
            </div>
          </div>

          {/* Metadata Panel */}
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-5 text-xs text-neutral-600">
            <h4 className="font-semibold uppercase tracking-wider text-neutral-700">Thông tin phụ trách</h4>
            <div className="mt-3 flex flex-col gap-2.5">
              <div className="flex items-center justify-between border-b border-neutral-200/80 pb-2">
                <span className="text-neutral-500">Recruiter phụ trách:</span>
                <span className="font-medium text-neutral-900">{job.recruiterName || 'Chưa gán'}</span>
              </div>
              <div className="flex items-center justify-between border-b border-neutral-200/80 pb-2">
                <span className="text-neutral-500">Hiring Manager:</span>
                <span className="font-medium text-neutral-900">{job.hiringManagerName || '—'}</span>
              </div>
              <div className="flex items-center justify-between border-b border-neutral-200/80 pb-2">
                <span className="text-neutral-500">Quy trình tuyển dụng:</span>
                <span className="font-medium text-neutral-900">{job.pipelineTemplateName || 'Chưa gán'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Ngày tạo:</span>
                <span className="font-medium text-neutral-900">{formatDate(job.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <KanbanBoardView jobId={job.id} />
      )}
    </div>
  );
}

function JobDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-5 w-32" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="h-10 w-64 rounded-md" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}
