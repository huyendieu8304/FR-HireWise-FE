import { cn } from '@/utils/cn';

export interface VelocityDatum {
  stageLabel: string;
  days: number;
  isBottleneck?: boolean;
}

export interface PipelineVelocityChartProps {
  data: VelocityDatum[];
}

/**
 * Biểu đồ cột thời gian trung bình (Time-in-Stage) theo Stage — UC-43.
 * Dựng bằng CSS thuần (không thêm thư viện chart) vì đây là widget đơn giản
 * cho Dashboard tổng quan; khi build feature Reports đầy đủ (lọc, tooltip,
 * export) nên cân nhắc Recharts — hỏi ý kiến trước khi thêm dependency.
 */
export function PipelineVelocityChart({ data }: PipelineVelocityChartProps) {
  const maxDays = Math.max(...data.map((d) => d.days), 1);

  return (
    <div className="flex items-end gap-4 border-t border-neutral-100 pt-2">
      {data.map((d) => (
        <div key={d.stageLabel} className="flex flex-1 flex-col items-center gap-2">
          <span
            className={cn(
              'text-xs font-semibold tabular-nums',
              d.isBottleneck ? 'text-danger-700' : 'text-neutral-700',
            )}
          >
            {d.days}
          </span>
          {/* track có chiều cao cố định (h-40) để % height của bar bên trong
              tính đúng — % height không tự resolve được nếu cha là flex-col
              không có chiều cao tường minh. */}
          <div className="flex h-40 w-full max-w-10 items-end">
            <div
              className={cn(
                'w-full rounded-t',
                d.isBottleneck ? 'bg-danger-500' : 'bg-primary-500',
              )}
              style={{ height: `${Math.max((d.days / maxDays) * 100, 6)}%` }}
            />
          </div>
          <span className="text-center text-[11px] leading-tight text-neutral-500">
            {d.stageLabel}
          </span>
        </div>
      ))}
    </div>
  );
}
