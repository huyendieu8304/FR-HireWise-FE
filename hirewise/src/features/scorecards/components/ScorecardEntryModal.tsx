import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LockKey } from '@phosphor-icons/react';
import { Modal } from '@/components/ui/Modal/Modal';
import { Button } from '@/components/ui/Button/Button';
import { Badge } from '@/components/ui/Badge/Badge';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { useNotification } from '@/hooks/useNotification';
import { getOrCreateScorecardForm, saveScorecardProgress, submitScorecard } from '../api/scorecardsApi';
import { StarRating } from './StarRating';
import type { SaveScorecardScoresRequest, ScorecardSubmission } from '../types';

export interface ScorecardEntryModalProps {
  open: boolean;
  onClose: () => void;
  interviewId: string;
  candidateName?: string;
  /** Gọi lại sau khi lưu/gửi thành công, để trang cha refetch danh sách tổng hợp. */
  onSaved?: () => void;
}

const TEXTAREA_CLASSES =
  'w-full rounded-md border border-neutral-300 p-2.5 text-sm transition-colors outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400';

interface ScoreInput {
  score: number | null;
  comment: string;
}

function buildInitialScoreInputs(submission: ScorecardSubmission): Record<string, ScoreInput> {
  return Object.fromEntries(
    submission.scores.map((row) => [row.criterionId, { score: row.score, comment: row.comment ?? '' }]),
  );
}

/**
 * UC-28: "Scorecard Entry" — chấm điểm từng tiêu chí (Interactive Star
 * Rating) + nhận xét, cho 1 Interview cụ thể. Mở qua `GET
 * /interviews/{id}/scorecard` (tự tạo 1 bản DRAFT rỗng nếu là lần đầu).
 * <p>
 * Không dùng CV Viewer song song như mock-up SRS (`Screen: Scorecard Entry
 * song song CV Viewer`) — modal đè lên Applicant Card, ứng viên/CV đã hiển
 * thị sẵn ở chính trang đó phía sau; mở thêm 1 PDF viewer thứ 2 bên trong
 * modal là dư thừa cho MVP này.
 * <p>
 * Component này chỉ lo phần fetch + loading/error; một khi có dữ liệu, việc
 * render form thật được giao cho {@link ScorecardEntryFormModal} — tách
 * riêng để state chỉnh sửa (điểm/nhận xét) được khởi tạo TRỰC TIẾP từ
 * `submission` ngay lúc mount (qua `key={submission.submissionId}`) thay vì
 * đồng bộ bằng `useEffect` + `setState` (tránh cascading render, xem
 * `react-hooks/set-state-in-effect`).
 */
