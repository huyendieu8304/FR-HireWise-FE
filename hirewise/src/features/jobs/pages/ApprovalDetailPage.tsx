import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Briefcase,
  Buildings,
  CalendarBlank,
  CheckCircle,
  CurrencyCircleDollar,
  GitBranch,
  MapPin,
  Users,
  WarningCircle,
  XCircle,
  Clock,
  Flag,
  UserCheck,
  UserMinus,
  ChatsCircle,
  FileText,
  MagnifyingGlass,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button/Button';
import { Badge, type BadgeVariant } from '@/components/ui/Badge/Badge';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { Modal } from '@/components/ui/Modal/Modal';
import { showSuccessToast, showErrorToast } from '@/components/ui/Toast/toastBus';
import { approveJob, getJobApprovalDetail, rejectJob } from '../api/approvalApi';
import { EMPLOYMENT_TYPE_LABELS } from '../types';
import { STAGE_TYPE_LABELS, type StageType } from '@/features/pipelines/types';
import { formatSalaryRange } from '../utils';
import { formatDate, formatRelativeTime } from '@/utils/formatters';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/utils/cn';

const STAGE_TYPE_ICONS: Record<StageType, typeof FileText> = {
  INTAKE: FileText,
  SCREENING: MagnifyingGlass,
  INTERVIEW: ChatsCircle,
  OFFER: UserCheck,
  TERMINAL_SUCCESS: Flag,
  TERMINAL_REJECTED: UserMinus,
};

const STAGE_TYPE_BADGE_VARIANTS: Record<StageType, BadgeVariant> = {
  INTAKE: 'neutral',
  SCREENING: 'info',
  INTERVIEW: 'primary',
  OFFER: 'secondary',
  TERMINAL_SUCCESS: 'success',
  TERMINAL_REJECTED: 'danger',
};

const STATUS_CONFIG: Record<string, { label: string; variant: BadgeVariant; desc: string }> = {
  PENDING_APPROVAL: {
    label: 'Chờ phê duyệt',
    variant: 'warning',
    desc: 'Yêu cầu đang chờ bạn xem xét ngân sách, JD và quy trình tuyển dụng để ra quyết định.',
  },
  APPROVED: {
    label: 'Đã phê duyệt',
    variant: 'success',
    desc: 'Vị trí tuyển dụng đã được phê duyệt thành công. Recruiter có thể tiến hành công bố (Publish).',
  },
  REJECTED: {
    label: 'Đã từ chối',
    variant: 'danger',
    desc: 'Yêu cầu đã bị từ chối và gửi phản hồi lại cho Recruiter để chỉnh sửa.',
  },
  PUBLISHED: {
    label: 'Đang công bố',
    variant: 'info',
    desc: 'Vị trí tuyển dụng đang được công khai trên Job Board và nhận hồ sơ ứng tuyển.',
  },
  CLOSED: {
    label: 'Đã đóng',
    variant: 'neutral',
    desc: 'Vị trí tuyển dụng đã đóng.',
  },
  DRAFT: {
    label: 'Bản nháp',
    variant: 'neutral',
    desc: 'Vị trí đang trong giai đoạn soạn thảo.',
  },
};

/**
 * UC-15: Phê duyệt / Từ chối yêu cầu tuyển dụng kèm xem xét quy trình tuyển dụng (Pipeline).
 */
