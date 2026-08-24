export interface SourceDatum {
  label: string;
  percent: number;
  colorVar: string;
}

export interface SourceRoiDonutProps {
  data: SourceDatum[];
  total: number;
}

/** Hàm thuần (nằm ngoài component) tính chuỗi conic-gradient từ % cộng dồn. */
function buildConicSegments(data: SourceDatum[]): string {
  const segments: string[] = [];
  let cursor = 0;
  for (const d of data) {
    const start = cursor;
    cursor += d.percent;
    segments.push(`${d.colorVar} ${start}% ${cursor}%`);
  }
  return segments.join(', ');
}

/**
 * Donut chart tỷ trọng nguồn ứng viên (UC-42) — dựng bằng CSS conic-gradient,
 * không thêm thư viện chart cho 1 widget đơn giản. Màu categorical lấy từ
 * token sẵn có (primary/secondary/warning/neutral) theo đúng thứ tự cố định,
 * không tự sinh hue mới.
 */
export function SourceRoiDonut({ data, total }: SourceRoiDonutProps) {
  const conicGradient = buildConicSegments(data);

  return (
    <div className="flex items-center gap-6">
      <div
        className="relative size-32 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${conicGradient})` }}
      >
        <div className="bg-neutral-0 absolute inset-5 flex flex-col items-center justify-center rounded-full">
          <b className="text-xl font-bold text-neutral-900 tabular-nums">{total}</b>
          <span className="text-[10px] text-neutral-500">tổng CV</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5">
        {data.map((d) => (
          <div key={d.label} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-neutral-700">
              <span
                className="size-2.5 shrink-0 rounded-sm"
                style={{ background: d.colorVar }}
              />
              {d.label}
            </span>
            <span className="font-semibold text-neutral-900 tabular-nums">
              {d.percent}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