export function ScorecardEntryModal({ open, onClose, interviewId, candidateName, onSaved }: ScorecardEntryModalProps) {
  const queryKey = ['scorecards', 'entry', interviewId];

  const {
    data: submission,
    isLoading,
    isError,
  } = useQuery({
    queryKey,
    queryFn: () => getOrCreateScorecardForm(interviewId),
    enabled: open,
  });

  if (!open) return null;

  if (isLoading || isError || !submission) {
    return (
      <Modal
        open
        onClose={onClose}
        title={candidateName ? `Scorecard — ${candidateName}` : 'Scorecard'}
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
          <p className="text-sm text-danger-600">
            Không thể tải form chấm điểm — bạn có thể không phải Interviewer được phân công hoặc Hiring Manager của
            buổi phỏng vấn này.
          </p>
        )}
      </Modal>
    );
  }

  return (
    <ScorecardEntryFormModal
      key={submission.submissionId}
      submission={submission}
      queryKey={queryKey}
      candidateName={candidateName}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

interface ScorecardEntryFormModalProps {
  submission: ScorecardSubmission;
  queryKey: unknown[];
  candidateName?: string;
  onClose: () => void;
  onSaved?: () => void;
}

function ScorecardEntryFormModal({ submission, queryKey, candidateName, onClose, onSaved }: ScorecardEntryFormModalProps) {
  const notify = useNotification();
  const queryClient = useQueryClient();

  const [scoreInputs, setScoreInputs] = useState<Record<string, ScoreInput>>(() => buildInitialScoreInputs(submission));
  const [overallComment, setOverallComment] = useState(submission.overallComment ?? '');

  function buildRequest(): SaveScorecardScoresRequest {
    return {
      overallComment,
      scores: Object.entries(scoreInputs).map(([criterionId, input]) => ({
        criterionId,
        score: input.score,
        comment: input.comment || null,
      })),
    };
  }

  const saveMutation = useMutation({
    mutationFn: () => saveScorecardProgress(submission.submissionId, buildRequest()),
    onSuccess: () => {
      notify.success('Đã lưu tiến trình chấm điểm.');
      queryClient.invalidateQueries({ queryKey });
      onSaved?.();
    },
    onError: (error) => notify.error(error),
  });

  const submitMutation = useMutation({
    // Lưu bản mới nhất TRƯỚC khi Submit — Submit chỉ validate/tính điểm trên
    // dữ liệu đã lưu trong DB, không nhận body, nên phải chắc chắn những gì
    // vừa gõ đã được ghi lại trước khi backend kiểm tra BR-SCORE-01.
    mutationFn: async () => {
      await saveScorecardProgress(submission.submissionId, buildRequest());
      return submitScorecard(submission.submissionId);
    },
    onSuccess: () => {
      notify.success('Đã gửi đánh giá thành công.');
      queryClient.invalidateQueries({ queryKey });
      onSaved?.();
    },
    onError: (error) => notify.error(error),
  });

  const isLocked = !!submission.lockedAt;

  function updateScore(criterionId: string, score: number) {
    setScoreInputs((prev) => ({ ...prev, [criterionId]: { score, comment: prev[criterionId]?.comment ?? '' } }));
  }

  function updateComment(criterionId: string, comment: string) {
    setScoreInputs((prev) => ({ ...prev, [criterionId]: { score: prev[criterionId]?.score ?? null, comment } }));
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={candidateName ? `Scorecard — ${candidateName}` : 'Scorecard'}
      description={submission.stageName ? `${submission.stageName} · ${submission.jobStageScorecardName}` : submission.jobStageScorecardName}
      size="lg"
      footer={
        !isLocked ? (
          <>
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
            <Button variant="secondary" isLoading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
              Lưu tạm
            </Button>
            <Button isLoading={submitMutation.isPending} onClick={() => submitMutation.mutate()}>
              Gửi đánh giá
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        )
      }
    >
      <div className="flex flex-col gap-5">
        {isLocked && (
          <div className="flex items-start gap-2 rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-600">
            <LockKey className="mt-0.5 size-4 shrink-0" />
            <span>
              Scorecard này đã bị khoá chỉnh sửa sau 24 giờ kể từ khi phỏng vấn diễn ra (BR-SCORE-03). Liên hệ HR
              Admin nếu cần mở khoá.
            </span>
          </div>
        )}
        {submission.status === 'SUBMITTED' && (
          <Badge variant="success" className="w-fit">
            Đã gửi đánh giá{submission.weightedScore !== null ? ` — ${submission.weightedScore.toFixed(2)} điểm trọng số` : ''}
          </Badge>
        )}

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
            <StarRating
              maxScore={row.maxScore}
              value={scoreInputs[row.criterionId]?.score ?? null}
              disabled={isLocked}
              onChange={(value) => updateScore(row.criterionId, value)}
            />
            <textarea
              rows={2}
              disabled={isLocked}
              placeholder="Nhận xét cho tiêu chí này (không bắt buộc)..."
              value={scoreInputs[row.criterionId]?.comment ?? ''}
              onChange={(e) => updateComment(row.criterionId, e.target.value)}
              className={TEXTAREA_CLASSES}
            />
          </div>
        ))}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="scorecard-overall-comment" className="text-sm font-medium text-neutral-800">
            Nhận xét tổng quan <span className="text-danger-500">*</span>
          </label>
          <textarea
            id="scorecard-overall-comment"
            rows={3}
            disabled={isLocked}
            placeholder="Đánh giá tổng quan về ứng viên - bắt buộc trước khi gửi đánh giá (BR-SCORE-01)..."
            value={overallComment}
            onChange={(e) => setOverallComment(e.target.value)}
            className={TEXTAREA_CLASSES}
          />
        </div>
      </div>
    </Modal>
  );
}
