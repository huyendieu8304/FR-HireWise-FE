import { useQuery } from '@tanstack/react-query';
import { LockKey } from '@phosphor-icons/react';
import { Modal } from '@/components/ui/Modal/Modal';
import { Button } from '@/components/ui/Button/Button';
import { Badge } from '@/components/ui/Badge/Badge';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { getScorecardSubmissionDetail } from '../api/scorecardsApi';
import { StarRating } from './StarRating';

export interface ScorecardDetailModalProps {
  open: boolean;
  onClose: () => void;
  submissionId: string;
  candidateName?: string;
  evaluatorName?: string;
}

const TEXTAREA_CLASSES =
  'w-full rounded-md border border-neutral-300 p-2.5 text-sm transition-colors outline-none disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500';

/**
 * Xem chi tiết 1 Scorecard Submission — CHỈ ĐỌC, dành cho người xem KHÔNG
 * phải chính evaluator đó (Recruiter, HR Admin, hoặc 1 Interviewer khác
 * xem lại đánh giá của đồng nghiệp). Khác hẳn `ScorecardEntryModal` (chấm
 * điểm/sửa của CHÍNH người gọi) — modal này không có mutation nào, chỉ
 * `GET /scorecard-submissions/{id}` (mở cho mọi người có `APPLICATION_VIEW`,
 * không đòi hỏi phải là evaluator hợp lệ) rồi render mọi input ở trạng
 * thái `disabled`.
 */
export function ScorecardDetailModal({ open, onClose, submissionId, candidateName, evaluatorName }: ScorecardDetailModalProps) {
  const { data: submission, isLoading, isError } = useQuery({
    queryKey: ['scorecards', 'detail', submissionId],
    queryFn: () => getScorecardSubmissionDetail(submissionId),
    enabled: open,
  });

  if (!open) return null;

  const title = candidateName ? `Scorecard — ${candidateName}` : 'Scorecard';

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      description={
        submission
          ? [submission.stageName, submission.jobStageScorecardName, evaluatorName ?? submission.evaluatorName]
              .filter(Boolean)
              .join(' · ')
          : evaluatorName
      }
      size="lg"
      footer={
        <Button variant="outline" onClick={onClose}>
          Đóng
        </Button>
      }
    >
      {isLoading && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {isError && (
        <p className="text-sm text-danger-600">Không thể tải chi tiết Scorecard. Vui lòng thử lại sau.</p>
      )}

      {submission && (
        <div className="flex flex-col gap-5">
          {submission.lockedAt && (
            <div className="flex items-start gap-2 rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-600">
              <LockKey className="mt-0.5 size-4 shrink-0" />
              <span>Scorecard này đã bị khoá chỉnh sửa sau 24 giờ kể từ khi phỏng vấn diễn ra (BR-SCORE-03).</span>
            </div>
          )}
          <Badge variant={submission.status === 'SUBMITTED' ? 'success' : 'neutral'} className="w-fit">
            {submission.status === 'SUBMITTED' ? 'Đã gửi đánh giá' : 'Đang chấm (nháp)'}
            {submission.weightedScore !== null ? ` — ${submission.weightedScore.toFixed(2)} điểm trọng số` : ''}
          </Badge>

          {submission.scores.map((row) => (
            <div key={row.criterionId} className="flex flex-col gap-2.5 rounded-lg border border-neutral-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-sm font-semibold text-neutral-900">
                    {row.criterionName}
                    {row.required && <span className="ml-1 text-danger-500">*</span>}
                  </span>
                  {row.criterionDescription && (
                    <p className="mt-0.5 text-xs text-neutral-500">{row.criterionDescription}</p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-neutral-400">Trọng số {row.weight}</span>
              </div>
              <StarRating maxScore={row.maxScore} value={row.score} disabled onChange={() => {}} />
              {row.comment && (
                <textarea rows={2} disabled value={row.comment} className={TEXTAREA_CLASSES} />
              )}
            </div>
          ))}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-neutral-800">Nhận xét tổng quan</label>
            <textarea
              rows={3}
              disabled
              value={submission.overallComment ?? '(chưa có nhận xét)'}
              className={TEXTAREA_CLASSES}
            />
          </div>
        </div>
      )}
    </Modal>
  );
}
