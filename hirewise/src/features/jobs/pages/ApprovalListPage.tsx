import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ClockCountdown,
  Buildings,
  Users,
  ArrowRight,
  CheckCircle,
  XCircle,
  ListBullets,
  GitBranch,
} from '@phosphor-icons/react';
import { Badge, type BadgeVariant } from '@/components/ui/Badge/Badge';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { listPendingApprovals } from '../api/approvalApi';
import { EMPLOYMENT_TYPE_LABELS, type PendingApprovalJobSummary } from '../types';
import { formatDate, formatRelativeTime } from '@/utils/formatters';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/utils/cn';

type ApprovalTab = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'ALL';

interface TabItem {
  key: ApprovalTab;
  label: string;
  icon: typeof ClockCountdown;
  statusParam?: string;
}

const TABS: TabItem[] = [
  {
    key: 'PENDING_APPROVAL',
    label: 'Chờ phê duyệt',
    icon: ClockCountdown,
    statusParam: 'PENDING_APPROVAL',
  },
  {
    key: 'APPROVED',
    label: 'Đã phê duyệt',
    icon: CheckCircle,
    statusParam: 'APPROVED',
  },
  {
    key: 'REJECTED',
    label: 'Đã từ chối',
    icon: XCircle,
    statusParam: 'REJECTED',
  },
  {
    key: 'ALL',
    label: 'Tất cả yêu cầu',
    icon: ListBullets,
    statusParam: undefined,
  },
];

const STATUS_BADGE_CONFIG: Record<string, { label: string; variant: BadgeVariant }> = {
  PENDING_APPROVAL: { label: 'Chờ duyệt', variant: 'warning' },
  APPROVED: { label: 'Đã duyệt', variant: 'success' },
  REJECTED: { label: 'Đã từ chối', variant: 'danger' },
  PUBLISHED: { label: 'Đã công bố', variant: 'info' },
  CLOSED: { label: 'Đã đóng', variant: 'neutral' },
  DRAFT: { label: 'Bản nháp', variant: 'neutral' },
};

/**
 * UC-14: Danh sách yêu cầu tuyển dụng cần xem xét phê duyệt dành cho Hiring Manager.
 * Hỗ trợ lọc theo trạng thái: Chờ duyệt, Đã duyệt, Đã từ chối, Tất cả.
 */
