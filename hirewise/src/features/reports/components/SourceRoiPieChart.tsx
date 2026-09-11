import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { formatNumber } from '@/utils/formatters/number';
import { SOURCE_COLOR_VARS, type SourceRoiRow } from '../types';

export interface SourceRoiPieChartProps {
  rows: SourceRoiRow[];
  totalApplications: number;
}

interface Slice {
  label: string;
  value: number;
  share: number | null;
  hireRate: number | null;
  color: string;
}

/**
 * UC-42 REF 2 — biểu đồ tròn tỷ trọng ứng viên theo nguồn.
 *
 * Chỉ vẽ những nguồn thực sự có ứng viên: một kênh đã chia sẻ nhưng chưa mang
 * về hồ sơ nào có lát cắt bằng 0, vẽ ra chỉ làm rối vòng tròn. Kênh đó vẫn
 * xuất hiện đầy đủ ở bảng bên dưới, nơi con số 0 mới nói lên điều gì đó.
 *
 * Tooltip cố ý hiện cả số tuyệt đối lẫn tỷ lệ trúng tuyển: tỷ trọng to không
 * có nghĩa là nguồn tốt, và người đọc cần thấy hai con số đó cạnh nhau.
 */
export function SourceRoiPieChart({ rows, totalApplications }: SourceRoiPieChartProps) {
  const slices: Slice[] = rows
    .filter((row) => row.applicationCount > 0)
    .map((row, index) => ({
      label: row.label,
      value: row.applicationCount,
      share: row.applicationShare,
      hireRate: row.hireRate,
      color: SOURCE_COLOR_VARS[index % SOURCE_COLOR_VARS.length],
    }));

  return (
    <div className="flex flex-col items-center gap-6 md:flex-row">
      <div className="relative h-56 w-56 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="label"
              innerRadius="62%"
              outerRadius="100%"
              paddingAngle={1}
              stroke="none"
              isAnimationActive={false}
            >
              {slices.map((slice) => (
                <Cell key={slice.label} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip content={<SliceTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold text-neutral-900">
            {formatNumber(totalApplications)}
          </span>
          <span className="text-xs text-neutral-500">ứng viên</span>
        </div>
      </div>

      <ul className="flex w-full flex-col gap-2">
        {slices.map((slice) => (
          <li key={slice.label} className="flex items-center gap-2 text-sm">
            <span
              aria-hidden="true"
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: slice.color }}
            />
            <span className="flex-1 truncate text-neutral-700">{slice.label}</span>
            <span className="font-medium text-neutral-900">
              {slice.share === null ? '—' : `${slice.share}%`}
            </span>
            <span className="w-16 text-right text-xs text-neutral-500">
              {formatNumber(slice.value)} hồ sơ
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface SliceTooltipProps {
  active?: boolean;
  payload?: { payload: Slice }[];
}

function SliceTooltip({ active, payload }: SliceTooltipProps) {
  if (!active || !payload?.length) return null;
  const slice = payload[0].payload;
  return (
    <div className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-neutral-900">{slice.label}</p>
      <p className="mt-1 text-neutral-600">
        {formatNumber(slice.value)} ứng viên
        {slice.share !== null && ` · ${slice.share}% tổng số`}
      </p>
      <p className="text-neutral-600">
        Tỷ lệ trúng tuyển: {slice.hireRate === null ? '—' : `${slice.hireRate}%`}
      </p>
    </div>
  );
}