export function ApprovalDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);

  const {
    data: job,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['job-approvals', 'detail', jobId],
    queryFn: () => getJobApprovalDetail(jobId!),
    enabled: !!jobId,
  });

  const approveMutation = useMutation({
    mutationFn: () => approveJob(jobId!),
    onSuccess: () => {
      showSuccessToast('Đã phê duyệt yêu cầu tuyển dụng thành công.');
      queryClient.invalidateQueries({ queryKey: ['job-approvals'] });
      navigate(ROUTES.JOB_APPROVALS);
    },
    onError: (err: any) => {
      showErrorToast(err?.message || 'Không thể phê duyệt yêu cầu. Vui lòng thử lại.');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => rejectJob(jobId!, { reason }),
    onSuccess: () => {
      showSuccessToast('Đã từ chối yêu cầu tuyển dụng.');
      queryClient.invalidateQueries({ queryKey: ['job-approvals'] });
      setIsRejectModalOpen(false);
      navigate(ROUTES.JOB_APPROVALS);
    },
    onError: (err: any) => {
      showErrorToast(err?.message || 'Không thể từ chối yêu cầu. Vui lòng thử lại.');
    },
  });

  function handleOpenRejectModal() {
    setRejectReason('');
    setRejectError(null);
    setIsRejectModalOpen(true);
  }

  function handleConfirmReject() {
    const trimmed = rejectReason.trim();
    // BR-APR-02 / EX-01 / ME-21: bắt buộc nhập lý do >= 10 ký tự
    if (!trimmed) {
      setRejectError('Vui lòng nhập lý do từ chối (ME-21).');
      return;
    }
    if (trimmed.length < 10) {
      setRejectError('Lý do từ chối phải có ít nhất 10 ký tự (ME-21).');
      return;
    }

    setRejectError(null);
    rejectMutation.mutate(trimmed);
  }

  if (isLoading) {
    return <ApprovalDetailSkeleton />;
  }

  if (isError || !job) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <WarningCircle className="size-12 text-danger-500" />
        <div>
          <h2 className="text-lg font-semibold text-neutral-800">Không tìm thấy yêu cầu tuyển dụng</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Yêu cầu không tồn tại, đã được xử lý hoặc bạn không có quyền truy cập.
          </p>
        </div>
        <Link to={ROUTES.JOB_APPROVALS}>
          <Button variant="outline" className="mt-2">
            <ArrowLeft className="mr-1.5 size-4" />
            Quay lại danh sách
          </Button>
        </Link>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[job.status] ?? {
    label: job.status,
    variant: 'neutral' as BadgeVariant,
    desc: '',
  };

  const isPending = job.status === 'PENDING_APPROVAL';

  return (
    <div className="flex flex-col gap-6">
      {/* Top Navigation & Header */}
      <div className="flex flex-col gap-3">
        <Link
          to={ROUTES.JOB_APPROVALS}
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <ArrowLeft className="size-4" />
          <span>Quay lại danh sách phê duyệt</span>
        </Link>

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold text-neutral-900">{job.title}</h1>
              <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
              {job.employmentType && (
                <Badge variant="primary">{EMPLOYMENT_TYPE_LABELS[job.employmentType]}</Badge>
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
      </div>

      {/* Status Notice Banner if already processed */}
      {!isPending && (
        <div
          className={cn(
            'flex items-center gap-3 rounded-lg border p-4 text-sm',
            job.status === 'APPROVED'
              ? 'border-success-200 bg-success-50 text-success-800'
              : job.status === 'REJECTED'
                ? 'border-danger-200 bg-danger-50 text-danger-800'
                : 'border-neutral-200 bg-neutral-50 text-neutral-800',
          )}
        >
          {job.status === 'APPROVED' ? (
            <CheckCircle className="size-5 shrink-0 text-success-600" weight="fill" />
          ) : job.status === 'REJECTED' ? (
            <XCircle className="size-5 shrink-0 text-danger-600" weight="fill" />
          ) : (
            <WarningCircle className="size-5 shrink-0 text-neutral-500" />
          )}
          <div>
            <span className="font-semibold">{statusCfg.label}: </span>
            <span>{statusCfg.desc}</span>
          </div>
        </div>
      )}

      {/* Main Grid: 2/3 Content + 1/3 Action Panel */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        {/* Left Column: Job Details & Pipeline Flow */}
        <div className="flex flex-col gap-6 lg:col-span-2">
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
                <CurrencyCircleDollar className="size-3.5" /> Mức lương đề xuất
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

          {/* Section: Quy trình tuyển dụng (Pipeline) */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <GitBranch className="size-5 text-primary-600" />
                <h2 className="text-base font-bold text-neutral-900">Quy trình tuyển dụng (Pipeline)</h2>
              </div>
              {job.pipelineTemplateName && (
                <span className="text-xs font-medium text-neutral-500">
                  Mẫu: <strong className="text-neutral-800">{job.pipelineTemplateName}</strong> ({job.pipelineStages?.length ?? 0} bước)
                </span>
              )}
            </div>

            {job.pipelineStages && job.pipelineStages.length > 0 ? (
              <div className="mt-4 flex flex-col gap-3">
                <p className="text-xs text-neutral-500">
                  Các ứng viên nộp hồ sơ vào vị trí này sẽ lần lượt trải qua các giai đoạn sau:
                </p>

                {/* Pipeline visual cards */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {job.pipelineStages.map((stage, index) => {
                    const StageIcon = STAGE_TYPE_ICONS[stage.stageType] ?? FileText;
                    const badgeVariant = STAGE_TYPE_BADGE_VARIANTS[stage.stageType] ?? 'neutral';

                    return (
                      <div
                        key={stage.id}
                        className={cn(
                          'relative flex flex-col justify-between rounded-lg border p-3.5 transition-shadow hover:shadow-xs',
                          stage.terminal
                            ? stage.stageType === 'TERMINAL_SUCCESS'
                              ? 'border-success-200 bg-success-50/40'
                              : 'border-danger-200 bg-danger-50/40'
                            : 'border-neutral-200 bg-neutral-50/60',
                        )}
                      >
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="flex size-5 items-center justify-center rounded-full bg-neutral-200 text-xs font-bold text-neutral-700">
                              {index + 1}
                            </span>
                            <Badge variant={badgeVariant} className="text-[10px]">
                              {STAGE_TYPE_LABELS[stage.stageType]}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2 mt-1">
                            <StageIcon className="size-4 shrink-0 text-neutral-600" />
                            <span className="font-semibold text-sm text-neutral-900 truncate" title={stage.name}>
                              {stage.name}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t border-neutral-200/60 pt-2 text-[11px] text-neutral-500">
                          {stage.slaHours ? (
                            <span className="flex items-center gap-1 text-warning-700 font-medium">
                              <Clock className="size-3" /> SLA: {stage.slaHours}h
                            </span>
                          ) : (
                            <span className="text-neutral-400">Không đặt SLA</span>
                          )}
                          {stage.terminal && (
                            <span className="font-medium text-neutral-600">Giai đoạn kết thúc</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-md bg-neutral-50 p-4 text-center text-xs text-neutral-400">
                Chưa gán quy trình tuyển dụng cụ thể cho vị trí này.
              </div>
            )}
          </div>

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
        </div>

        {/* Right Column: Action & Metadata Panel */}
        <div className="sticky top-6 flex flex-col gap-5">
          {/* Action Card */}
          <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-700">
              Quyết định của Hiring Manager
            </h3>
            <p className="mt-1 text-xs text-neutral-500">
              Đảm bảo số lượng chỉ tiêu và ngân sách chi trả đúng theo kế hoạch phòng ban.
            </p>

            {isPending ? (
              <div className="mt-5 flex flex-col gap-2.5">
                <Button
                  variant="primary"
                  fullWidth
                  isLoading={approveMutation.isPending}
                  disabled={rejectMutation.isPending}
                  onClick={() => approveMutation.mutate()}
                  className="bg-success-600 hover:bg-success-700 active:bg-success-800"
                >
                  <CheckCircle className="mr-1.5 size-5" weight="bold" />
                  Phê duyệt yêu cầu
                </Button>

                <Button
                  variant="danger"
                  fullWidth
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                  onClick={handleOpenRejectModal}
                >
                  <XCircle className="mr-1.5 size-5" weight="bold" />
                  Từ chối yêu cầu
                </Button>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-2 rounded-md bg-neutral-50 p-3 text-center text-xs text-neutral-500">
                <p className="font-medium text-neutral-700">Yêu cầu đã được xử lý</p>
                <p>Trạng thái hiện tại: <strong className="text-neutral-900">{statusCfg.label}</strong></p>
              </div>
            )}
          </div>

          {/* Submission Metadata Card */}
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-5 text-xs text-neutral-600">
            <h4 className="font-semibold uppercase tracking-wider text-neutral-700">
              Thông tin gửi duyệt
            </h4>
            <div className="mt-3 flex flex-col gap-2.5">
              <div className="flex items-center justify-between border-b border-neutral-200/80 pb-2">
                <span className="text-neutral-500">Người tạo (Recruiter):</span>
                <span className="font-medium text-neutral-900">
                  {job.createdByUserName || '—'}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-neutral-200/80 pb-2">
                <span className="text-neutral-500">Thời gian gửi:</span>
                <span className="font-medium text-neutral-900">
                  {formatDate(job.submittedAt)}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-neutral-200/80 pb-2">
                <span className="text-neutral-500">Thời gian chờ:</span>
                <span className="font-medium text-neutral-900">
                  {formatRelativeTime(job.submittedAt)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Quy trình tuyển dụng:</span>
                <span className="font-medium text-neutral-900 truncate max-w-[140px]" title={job.pipelineTemplateName ?? 'Chưa gán'}>
                  {job.pipelineTemplateName || 'Chưa gán'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal (AF-01) */}
      <Modal
        open={isRejectModalOpen}
        onClose={() => !rejectMutation.isPending && setIsRejectModalOpen(false)}
        title="Từ chối yêu cầu tuyển dụng"
        description="Vui lòng cung cấp lý do chi tiết để Recruiter có thể chỉnh sửa lại bản mô tả công việc hoặc chỉ tiêu tuyển dụng."
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsRejectModalOpen(false)}
              disabled={rejectMutation.isPending}
            >
              Hủy bỏ
            </Button>
            <Button
              variant="danger"
              isLoading={rejectMutation.isPending}
              onClick={handleConfirmReject}
            >
              Xác nhận từ chối
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="reject-reason" className="text-sm font-medium text-neutral-800">
            Lý do từ chối <span className="text-danger-500">*</span>
          </label>
          <textarea
            id="reject-reason"
            rows={4}
            value={rejectReason}
            onChange={(e) => {
              setRejectReason(e.target.value);
              if (rejectError && e.target.value.trim().length >= 10) {
                setRejectError(null);
              }
            }}
            placeholder="Ví dụ: Vượt quá ngân sách phòng ban trong quý này; Cần bổ sung yêu cầu kỹ năng tiếng Anh..."
            className={cn(
              'w-full rounded-md border p-3 text-sm transition-colors outline-none focus:ring-2',
              rejectError
                ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20'
                : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500/20',
            )}
          />
          <div className="flex items-center justify-between text-xs">
            {rejectError ? (
              <span className="font-medium text-danger-600">{rejectError}</span>
            ) : (
              <span className="text-neutral-400">Tối thiểu 10 ký tự (BR-APR-02)</span>
            )}
            <span
              className={cn(
                'font-mono',
                rejectReason.trim().length < 10 ? 'text-neutral-400' : 'text-success-600 font-semibold',
              )}
            >
              {rejectReason.trim().length}/10 ký tự
            </span>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ApprovalDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-5 w-32" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-44 w-full rounded-lg" />
          <Skeleton className="h-44 w-full rounded-lg" />
        </div>
        <div className="flex flex-col gap-5">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-36 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
