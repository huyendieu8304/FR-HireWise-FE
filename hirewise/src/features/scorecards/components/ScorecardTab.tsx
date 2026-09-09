import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarBlank, ClipboardText, Clock, Eye, LockKey, UserCircle, WarningCircle } from '@phosphor-icons/react';
import { Badge, type BadgeVariant } from '@/components/ui/Badge/Badge';
import { Button } from '@/components/ui/Button/Button';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { formatDate } from '@/utils/formatters';
import { getApplicationScorecards } from '../api/scorecardsApi';
import { ScorecardEntryModal } from './ScorecardEntryModal';
import { ScorecardDetailModal } from './ScorecardDetailModal';
import type { ScorecardSubmissionStatus } from '../types';

export interface ScorecardTabProps {
  applicationId: string;
  candidateName: string;
}

const INTERVIEW_STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Đã lên lịch',
  COMPLETED: 'Đã hoàn thành',
  CANCELLED: 'Đã huỷ',
  NO_SHOW: 'Vắng mặt',
};

const SUBMISSION_STATUS_VARIANT: Record<ScorecardSubmissionStatus, BadgeVariant> = {
  DRAFT: 'neutral',
  SUBMITTED: 'success',
};

const SUBMISSION_STATUS_LABELS: Record<ScorecardSubmissionStatus, string> = {
  DRAFT: 'Đang chấm',
  SUBMITTED: 'Đã gửi',
};

/**
 * UC-28 step 6: tab [Scorecard] trên Applicant Card — mọi Interview của hồ
 * sơ này, mỗi Interview có Scorecard riêng theo từng evaluator. Từ khi team
 * chốt lại phạm vi Scorecard theo (Job, Stage) thay vì theo Job, mỗi nhóm
 * Interview giờ hiển thị RÕ tên Stage của nó (vd "Technical Interview") vì
 * mỗi Stage loại phỏng vấn có bộ tiêu chí hoàn toàn độc lập. Điểm trọng số
 * trung bình hiển thị ở đầu trang là trung bình của MỌI Scorecard đã
 * `SUBMITTED` trên cả Application (không chỉ 1 Interview/Stage).
 * <p>
 * 2 nút tách biệt rõ ràng: nút "Chấm điểm" ở đầu mỗi nhóm Interview chỉ
 * hiện khi người xem là evaluator hợp lệ của buổi phỏng vấn đó
 * (`currentUserCanScore` — chỉ là gợi ý hiển thị, API chấm điểm thật vẫn
 * tự kiểm tra lại độc lập), mở modal chỉnh sửa CỦA CHÍNH họ. Riêng biệt,
 * mỗi dòng evaluator trong danh sách kết quả LUÔN có nút "Xem chi tiết"
 * (icon mắt) — ai có quyền xem tab này (Recruiter, HR Admin, Interviewer
 * khác...) cũng xem được chi tiết tiêu chí/nhận xét của BẤT KỲ ai đã chấm,
 * chỉ đọc, không sửa được (khác `ScorecardEntryModal` của evaluator đó).
 */
export function ScorecardTab({ applicationId, candidateName }: ScorecardTabProps) {
  const queryClient = useQueryClient();
  const [entryModalInterviewId, setEntryModalInterviewId] = useState<string | null>(null);
  const [detailModal, setDetailModal] = useState<{ submissionId: string; evaluatorName: string } | null>(null);
  const queryKey = ['scorecards', 'application', applicationId];

  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => getApplicationScorecards(applicationId),
    enabled: !!applicationId,
  });

  if (isLoading) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <WarningCircle className="size-8 text-danger-500" />
          <p className="text-sm text-neutral-500">Không thể tải dữ liệu Scorecard. Vui lòng thử lại sau.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold text-neutral-900">Scorecard đánh giá</h2>
        {data.averageWeightedScore !== null && (
          <Badge variant="primary" className="text-sm">
            Điểm trọng số trung bình: {data.averageWeightedScore.toFixed(2)}
          </Badge>
        )}
      </div>

      {data.interviews.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-400">
          Chưa có buổi phỏng vấn nào — Scorecard chỉ mở khi hồ sơ đã có lịch phỏng vấn.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-4">
          {data.interviews.map((group) => (
            <li key={group.interviewId} className="rounded-lg border border-neutral-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-neutral-900">{group.stageName ?? 'Phỏng vấn'}</span>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-600">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarBlank className="size-4 text-neutral-400" />
                      {formatDate(group.interviewDate)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="size-4 text-neutral-400" />
                      {group.interviewTime.slice(0, 5)}
                    </span>
                    <Badge variant="neutral">{INTERVIEW_STATUS_LABELS[group.status] ?? group.status}</Badge>
                  </div>
                </div>
                {group.currentUserCanScore && (
                  <Button size="sm" variant="outline" onClick={() => setEntryModalInterviewId(group.interviewId)}>
                    <ClipboardText className="mr-1.5 size-4" />
                    Chấm điểm
                  </Button>
                )}
              </div>

              {group.submissions.length === 0 ? (
                <p className="mt-3 text-sm text-neutral-400">Chưa có evaluator nào chấm điểm buổi này.</p>
              ) : (
                <ul className="mt-3 flex flex-col gap-2">
                  {group.submissions.map((submission) => (
                    <li
                      key={submission.submissionId}
                      className="flex items-center justify-between gap-3 rounded-md bg-neutral-50 px-3 py-2 text-sm"
                    >
                      <span className="flex items-center gap-2 text-neutral-700">
                        <UserCircle className="size-4 shrink-0 text-neutral-400" />
                        {submission.evaluatorName}
                        {submission.currentUser && <span className="text-xs text-neutral-400">(bạn)</span>}
                        {submission.locked && <LockKey className="size-3.5 text-neutral-400" />}
                      </span>
                      <span className="flex items-center gap-2">
                        {submission.weightedScore !== null && (
                          <span className="font-semibold text-neutral-800">{submission.weightedScore.toFixed(2)}</span>
                        )}
                        <Badge variant={SUBMISSION_STATUS_VARIANT[submission.status]}>
                          {SUBMISSION_STATUS_LABELS[submission.status]}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-neutral-500 hover:text-primary-600"
                          onClick={() =>
                            setDetailModal({ submissionId: submission.submissionId, evaluatorName: submission.evaluatorName })
                          }
                        >
                          <Eye className="size-4" />
                          <span className="sr-only">Xem chi tiết</span>
                        </Button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}

      {entryModalInterviewId && (
        <ScorecardEntryModal
          open
          onClose={() => setEntryModalInterviewId(null)}
          interviewId={entryModalInterviewId}
          candidateName={candidateName}
          // Refetch tổng hợp application để cập nhật điểm trung bình + status vừa đổi.
          onSaved={() => queryClient.invalidateQueries({ queryKey })}
        />
      )}

      {detailModal && (
        <ScorecardDetailModal
          open
          onClose={() => setDetailModal(null)}
          submissionId={detailModal.submissionId}
          candidateName={candidateName}
          evaluatorName={detailModal.evaluatorName}
        />
      )}
    </div>
  );
}