export function ApprovalListPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ApprovalTab>('PENDING_APPROVAL');

  const selectedTab = TABS.find((t) => t.key === activeTab) ?? TABS[0];

  // Lấy tổng số lượng đang chờ duyệt để hiển thị badge thống kê
  const { data: pendingCountData } = useQuery({
    queryKey: ['job-approvals', 'count-pending'],
    queryFn: () => listPendingApprovals({ status: 'PENDING_APPROVAL', size: 1 }),
  });

  const {
    data: page,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['job-approvals', 'list', activeTab],
    queryFn: () => listPendingApprovals({ status: selectedTab.statusParam, size: 50 }),
  });

  const jobs = page?.content ?? [];
  const pendingCount = pendingCountData?.totalElements ?? 0;

  function handleRowClick(job: PendingApprovalJobSummary) {
    navigate(ROUTES.JOB_APPROVAL_DETAIL.replace(':jobId', job.id));
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-neutral-900">Phê duyệt tuyển dụng</h1>
        <p className="text-sm text-neutral-500">
          Quản lý ngân sách nhân sự (Headcount), xem xét JD và quy trình tuyển dụng theo phạm vi phòng ban quản lý.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 pb-3">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700 shadow-xs'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
              )}
            >
              <Icon className={cn('size-4', isActive ? 'text-primary-600' : 'text-neutral-400')} />
              <span>{tab.label}</span>
              {tab.key === 'PENDING_APPROVAL' && pendingCount > 0 && (
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-semibold',
                    isActive ? 'bg-primary-200 text-primary-800' : 'bg-warning-100 text-warning-800',
                  )}
                >
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        {/* Table Header */}
        <div className="hidden grid-cols-[2.5fr_1.5fr_80px_1.5fr_110px_130px_36px] gap-4 border-b border-neutral-200 bg-neutral-50 px-5 py-3 md:grid">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Chức danh & Quy trình
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Phòng ban
          </span>
          <span className="text-center text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Chỉ tiêu
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Người tạo
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Trạng thái
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Ngày gửi
          </span>
          <span />
        </div>

        {/* Loading skeletons */}
        {isLoading && (
          <div className="divide-y divide-neutral-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-[2.5fr_1.5fr_80px_1.5fr_110px_130px_36px] gap-4 px-5 py-4"
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
              Không thể tải danh sách yêu cầu. Vui lòng thử lại sau.
            </span>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && jobs.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <ClockCountdown className="size-10 text-neutral-300" weight="thin" />
            <div>
              <p className="text-sm font-medium text-neutral-700">
                {activeTab === 'PENDING_APPROVAL'
                  ? 'Không có yêu cầu nào đang chờ duyệt'
                  : activeTab === 'APPROVED'
                    ? 'Chưa có yêu cầu nào được phê duyệt'
                    : activeTab === 'REJECTED'
                      ? 'Chưa có yêu cầu nào bị từ chối'
                      : 'Không có yêu cầu tuyển dụng nào'}
              </p>
              <p className="mt-1 text-xs text-neutral-400">
                {activeTab === 'PENDING_APPROVAL'
                  ? 'Khi Recruiter gửi yêu cầu mới, danh sách sẽ xuất hiện tại đây.'
                  : 'Các yêu cầu sau khi xử lý sẽ được lưu lại lịch sử.'}
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
  const statusCfg = STATUS_BADGE_CONFIG[job.status] ?? {
    label: job.status,
    variant: 'neutral' as BadgeVariant,
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group w-full text-left transition-colors hover:bg-primary-50/60',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset',
      )}
      aria-label={`Xem chi tiết yêu cầu: ${job.title}`}
    >
      {/* Mobile Layout */}
      <div className="flex flex-col gap-2 px-5 py-4 md:hidden">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-neutral-900 group-hover:text-primary-700">
              {job.title}
            </span>
            {job.pipelineTemplateName && (
              <span className="flex items-center gap-1 text-xs text-neutral-400">
                <GitBranch className="size-3" />
                {job.pipelineTemplateName}
              </span>
            )}
          </div>
          <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
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

      {/* Desktop Table Row */}
      <div className="hidden grid-cols-[2.5fr_1.5fr_80px_1.5fr_110px_130px_36px] items-center gap-4 px-5 py-4 md:grid">
        {/* Chức danh & Quy trình */}
        <div className="flex flex-col gap-1 min-w-0 pr-2">
          <div className="flex items-center gap-2">
            <span className="truncate font-semibold text-neutral-900 group-hover:text-primary-700">
              {job.title}
            </span>
            {job.employmentType && (
              <Badge variant="primary" className="shrink-0 text-[10px] px-1.5 py-0">
                {EMPLOYMENT_TYPE_LABELS[job.employmentType]}
              </Badge>
            )}
          </div>
          {job.pipelineTemplateName && (
            <span className="flex items-center gap-1 text-xs text-neutral-400 truncate">
              <GitBranch className="size-3 shrink-0" />
              <span className="truncate">{job.pipelineTemplateName}</span>
            </span>
          )}
        </div>

        {/* Phòng ban */}
        <span className="text-sm text-neutral-600 truncate">
          {job.departmentName ?? <span className="italic text-neutral-400">—</span>}
        </span>

        {/* Chỉ tiêu */}
        <span className="text-center text-sm font-semibold text-neutral-800">
          {job.openings}
        </span>

        {/* Người tạo */}
        <span className="text-sm text-neutral-600 truncate">
          {job.createdByUserName ?? <span className="italic text-neutral-400">—</span>}
        </span>

        {/* Trạng thái */}
        <div>
          <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
        </div>

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
