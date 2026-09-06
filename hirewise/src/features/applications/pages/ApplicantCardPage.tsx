import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowSquareOut,
  Buildings,
  CalendarBlank,
  Clock,
  EnvelopeSimple,
  File as FileIcon,
  Phone,
  Prohibit,
  ReadCvLogo,
  UserCircle,
  WarningCircle,
  XCircle,
} from '@phosphor-icons/react';
import { Badge, type BadgeVariant } from '@/components/ui/Badge/Badge';
import { Button } from '@/components/ui/Button/Button';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { useAuthStore } from '@/store/useAuthStore';
import { AppError } from '@/types/api';
import { useNotification } from '@/hooks/useNotification';
import { formatDate, formatDateTime, formatRelativeTime } from '@/utils/formatters';
import { ROUTES } from '@/constants/routes';
import { getApplicationDetail, downloadApplicationFile } from '../api/applicationsApi';
import { AiMatchAnalysisSection } from '../components/AiMatchAnalysisSection';
import { RejectApplicationModal } from '../components/RejectApplicationModal';
import { getLatestOffer } from '@/features/offers/api/offersApi';
import { CreateOfferModal } from '@/features/offers/components/CreateOfferModal';
import { OfferReviewPanel } from '@/features/offers/components/OfferReviewPanel';
import {
  APPLICATION_FILE_ROLE_LABELS,
  CANDIDATE_STATUS_LABELS,
  STAGE_TRANSITION_TYPE_LABELS,
} from '../types';
import { APPLICATION_STATUS_LABELS } from '@/features/kanban/types';

const STATUS_BADGE_VARIANT: Record<string, BadgeVariant> = {
  NEW: 'info',
  IN_PROGRESS: 'primary',
  OFFER_SENT: 'warning',
  HIRED: 'success',
  REFUSED: 'danger',
  WITHDRAWN: 'neutral',
};

