import { useQuery } from '@tanstack/react-query';
import { Clock, Gauge, Trophy, WarningCircle } from '@phosphor-icons/react';
import { EmptyState, Skeleton } from '@/components/ui';
import { KpiTile } from '@/features/dashboard/components/KpiTile';
import { formatNumber } from '@/utils/formatters/number';
import {
  downloadPipelineVelocityXlsx,
  getPipelineVelocityReport,
  toReportQueryParams,
} from '../api/reportsApi';
import { ExportXlsxButton } from './ExportXlsxButton';
import { StageVelocityBarChart } from './StageVelocityBarChart';
import { BottleneckBanner, StageVelocityTable } from './StageVelocityTable';
import { ME_37, type ReportFilterValue } from '../types';

export interface PipelineVelocityTabProps {
  filter: ReportFilterValue;
}

/**
 * UC-43 — "Xem Dashboard báo cáo tốc độ chuyển đổi giữa các Stage".
 *
 * Số ngày ở mỗi Stage được suy ra từ hiệu hai lần chuyển liên tiếp của cùng
 * một hồ sơ trong `application_stage_history` — bảng đó là log chỉ có một mốc
 * `changed_at`, không có cặp entered/exited. Chi tiết ở phía backend
 * (`ReportRepository#aggregateStageVelocity`).
 */
export function PipelineVelocityTab({ filter }: PipelineVelocityTabProps) {
  const params = toReportQueryParams(filter);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['reports', 'pipeline-velocity', params],
    queryFn: () => getPipelineVelocityReport(params),
  });

  if (isLoading) {
    return <VelocitySkeleton />;
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

  const isEmpty = data.stages.length === 0;
  const bottleneck = data.stages.find((stage) => stage.stageCode === data.bottleneckStageCode);
  const totalWaiting = data.stages.reduce((sum, stage) => sum + stage.waitingCount, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiTile
          label="Time-to-Hire TB"
          value={
            data.avgTimeToHireDays === null ? (
              '—'
            ) : (
              <>
                {formatNumber(data.avgTimeToHireDays, { decimalPlaces: 1 })}{' '}
                <span className="text-sm font-medium text-neutral-500">ngày</span>
              </>
            )
          }
          icon={<Clock className="size-4" />}
          iconVariant="secondary"
        />
        <KpiTile
          label="Tuyển thành công"
          value={formatNumber(data.hiredCount)}
          icon={<Trophy className="size-4" />}
          iconVariant="success"
        />
        <KpiTile
          label="Hồ sơ đang chờ trong pipeline"
          value={formatNumber(totalWaiting)}
          icon={<Gauge className="size-4" />}
          iconVariant="primary"
        />
      </div>

      <BottleneckBanner stage={bottleneck} />

      <div className="shadow-elevation-1 flex flex-col gap-1 rounded-lg border border-neutral-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">
              Thời gian trung bình ở mỗi Stage
            </h2>
            <p className="mb-4 text-xs text-neutral-500">
              Trục ngang là Stage theo đúng thứ tự pipeline, trục dọc là số ngày trung bình một
              hồ sơ nằm lại ở đó.
            </p>
          </div>
          <ExportXlsxButton
            download={() => downloadPipelineVelocityXlsx(params)}
            fileNamePrefix="pipeline-velocity"
            toDate={data.toDate}
            disabled={isEmpty}
          />
        </div>

        {isEmpty ? (
          <EmptyState
            icon={<Gauge className="size-10 text-neutral-300" weight="thin" />}
            title={ME_37}
            hint="Thử mở rộng khoảng thời gian hoặc bỏ bớt bộ lọc phòng ban / vị trí."
          />
        ) : (
          <StageVelocityBarChart stages={data.stages} />
        )}
      </div>

      {!isEmpty && <StageVelocityTable stages={data.stages} />}
    </div>
  );
}

function VelocitySkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-lg" />
      <Skeleton className="h-48 rounded-lg" />
    </div>
  );
}
