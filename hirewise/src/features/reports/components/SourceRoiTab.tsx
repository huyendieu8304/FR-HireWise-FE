import { useQuery } from '@tanstack/react-query';
import {
  ChartPieSlice,
  Clock,
  Trophy,
  UsersThree,
  WarningCircle,
} from '@phosphor-icons/react';
import { EmptyState, Skeleton } from '@/components/ui';
import { KpiTile } from '@/features/dashboard/components/KpiTile';
import { formatNumber } from '@/utils/formatters/number';
import { getSourceRoiReport, toReportQueryParams } from '../api/reportsApi';
import { SourceRoiPieChart } from './SourceRoiPieChart';
import { SourceRoiTable } from './SourceRoiTable';
import { ME_37, MIN_SAMPLE_NOTE, type ReportFilterValue } from '../types';

export interface SourceRoiTabProps {
  filter: ReportFilterValue;
}

/**
 * UC-42 — "Xem Dashboard báo cáo hiệu quả nguồn tuyển dụng (Source ROI)".
 *
 * Lưu ý về chữ "ROI": hệ thống không lưu chi phí bỏ ra cho từng kênh, nên đây
 * **không** phải ROI tiền bạc mà là hiệu suất phễu — một nguồn được coi là tốt
 * khi nó không chỉ mang về nhiều hồ sơ mà còn mang về hồ sơ tuyển được. Câu
 * ghi chú dưới tiêu đề nói thẳng điều đó với người đọc, vì nếu không họ sẽ mặc
 * định hiểu là tiền.
 */
export function SourceRoiTab({ filter }: SourceRoiTabProps) {
  const params = toReportQueryParams(filter);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['reports', 'source-roi', params],
    queryFn: () => getSourceRoiReport(params),
  });

  if (isLoading) {
    return <ReportSkeleton />;
  }

  if (isError || !data) {
    return (
      <EmptyState
        icon={<WarningCircle className="size-10 text-danger-500" weight="thin" />}
        title="Không tải được báo cáo"
        hint="Vui lòng thử lại sau ít phút."
      />
    );
  }

  const isEmpty = data.rows.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile
          label="Tổng ứng viên"
          value={formatNumber(data.totalApplications)}
          icon={<UsersThree className="size-4" />}
          iconVariant="primary"
        />
        <KpiTile
          label="Tuyển thành công"
          value={formatNumber(data.totalHires)}
          icon={<Trophy className="size-4" />}
          iconVariant="success"
        />
        <KpiTile
          label="Tỷ lệ trúng tuyển"
          value={
            data.overallHireRate === null
              ? '—'
              : `${formatNumber(data.overallHireRate, { decimalPlaces: 1 })}%`
          }
          icon={<ChartPieSlice className="size-4" />}
          iconVariant="secondary"
        />
        <KpiTile
          label="Thời gian tuyển TB"
          value={
            data.avgDaysToHire === null ? (
              '—'
            ) : (
              <>
                {formatNumber(data.avgDaysToHire, { decimalPlaces: 1 })}{' '}
                <span className="text-sm font-medium text-neutral-500">ngày</span>
              </>
            )
          }
          icon={<Clock className="size-4" />}
          iconVariant="primary"
        />
      </div>

      <div className="shadow-elevation-1 flex flex-col gap-1 rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-neutral-900">Tỷ trọng ứng viên theo nguồn</h2>
        <p className="mb-4 text-xs text-neutral-500">
          Hiệu quả ở đây là hiệu suất phễu (hồ sơ → trúng tuyển), không phải lợi nhuận trên chi
          phí — hệ thống chưa lưu ngân sách chi cho từng kênh.
        </p>

        {isEmpty ? (
          <EmptyState
            icon={<ChartPieSlice className="size-10 text-neutral-300" weight="thin" />}
            title={ME_37}
            hint="Thử mở rộng khoảng thời gian hoặc bỏ bớt bộ lọc phòng ban / vị trí."
          />
        ) : (
          <SourceRoiPieChart rows={data.rows} totalApplications={data.totalApplications} />
        )}
      </div>

      {!isEmpty && (
        <>
          {data.bestSourceLabel && (
            <div className="flex items-start gap-2 rounded-lg border border-success-100 bg-success-50 px-4 py-3 text-sm">
              <Trophy className="text-success-600 mt-0.5 size-4 shrink-0" />
              <p className="text-neutral-700">
                Nguồn hiệu quả nhất:{' '}
                <span className="font-semibold text-neutral-900">{data.bestSourceLabel}</span>
                {data.bestSourceHireRate !== null && (
                  <>
                    {' '}
                    với tỷ lệ trúng tuyển{' '}
                    {formatNumber(data.bestSourceHireRate, { decimalPlaces: 1 })}%
                  </>
                )}
                . <span className="text-neutral-500">{MIN_SAMPLE_NOTE}.</span>
              </p>
            </div>
          )}
          <SourceRoiTable rows={data.rows} />
        </>
      )}
    </div>
  );
}

function ReportSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-lg" />
      <Skeleton className="h-48 rounded-lg" />
    </div>
  );
}