function formatFileSize(sizeBytes: number): string {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * UC-20 main flow: Applicant Card — chi tiết đầy đủ 1 hồ sơ ứng tuyển
 * (Application), gồm thông tin ứng viên, file đính kèm, dòng thời gian đổi
 * Stage và bản ghi từ chối (nếu có, UC-29). Đây cũng là điểm vào duy nhất
 * để thực hiện Từ chối ứng viên (UC-29) — xem `RejectApplicationModal`.
 */
export function ApplicantCardPage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const notify = useNotification();
  const currentUser = useAuthStore((state) => state.user);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isCreateOfferModalOpen, setIsCreateOfferModalOpen] = useState(false);
  const [openingFileId, setOpeningFileId] = useState<number | null>(null);

  const {
    data: application,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['applications', 'detail', applicationId],
    queryFn: () => getApplicationDetail(applicationId!),
    enabled: !!applicationId,
  });

  // UI-only gate — quyền thật (APPLICATION_REJECT + ownership Layer 4) luôn
  // được backend kiểm tra lại; đây chỉ để ẩn nút với ai chắc chắn không có quyền.
  const canReject = currentUser?.permissions.includes('APPLICATION_REJECT') ?? false;
  const canView = currentUser?.permissions.includes('APPLICATION_VIEW') ?? false;
  const canViewAi = currentUser?.permissions.includes('AI_VIEW') ?? false;
  const canCreateOffer = currentUser?.permissions.includes('OFFER_CREATE') ?? false;
  const canSendOffer = currentUser?.permissions.includes('OFFER_SEND') ?? false;

  // UC-36/37: Offer mới nhất của hồ sơ (backend trả 204 -> null khi chưa có).
  // Chỉ hỏi khi người dùng có quyền, tránh 403 rác trên tab Network.
  const { data: latestOffer } = useQuery({
    queryKey: ['offers', 'latest', applicationId],
    queryFn: () => getLatestOffer(applicationId!),
    enabled: !!applicationId && canCreateOffer,
  });

  async function handleOpenFile(fileId: number) {
    if (!applicationId) return;
    try {
      setOpeningFileId(fileId);
      const blob = await downloadApplicationFile(applicationId, fileId);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      // Revoke the object URL after a short delay to free memory, assuming the new tab has loaded it
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (error) {
      // apiClient quy đổi MỌI lỗi về AppError, nên mã lỗi backend nằm ở
      // `error.code` — không phải `error.response.data`.
      if (error instanceof AppError && error.code === 'FILE_NOT_YET_AVAILABLE') {
        notify.error('File chưa sẵn sàng, vui lòng thử lại sau ít phút.');
      } else {
        notify.error('Không thể mở file. Vui lòng thử lại sau.');
      }
    } finally {
      setOpeningFileId(null);
    }
  }

  if (isLoading) {
    return <ApplicantCardSkeleton />;
  }

  if (isError || !application) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <WarningCircle className="size-12 text-danger-500" />
        <div>
          <h2 className="text-lg font-semibold text-neutral-800">Không tìm thấy hồ sơ ứng tuyển</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Hồ sơ không tồn tại hoặc bạn không có quyền truy cập.
          </p>
        </div>
        <Button variant="outline" className="mt-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-1.5 size-4" />
          Quay lại
        </Button>
      </div>
    );
  }

  const canRejectNow = canReject && !application.currentStageTerminal;
  // BR-OFFER-01: chỉ tạo Offer khi hồ sơ đã vào Stage Offer và chưa có Offer
  // active nào. Đây chỉ là gate UI — backend luôn kiểm tra lại (EX-01).
  const hasActiveOffer = latestOffer?.status === 'DRAFT' || latestOffer?.status === 'SENT';
  const canCreateOfferNow =
    canCreateOffer && application.currentStageType === 'OFFER' && !hasActiveOffer;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          to={`${ROUTES.JOB_DETAIL.replace(':jobId', application.jobId)}?tab=kanban`}
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <ArrowLeft className="size-4" />
          <span>Quay lại Kanban board</span>
        </Link>

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold text-neutral-900">{application.candidateName}</h1>
              <Badge variant={STATUS_BADGE_VARIANT[application.status] ?? 'neutral'}>
                {APPLICATION_STATUS_LABELS[application.status]}
              </Badge>
              {application.candidateStatus === 'BLACKLISTED' && (
                <Badge variant="danger">
                  <Prohibit className="size-3" weight="bold" />
                  {CANDIDATE_STATUS_LABELS.BLACKLISTED}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-500">
              <span className="inline-flex items-center gap-1">
                <Buildings className="size-4 text-neutral-400" />
                {application.jobTitle}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-4 text-neutral-400" />
                Stage hiện tại: <strong className="text-neutral-800">{application.currentStageName}</strong>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canCreateOfferNow && (
              <Button onClick={() => setIsCreateOfferModalOpen(true)}>
                <ReadCvLogo className="mr-1.5 size-5" weight="bold" />
                Tạo Offer
              </Button>
            )}
            {canRejectNow && (
              <Button variant="danger" onClick={() => setIsRejectModalOpen(true)}>
                <XCircle className="mr-1.5 size-5" weight="bold" />
                Từ chối ứng viên
              </Button>
            )}
          </div>
        </div>
      </div>

      {application.rejection && (
        <div className="flex items-start gap-3 rounded-lg border border-danger-200 bg-danger-50 p-4 text-sm text-danger-800">
          <XCircle className="mt-0.5 size-5 shrink-0 text-danger-600" weight="fill" />
          <div className="flex flex-col gap-1">
            <span className="font-semibold">
              Đã từ chối — {application.rejection.reasonLabel}
            </span>
            {application.rejection.customMessage && (
              <span>Ghi chú: {application.rejection.customMessage}</span>
            )}
            <span className="text-xs text-danger-600/80">
              {application.rejection.rejectedByName
                ? `Bởi ${application.rejection.rejectedByName} · `
                : ''}
              {formatDateTime(application.rejection.rejectedAt)} · Email thông báo đã được gửi tự động (UC-30)
            </span>
          </div>
        </div>
      )}

      {/* UC-37: xem trước & gửi Offer. Chỉ hiện khi hồ sơ đã có Offer. */}
      {latestOffer && <OfferReviewPanel offer={latestOffer} canSend={canSendOffer} />}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* UC-21: AI Match Analysis */}
          {canViewAi && (
            <AiMatchAnalysisSection applicationId={application.applicationId} canRun={canViewAi} />
          )}

          {/* Files */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <h2 className="text-base font-bold text-neutral-900">Hồ sơ đính kèm</h2>
            {application.files.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-400">Chưa có file đính kèm nào.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {application.files.map((file) => (
                  <li
                    key={file.fileId}
                    className="flex items-center justify-between gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-3"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <FileIcon className="size-5 shrink-0 text-neutral-400" />
                      <div className="flex flex-col truncate">
                        <span className="truncate text-sm font-medium text-neutral-800">
                          {file.fileName}
                        </span>
                        <span className="text-xs text-neutral-400">
                          {APPLICATION_FILE_ROLE_LABELS[file.fileRole]} · {formatFileSize(file.sizeBytes)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {file.primary && <Badge variant="primary">Chính</Badge>}
                      {canView && (
                        <Button
                          variant="ghost"
                          size="sm"
                          isLoading={openingFileId === file.fileId}
                          onClick={() => handleOpenFile(file.fileId)}
                          className="h-8 px-2 text-neutral-500 hover:text-primary-600"
                        >
                          <ArrowSquareOut className="size-4" />
                          <span className="sr-only">Mở file</span>
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Stage history timeline */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <h2 className="text-base font-bold text-neutral-900">Dòng thời gian</h2>
            {application.stageHistory.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-400">Chưa có lịch sử thay đổi.</p>
            ) : (
              <ol className="mt-4 flex flex-col gap-4">
                {application.stageHistory.map((entry, index) => (
                  <li key={index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className="size-2.5 shrink-0 rounded-full bg-primary-500" />
                      {index < application.stageHistory.length - 1 && (
                        <span className="mt-1 w-px flex-1 bg-neutral-200" />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-0.5 pb-1">
                      <span className="text-sm font-medium text-neutral-800">
                        {entry.fromStageName ? `${entry.fromStageName} → ${entry.toStageName}` : entry.toStageName}
                      </span>
                      <span className="text-xs text-neutral-400">
                        {STAGE_TRANSITION_TYPE_LABELS[entry.transitionType]}
                        {entry.changedByName ? ` · ${entry.changedByName}` : ''} ·{' '}
                        {formatRelativeTime(entry.changedAt)}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        {/* Right column: candidate info */}
        <div className="sticky top-6 flex flex-col gap-5">
          <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-xs">
            <h3 className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-neutral-700">
              <UserCircle className="size-4" />
              Thông tin ứng viên
            </h3>
            <div className="mt-3 flex flex-col gap-2.5 text-sm">
              <span className="flex items-center gap-2 text-neutral-700">
                <EnvelopeSimple className="size-4 shrink-0 text-neutral-400" />
                <span className="truncate">{application.candidateEmail}</span>
              </span>
              <span className="flex items-center gap-2 text-neutral-700">
                <Phone className="size-4 shrink-0 text-neutral-400" />
                {application.candidatePhone}
              </span>
              <span className="flex items-center gap-2 text-neutral-700">
                <CalendarBlank className="size-4 shrink-0 text-neutral-400" />
                Ứng tuyển {formatDate(application.appliedAt)}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-5 text-xs text-neutral-600">
            <h4 className="font-semibold uppercase tracking-wider text-neutral-700">Thông tin hồ sơ</h4>
            <div className="mt-3 flex flex-col gap-2.5">
              <div className="flex items-center justify-between border-b border-neutral-200/80 pb-2">
                <span className="text-neutral-500">Stage hiện tại:</span>
                <span className="font-medium text-neutral-900">{application.currentStageName}</span>
              </div>
              <div className="flex items-center justify-between border-b border-neutral-200/80 pb-2">
                <span className="text-neutral-500">Lần đổi Stage gần nhất:</span>
                <span className="font-medium text-neutral-900">
                  {application.lastStageChangedAt ? formatRelativeTime(application.lastStageChangedAt) : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Trạng thái ứng viên:</span>
                <span className="font-medium text-neutral-900">
                  {CANDIDATE_STATUS_LABELS[application.candidateStatus]}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CreateOfferModal
        open={isCreateOfferModalOpen}
        onClose={() => setIsCreateOfferModalOpen(false)}
        applicationId={application.applicationId}
        candidateName={application.candidateName}
      />

      <RejectApplicationModal
        open={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        applicationId={application.applicationId}
        candidateName={application.candidateName}
      />
    </div>
  );
}

function ApplicantCardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-5 w-32" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-56 w-full rounded-lg" />
        </div>
        <div className="flex flex-col gap-5">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
