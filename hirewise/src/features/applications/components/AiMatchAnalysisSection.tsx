import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowClockwise, CheckCircle, Sparkle, WarningCircle, XCircle } from '@phosphor-icons/react';
import { Badge, type BadgeVariant } from '@/components/ui/Badge/Badge';
import { Button } from '@/components/ui/Button/Button';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { useNotification } from '@/hooks/useNotification';
import { getAiScreeningResult, runAiScreening } from '../api/applicationsApi';

export interface AiMatchAnalysisSectionProps {
  applicationId: string;
  /** Chỉ hiện nút "Phân tích lại" khi caller có quyền `AI_VIEW` (UC-21 AF-01). */
  canRun: boolean;
}

/** BR-AI-03: Xanh &gt;80%, Cam 50-79%, Đỏ &lt;50%. */
function matchScoreBadgeVariant(score: number): BadgeVariant {
  if (score > 80) return 'success';
  if (score >= 50) return 'warning';
  return 'danger';
}

/**
 * UC-21: tab/khối "AI Match Analysis" trên Applicant Card — Match Score,
 * breakdown Matched/Missing Skills, và tóm tắt do AI sinh ra. AI Screening
 * chạy bất đồng bộ ở backend (tự động khi có Application mới, UC-17) nên
 * khi đang `PENDING`, component tự poll lại thay vì bắt Recruiter F5 tay.
 */
export function AiMatchAnalysisSection({ applicationId, canRun }: AiMatchAnalysisSectionProps) {
  const notify = useNotification();
  const queryClient = useQueryClient();
  const queryKey = ['applications', 'ai-screening', applicationId];

  const { data: result, isLoading } = useQuery({
    queryKey,
    queryFn: () => getAiScreeningResult(applicationId),
    refetchInterval: (query) => (query.state.data?.status === 'PENDING' ? 3000 : false),
  });

  const runMutation = useMutation({
    mutationFn: () => runAiScreening(applicationId),
    onSuccess: () => {
      notify.success('Đã yêu cầu phân tích lại — kết quả sẽ cập nhật sau ít phút.');
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => notify.error(error),
  });

  const isPending = result === null || result === undefined || result.status === 'PENDING';

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6">
      <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
        <div className="flex items-center gap-2">
          <Sparkle className="size-5 text-primary-600" weight="fill" />
          <h2 className="text-base font-bold text-neutral-900">Phân tích AI (Match Score)</h2>
        </div>
        {canRun && (
          <Button
            variant="outline"
            size="sm"
            isLoading={runMutation.isPending}
            disabled={isPending}
            onClick={() => runMutation.mutate()}
          >
            <ArrowClockwise className="size-4" />
            Phân tích lại
          </Button>
        )}
      </div>

      <div className="mt-4">
        {isLoading && (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}

        {!isLoading && isPending && (
          <div className="flex items-center gap-2 rounded-md bg-neutral-50 p-3 text-sm text-neutral-500">
            <span className="inline-block size-2 animate-pulse rounded-full bg-primary-400" />
            Đang xử lý — AI đang so khớp CV với JD, kết quả sẽ tự động hiện sau ít phút.
          </div>
        )}

        {!isLoading && result?.status === 'FAILED' && (
          <div className="flex items-start gap-2 rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-600">
            <WarningCircle className="mt-0.5 size-4 shrink-0 text-neutral-400" />
            <span>Không thể phân tích — {result.errorMessage ?? 'Đã xảy ra lỗi không xác định.'}</span>
          </div>
        )}

        {!isLoading && result?.status === 'SUCCEEDED' && (
          <div className="flex flex-col gap-4">
            <Badge variant={matchScoreBadgeVariant(result.matchScore ?? 0)} className="w-fit px-3 py-1 text-sm">
              {Math.round(result.matchScore ?? 0)}% phù hợp
            </Badge>

            {result.summary && (
              <p className="text-sm leading-relaxed text-neutral-700">{result.summary}</p>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-success-700 uppercase">
                  <CheckCircle className="size-3.5" weight="fill" />
                  Kỹ năng khớp
                </h3>
                {result.matchedSkills.length === 0 ? (
                  <p className="text-xs text-neutral-400">Không có</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {result.matchedSkills.map((skill) => (
                      <Badge key={skill} variant="success">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-danger-700 uppercase">
                  <XCircle className="size-3.5" weight="fill" />
                  Kỹ năng còn thiếu
                </h3>
                {result.missingSkills.length === 0 ? (
                  <p className="text-xs text-neutral-400">Không có</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {result.missingSkills.map((skill) => (
                      <Badge key={skill} variant="danger">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
