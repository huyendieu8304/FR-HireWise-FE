import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatNumber } from '@/utils/formatters/number';
import type { StageVelocityRow } from '../types';

export interface StageVelocityBarChartProps {
  stages: StageVelocityRow[];
}

/**
 * UC-43 REF 2 — biểu đồ cột: trục X là Stage, trục Y là số ngày trung bình.
 *
 * Cột nghẽn tô đỏ. Nếu pipeline có cấu hình `sla_hours`, một đường tham chiếu
 * được vẽ ở ngưỡng SLA lớn nhất — nhờ vậy "nghẽn" là một phép so với mục tiêu
 * ai đó đã đặt ra, chứ không phải cảm giác cột nào trông cao.
 *
 * Chỉ những Stage đã có ít nhất một lượt chuyển hoàn tất mới có cột: Stage mà
 * mọi hồ sơ còn đang nằm trong đó chưa có số ngày nào đo được, và vẽ cột 0 sẽ
 * nói ngược hoàn toàn sự thật. Trạng thái đó nằm ở cột "Đang chờ" của bảng.
 */
export function StageVelocityBarChart({ stages }: StageVelocityBarChartProps) {
  const data = stages.filter((stage) => stage.avgDays !== null);
  const slaLine = Math.max(0, ...stages.map((stage) => stage.slaDays ?? 0));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-neutral-200)" vertical={false} />
          <XAxis
            dataKey="stageName"
            tick={{ fontSize: 12, fill: 'var(--color-neutral-500)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-neutral-200)' }}
          />
          {/* Khong gan label don vi len truc: no de len tick tren cung. Don vi
              da nam o tieu de bieu do va o tooltip. */}
          <YAxis
            tick={{ fontSize: 12, fill: 'var(--color-neutral-500)' }}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <Tooltip cursor={{ fill: 'var(--color-neutral-100)' }} content={<StageTooltip />} />
          {slaLine > 0 && (
            <ReferenceLine
              y={slaLine}
              stroke="var(--color-danger-500)"
              strokeDasharray="4 4"
              ifOverflow="extendDomain"
            >
              {/* "insideTopRight" chu khong phai "right": dat ngoai vung ve
                  thi nhan bi margin cat mat gan het. */}
              <Label
                value={`Ngưỡng SLA ${formatNumber(slaLine, { decimalPlaces: 1 })} ngày`}
                position="insideTopRight"
                fontSize={11}
                fill="var(--color-danger-500)"
              />
            </ReferenceLine>
          )}
          <Bar dataKey="avgDays" radius={[4, 4, 0, 0]} isAnimationActive={false} maxBarSize={64}>
            {data.map((stage) => (
              <Cell
                key={stage.stageCode}
                fill={
                  stage.bottleneck ? 'var(--color-danger-500)' : 'var(--color-primary-600)'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface StageTooltipProps {
  active?: boolean;
  payload?: { payload: StageVelocityRow }[];
}

function StageTooltip({ active, payload }: StageTooltipProps) {
  if (!active || !payload?.length) return null;
  const stage = payload[0].payload;
  return (
    <div className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-neutral-900">{stage.stageName}</p>
      <dl className="mt-1.5 grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5 text-neutral-600">
        <dt>Trung bình</dt>
        <dd className="text-right tabular-nums">{dayValue(stage.avgDays)}</dd>
        <dt>Trung vị</dt>
        <dd className="text-right tabular-nums">{dayValue(stage.medianDays)}</dd>
        <dt>P90</dt>
        <dd className="text-right tabular-nums">{dayValue(stage.p90Days)}</dd>
        <dt>Số lượt đã đo</dt>
        <dd className="text-right tabular-nums">{formatNumber(stage.completedCount)}</dd>
        <dt>Đang chờ</dt>
        <dd className="text-right tabular-nums">{formatNumber(stage.waitingCount)}</dd>
      </dl>
      {stage.medianDays !== null && stage.avgDays !== null && stage.avgDays > stage.medianDays * 1.5 && (
        <p className="mt-1.5 max-w-52 text-neutral-500">
          Trung bình cao hơn hẳn trung vị — phần lớn hồ sơ đi nhanh, chỉ vài hồ sơ bị bỏ quên
          kéo con số lên.
        </p>
      )}
    </div>
  );
}

function dayValue(value: number | null): string {
  return value === null ? '—' : `${formatNumber(value, { decimalPlaces: 1 })} ngày`;
}
