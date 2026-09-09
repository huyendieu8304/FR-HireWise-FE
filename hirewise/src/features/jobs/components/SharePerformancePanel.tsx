import { useQuery } from '@tanstack/react-query';
import { ArrowSquareOut, ChartLineUp } from '@phosphor-icons/react';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { formatDateTime, formatNumber } from '@/utils/formatters';
import { getShareStats } from '../api/jobShareApi';

export interface SharePerformancePanelProps {
  jobId: string;
}

/**
 * UC-32 — "Theo dõi hiệu quả chia sẻ tin tuyển dụng".
 *
 * Ba con số mỗi kênh, và chúng KHÔNG đo cùng một thứ:
 *
 * - **Lượt chia sẻ**: số lần Recruiter bấm nút. Popup là của LinkedIn/Facebook
 *   nên không thể biết họ có đăng thật hay không.
 * - **Lượt xem**: số người thật mở link. Crawler của Facebook/LinkedIn bị lọc
 *   ở backend nên không làm phồng con số này.
 * - **Ứng viên**: số hồ sơ nộp kèm đúng `utm_source` của kênh. Nếu HR Admin
 *   đổi `utm_source` trong UC-19 thì hồ sơ cũ giữ nguyên giá trị cũ và không
 *   còn được tính vào kênh — cố ý, để không viết lại lịch sử.
 *
 * Vì vậy "Lượt xem" mới là chỉ số đáng tin để so sánh hiệu quả giữa các kênh.
 */
export function SharePerformancePanel({ jobId }: SharePerformancePanelProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['jobs', 'share-stats', jobId],
    queryFn: () => getShareStats(jobId),
  });

  return (
    <section className="shadow-elevation-1 bg-neutral-0 flex flex-col gap-4 rounded-lg border border-neutral-200 p-5">
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-md bg-neutral-100">
          <ChartLineUp className="size-5 text-neutral-600" />
        </span>
        <div className="flex flex-col">
          <h2 className="text-base font-semibold text-neutral-900">Hiệu quả chia sẻ</h2>
          <p className="text-sm text-neutral-500">
            Nguồn ứng viên đến từ các kênh bên ngoài
          </p>
        </div>
      </div>

      {isLoading && <Skeleton className="h-24 w-full" />}

      {isError && (
        <p className="text-sm text-neutral-500">Không tải được số liệu chia sẻ.</p>
      )}

      {data && data.rows.length === 0 && (
        <p className="rounded-md bg-neutral-50 px-3 py-2.5 text-sm text-neutral-600">
          Chưa chia sẻ ra kênh ngoài nào. Bấm [Chia sẻ] ở đầu trang để bắt đầu.
        </p>
      )}

      {data && data.rows.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-xs text-neutral-500">
                  <th className="pb-2 font-medium">Kênh</th>
                  <th className="pb-2 text-right font-medium">Lượt chia sẻ</th>
                  <th className="pb-2 text-right font-medium">Lượt xem</th>
                  <th className="pb-2 text-right font-medium">Ứng viên</th>
                  <th className="pb-2 text-right font-medium">Chia sẻ lần cuối</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr
                    key={row.code}
                    className="border-b border-neutral-100 last:border-0"
                  >
                    <td className="py-2.5">
                      <a
                        href={row.shareUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 font-medium"
                      >
                        {row.name}
                        <ArrowSquareOut className="size-3.5" />
                      </a>
                    </td>
                    <td className="py-2.5 text-right tabular-nums">
                      {formatNumber(row.shareCount)}
                    </td>
                    <td className="py-2.5 text-right tabular-nums">
                      {formatNumber(row.clickCount)}
                    </td>
                    <td className="py-2.5 text-right font-semibold tabular-nums">
                      {formatNumber(row.applicationCount)}
                    </td>
                    <td className="py-2.5 text-right text-neutral-500">
                      {formatDateTime(row.lastSharedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <dl className="grid grid-cols-2 gap-3 border-t border-neutral-200 pt-3 text-sm">
            <div className="flex flex-col">
              <dt className="text-neutral-500">Tổng hồ sơ</dt>
              <dd className="font-semibold text-neutral-900 tabular-nums">
                {formatNumber(data.totalApplications)}
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-neutral-500">Vào thẳng Job Board</dt>
              <dd className="font-semibold text-neutral-900 tabular-nums">
                {formatNumber(data.directApplications)}
              </dd>
            </div>
          </dl>
        </>
      )}
    </section>
  );
}
