import { Info } from '@phosphor-icons/react';
import { Badge } from '@/components/ui';
import { cn } from '@/utils/cn';
import { formatNumber } from '@/utils/formatters/number';
import type { SourceRoiRow } from '../types';

export interface SourceRoiTableProps {
  rows: SourceRoiRow[];
}

/** `null` nghĩa là "chưa đo được", khác hẳn 0 — in dấu gạch chứ không in số. */
function ratio(value: number | null): string {
  return value === null ? '—' : `${formatNumber(value, { decimalPlaces: 1 })}%`;
}

function days(value: number | null): string {
  return value === null ? '—' : `${formatNumber(value, { decimalPlaces: 1 })} ngày`;
}

const COLUMNS = 'grid-cols-[1.6fr_repeat(7,minmax(0,1fr))]';

/**
 * UC-42: bảng chi tiết dưới biểu đồ tròn.
 *
 * Biểu đồ chỉ trả lời được "hồ sơ đến từ đâu". Bảng này trả lời phần còn lại
 * của câu hỏi ngân sách: nguồn nào biến hồ sơ thành người trúng tuyển, nguồn
 * nào tốn nhiều click mà không ra hồ sơ, và nguồn nào tuyển nhanh hơn.
 */
export function SourceRoiTable({ rows }: SourceRoiTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
      <div className="overflow-x-auto">
        <div className="min-w-[860px]">
          <div
            className={cn(
              'grid gap-3 border-b border-neutral-200 bg-neutral-50 px-4 py-2.5 text-xs font-semibold text-neutral-600',
              COLUMNS,
            )}
          >
            <span>Nguồn</span>
            <span className="text-right">Ứng viên</span>
            <span className="text-right">Tỷ trọng</span>
            <span className="text-right">Trúng tuyển</span>
            <span className="text-right">Tỷ lệ trúng tuyển</span>
            <span className="text-right">Chia sẻ (trọn đời)</span>
            <span className="text-right">Click (trọn đời)</span>
            <span className="text-right">Thời gian tuyển TB</span>
          </div>

          {rows.map((row) => (
            <div
              key={row.sourceKey || 'direct'}
              className={cn(
                'grid items-center gap-3 border-b border-neutral-100 px-4 py-3 text-sm last:border-b-0',
                COLUMNS,
              )}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate text-neutral-800">{row.label}</span>
                {row.unknown && (
                  <Badge variant="neutral" title={`utm_source: ${row.sourceKey}`}>
                    Nguồn khác
                  </Badge>
                )}
              </span>
              <span className="text-right tabular-nums text-neutral-900">
                {formatNumber(row.applicationCount)}
              </span>
              <span className="text-right tabular-nums text-neutral-600">
                {ratio(row.applicationShare)}
              </span>
              <span className="text-right tabular-nums text-neutral-900">
                {formatNumber(row.hireCount)}
              </span>
              <span
                className={cn(
                  'text-right font-medium tabular-nums',
                  row.hireRate === null ? 'text-neutral-400' : 'text-neutral-900',
                )}
              >
                {ratio(row.hireRate)}
              </span>
              <span className="text-right tabular-nums text-neutral-600">
                {formatNumber(row.shareCount)}
              </span>
              <span className="text-right tabular-nums text-neutral-600">
                {formatNumber(row.clickCount)}
              </span>
              <span className="text-right tabular-nums text-neutral-600">
                {days(row.avgDaysToHire)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-2 border-t border-neutral-200 bg-neutral-50 px-4 py-2.5 text-xs text-neutral-500">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        <p>
          Hai cột "trọn đời" đếm toàn bộ lượt chia sẻ và click từ trước tới nay của các vị trí
          trong bộ lọc — bảng lưu số cộng dồn, không lưu thời điểm từng lượt, nên không lọc được
          theo khoảng thời gian như các cột còn lại.
        </p>
      </div>
    </div>
  );
}
