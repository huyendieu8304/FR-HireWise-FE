import { Info, WarningOctagon } from '@phosphor-icons/react';
import { Badge } from '@/components/ui';
import { cn } from '@/utils/cn';
import { formatNumber } from '@/utils/formatters/number';
import type { StageVelocityRow } from '../types';

export interface StageVelocityTableProps {
  stages: StageVelocityRow[];
}

function days(value: number | null): string {
  return value === null ? '—' : formatNumber(value, { decimalPlaces: 1 });
}

function ratio(value: number | null): string {
  return value === null ? '—' : `${formatNumber(value, { decimalPlaces: 1 })}%`;
}

const COLUMNS = 'grid-cols-[2.1fr_repeat(8,minmax(0,1fr))]';

/**
 * UC-43: bảng chi tiết dưới biểu đồ cột.
 *
 * Ba nhóm cột trả lời ba câu hỏi khác nhau mà một cột trung bình không tách
 * được:
 * - TB / Trung vị / P90 / n: nhanh chậm ra sao, và con số đó đáng tin tới đâu.
 * - Đang chờ / Chờ lâu nhất: những hồ sơ vẫn đang mắc kẹt ngay lúc này, vốn
 *   không được tính vào trung bình vì chưa kết thúc.
 * - Vào / Đi tiếp / Bị loại / Tỷ lệ qua vòng: nghẽn dạng "rụng nhiều", một
 *   Stage xử lý trong một ngày nhưng loại 85% cũng là nghẽn.
 */
export function StageVelocityTable({ stages }: StageVelocityTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          <div
            className={cn(
              'grid gap-3 border-b border-neutral-200 bg-neutral-50 px-4 py-2.5 text-xs font-semibold text-neutral-600',
              COLUMNS,
            )}
          >
            <span>Stage</span>
            <span className="text-right">TB (ngày)</span>
            <span className="text-right">Trung vị</span>
            <span className="text-right">P90</span>
            <span className="text-right">Số lượt đã đo</span>
            <span className="text-right">Đang chờ</span>
            <span className="text-right">Chờ lâu nhất</span>
            <span className="text-right">Bị loại</span>
            <span className="text-right">Tỷ lệ qua vòng</span>
          </div>

          {stages.map((stage) => (
            <div
              key={stage.stageCode}
              className={cn(
                'grid items-center gap-3 border-b border-neutral-100 px-4 py-3 text-sm last:border-b-0',
                stage.bottleneck && 'bg-danger-50',
                COLUMNS,
              )}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate text-neutral-800">{stage.stageName}</span>
                {stage.slaBreached && (
                  <Badge
                    variant="danger"
                    title={`Ngưỡng SLA: ${days(stage.slaDays)} ngày`}
                  >
                    Vượt SLA
                  </Badge>
                )}
              </span>
              <span
                className={cn(
                  'text-right font-medium tabular-nums',
                  stage.bottleneck ? 'text-danger-700' : 'text-neutral-900',
                )}
              >
                {days(stage.avgDays)}
              </span>
              <span className="text-right tabular-nums text-neutral-600">
                {days(stage.medianDays)}
              </span>
              <span className="text-right tabular-nums text-neutral-600">
                {days(stage.p90Days)}
              </span>
              <span className="text-right tabular-nums text-neutral-500">
                {formatNumber(stage.completedCount)}
              </span>
              <span className="text-right tabular-nums text-neutral-600">
                {formatNumber(stage.waitingCount)}
              </span>
              <span className="text-right tabular-nums text-neutral-600">
                {days(stage.maxWaitingDays)}
              </span>
              <span className="text-right tabular-nums text-neutral-600">
                {formatNumber(stage.rejectedCount)}
              </span>
              <span className="text-right tabular-nums text-neutral-900">
                {ratio(stage.passThroughRate)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-2 border-t border-neutral-200 bg-neutral-50 px-4 py-2.5 text-xs text-neutral-500">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        <p>
          Trung bình, trung vị và P90 chỉ tính trên các lượt đã chuyển xong. Hồ sơ còn đang nằm
          trong Stage chưa có thời gian kết thúc nên được đếm riêng ở cột "Đang chờ" — nếu không
          tách ra, một Stage đang tắc cứng lại hiện ra số ngày trung bình rất đẹp.
        </p>
      </div>
    </div>
  );
}

export interface BottleneckBannerProps {
  stage: StageVelocityRow | undefined;
}

/** Câu kết luận của UC-43 bước 5: Stage nào cần điều tra, và vì sao lại là nó. */
export function BottleneckBanner({ stage }: BottleneckBannerProps) {
  if (!stage) return null;

  const reason = stage.slaBreached
    ? `vượt ngưỡng SLA ${days(stage.slaDays)} ngày đã cấu hình`
    : `chậm nhất pipeline trên ${formatNumber(stage.completedCount)} lượt đã đo`;

  return (
    <div className="border-danger-100 bg-danger-50 flex items-start gap-2 rounded-lg border px-4 py-3 text-sm">
      <WarningOctagon className="text-danger-600 mt-0.5 size-4 shrink-0" />
      <p className="text-neutral-700">
        Điểm nghẽn: <span className="font-semibold text-neutral-900">{stage.stageName}</span>, trung
        bình {days(stage.avgDays)} ngày — {reason}.
        {stage.waitingCount > 0 && (
          <> Hiện còn {formatNumber(stage.waitingCount)} hồ sơ đang nằm trong Stage này.</>
        )}
      </p>
    </div>
  );
}
